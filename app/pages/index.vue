<script setup lang="ts">
import type { Club, ClubsResponse } from "~/models/club";
import type { Team, TeamsResponse } from "~/models/team.ts";
import type {
  Meeting,
  MeetingGroup,
  MeetingsResponse,
} from "~/models/meeting.ts";
import { RoundType } from "~/enums/round-type.ts";

definePageMeta({
  layout: "home",
});

const search = ref("");
const clubs = ref<Club[]>([]);
const selectedClub = ref<Club>();
const teams = ref<Team[]>([]);
const meetings = ref<Meeting[]>([]);
const selectedTeam = ref<Team>();
const page = ref(1);
const clubsLoading = ref(false);
const scheduleLoading = ref(false);

const STORAGE_KEY_CLUB = "selectedClub";
const STORAGE_KEY_TEAM = "selectedTeam";

let restoring = false;

async function fetchClubs() {
  try {
    const res = await $fetch<ClubsResponse>("/api/clubs", {
      query: { name: search.value, page: page.value },
    });

    res.results = res.results.filter((e) => e.clubname !== "-kein-club-");

    clubs.value = res.results;
  } finally {
    clubsLoading.value = false;
  }
}

async function fetchTeams() {
  try {
    const res = await $fetch<TeamsResponse>("/api/teams", {
      query: {
        association: selectedClub.value?.organization_short,
        clubId: selectedClub.value?.clubnr,
      },
    });

    teams.value = res.data.teams_list.club_teams;
  } catch (error) {
    console.error(error);
  }
}

async function onTeamSelected() {
  try {
    scheduleLoading.value = true;
    const res = await $fetch<MeetingsResponse>("/api/team-schedule", {
      query: {
        association: selectedTeam.value?.team_organisation_short,
        groupId: selectedTeam.value?.group_id,
        teamId: selectedTeam.value?.team_id,
      },
    });

    meetings.value = res.data.meetings_excerpt.meetings.flatMap((group) =>
      Object.values(group).flat(),
    );
  } catch (error) {
    console.error(error);
  }
  scheduleLoading.value = false;

  if (restoring) return;
  if (!selectedTeam.value) {
    localStorage.removeItem(STORAGE_KEY_TEAM);
    return;
  }
  localStorage.setItem(STORAGE_KEY_TEAM, JSON.stringify(selectedTeam.value));
}

async function onClubSelected() {
  if (restoring) return;

  selectedTeam.value = undefined;
  meetings.value = [];

  if (!selectedClub.value) {
    teams.value = [];
    localStorage.removeItem(STORAGE_KEY_CLUB);
    localStorage.removeItem(STORAGE_KEY_TEAM);
    return;
  }

  localStorage.setItem(STORAGE_KEY_CLUB, JSON.stringify(selectedClub.value));
  localStorage.removeItem(STORAGE_KEY_TEAM);

  await fetchTeams();
}

async function restoreFromSession() {
  if (!import.meta.client) return;

  const savedClub = localStorage.getItem(STORAGE_KEY_CLUB);
  const savedTeam = localStorage.getItem(STORAGE_KEY_TEAM);

  if (!savedClub) return;

  restoring = true;
  try {
    selectedClub.value = JSON.parse(savedClub);
    await fetchTeams();

    if (savedTeam) {
      const parsedTeam: Team = JSON.parse(savedTeam);
      const match = teams.value.find((t) => t.team_id === parsedTeam.team_id);
      if (match) {
        selectedTeam.value = match;
        await onTeamSelected();
      }
    }
  } finally {
    restoring = false;
  }
}

onMounted(async () => {
  await restoreFromSession();
  await fetchClubs();
});

const activeRound = computed<string | undefined>(() => {
  if (meetings.value.length === 0) return undefined;

  const now = new Date();
  const isSameDay = (date: Date) =>
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  const todaysMeeting = meetings.value.find((m) => isSameDay(new Date(m.date)));

  if (todaysMeeting) {
    return todaysMeeting.round_type;
  }

  const pastMeetings = meetings.value
    .filter((m) => new Date(m.date).getTime() < now.getTime())
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (pastMeetings.length > 0) {
    return pastMeetings[0]!.round_type;
  }

  const futureMeetings = [...meetings.value].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  return futureMeetings[0]?.round_type;
});

const groupedByRound = computed<MeetingGroup[]>(() => {
  const groups = new Map<string, Meeting[]>();

  for (const meeting of meetings.value) {
    const key = meeting.round_type;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(meeting);
  }

  return Array.from(groups.entries()).map(([roundType, meetings]) => ({
    roundType,
    meetings,
  }));
});

let debounceTimer: ReturnType<typeof setTimeout>;

watch(search, () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(async () => await fetchClubs(), 300);
});

const selectedRoundTab = ref<string>();

watch(activeRound, (val) => {
  if (val !== undefined) {
    selectedRoundTab.value = val;
  }
});
</script>

<template>
  <v-container fluid class="fill-height d-flex flex-column">
    <v-card class="mb-4">
      <v-card-text>
        <v-row>
          <v-col cols="12" md="6">
            <v-autocomplete
              v-model="selectedClub"
              v-model:search="search"
              :items="clubs"
              :loading="clubsLoading"
              item-title="clubname"
              item-value="clubnr"
              label="Verein wählen"
              variant="outlined"
              clearable
              no-filter
              return-object
              @update:model-value="onClubSelected"
            >
              <template #item="{ props: itemProps, item }">
                <v-list-item
                  v-model="item.clubnr"
                  v-bind="itemProps"
                  :title="item.clubname"
                  :subtitle="item.organization_short"
                />
              </template>
              <template #no-data>
                <v-list-item>
                  <v-list-item-title>Keine Vereine gefunden</v-list-item-title>
                </v-list-item>
              </template>
            </v-autocomplete>
          </v-col>

          <v-col cols="12" md="6">
            <v-select
              v-model="selectedTeam"
              :disabled="!selectedClub"
              :items="teams"
              item-title="team_name"
              item-value="team_id"
              label="Mannschaft wählen"
              variant="outlined"
              dense
              no-filter
              return-object
              @update:model-value="onTeamSelected"
            >
              <template #item="{ props: itemProps, item }">
                <v-list-item
                  v-bind="itemProps"
                  :title="item.team_name"
                  :subtitle="item.league_name"
                />
              </template>
              <template #no-data>
                <v-list-item>
                  <v-list-item-title
                    >Keine Mannschaften gefunden</v-list-item-title
                  >
                </v-list-item>
              </template>
            </v-select>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
    <v-divider />
    <div class="table-wrapper">
      <v-tabs v-model="selectedRoundTab">
        <v-tab
          v-for="group in groupedByRound"
          :key="group.roundType"
          :value="group.roundType"
        >
          {{ RoundType[parseInt(group.roundType)] }}
        </v-tab>
      </v-tabs>

      <div v-if="scheduleLoading" ref="sentinel" class="pa-2 text-center">
        <v-progress-circular indeterminate color="primary" />
      </div>
      <v-tabs-window v-model="selectedRoundTab">
        <v-tabs-window-item
          v-for="group in groupedByRound"
          :key="group.roundType"
          :value="group.roundType"
        >
          <meeting-table
            v-if="!scheduleLoading"
            :meetings="group.meetings"
            :selected-club="selectedClub"
            :selected-team="selectedTeam"
          />
        </v-tabs-window-item>
      </v-tabs-window>
    </div>
  </v-container>
</template>

<style>
.v-input__details {
  display: none;
}

.fill-height {
  height: 100vh;
}

.table-wrapper {
  flex: 1;
  min-height: 0;
}
</style>

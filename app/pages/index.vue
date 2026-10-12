<script setup lang="ts">
import type { Club, ClubsResponse } from "~/models/club";
import type { Team, TeamsResponse } from "~/models/team.ts";
import type {
  Meeting,
  MeetingGroup,
  MeetingsResponse,
} from "~/models/meeting.ts";

definePageMeta({
  layout: "home",
});

const { showError } = useSnackbar();

const SEARCH_DEBOUNCE_MS = 700;

const search = ref("");
const debouncedSearch = ref("");
const searchPending = ref(false);
const page = ref(1);
const selectedClub = ref<Club>();
const selectedTeam = ref<Team>();
const selectedRoundTab = ref<number>();

const STORAGE_KEY_CLUB = "selectedClub";
const STORAGE_KEY_TEAM = "selectedTeam";

let restoring = false;
let debounceTimer: ReturnType<typeof setTimeout> | undefined;

watch(search, (val) => {
  clearTimeout(debounceTimer);

  const text = val ?? "";

  if (selectedClub.value && text === selectedClub.value.clubname) {
    searchPending.value = false;
    return;
  }

  searchPending.value = true;
  debounceTimer = setTimeout(() => {
    debouncedSearch.value = text;
    searchPending.value = false;
  }, SEARCH_DEBOUNCE_MS);
});

onBeforeUnmount(() => clearTimeout(debounceTimer));

const {
  data: clubsRaw,
  status: clubsStatus,
  error: clubsError,
} = useFetch<ClubsResponse>("/api/clubs", {
  query: { name: debouncedSearch },
  watch: [debouncedSearch, page],
  transform: (res) =>
      res.results.filter((e) => e.clubname !== "-kein-club-"),
});

const clubs = computed<Club[]>(() => clubsRaw.value ?? []);
const clubsLoading = computed(
  () => clubsStatus.value === "pending" || searchPending.value,
);

function errorMessage(text: string, err: unknown): string {
  const status =
      (err as { statusCode?: number; status?: number })?.statusCode ??
      (err as { status?: number })?.status;
  return status ? `${text} (Status ${status})` : text;
}

watch(clubsError, (err) => {
  if (err) showError(errorMessage("Vereine konnten nicht geladen werden.", err));
});

const {
  data: teamsRaw,
  execute: fetchTeamsExecute,
  error: teamsError,
} = useFetch<TeamsResponse>("/api/teams", {
  query: {
    association: computed(() => selectedClub.value?.organization_short),
    clubId: computed(() => selectedClub.value?.clubnr),
  },
  transform: (res) => res.data.teams_list.club_teams,
  immediate: false,
  watch: false,
});
const teams = computed<Team[]>(() => teamsRaw.value ?? []);

watch(teamsError, (err) => {
  if (err) showError(errorMessage("Mannschaften konnten nicht geladen werden.", err));
});

const {
  data: meetingsRaw,
  status: meetingsStatus,
  execute: fetchMeetingsExecute,
  error: meetingsError,
} = useFetch<MeetingsResponse>("/api/team-schedule", {
  query: {
    association: computed(() => selectedTeam.value?.team_organisation_short),
    groupId: computed(() => selectedTeam.value?.group_id),
    teamId: computed(() => selectedTeam.value?.team_id),
  },
  transform: (res) =>
      res.data.meetings_excerpt.meetings.flatMap((group) =>
          Object.values(group).flat(),
      ),
  immediate: false,
  watch: false,
});

const meetings = computed<Meeting[]>(() => meetingsRaw.value ?? []);
const scheduleLoading = computed(() => meetingsStatus.value === "pending");

watch(meetingsError, (err) => {
  if (err) showError(errorMessage("Spielplan konnte nicht geladen werden.", err));
});

async function onTeamSelected() {
  await fetchMeetingsExecute();

  if (restoring) return;
  if (!selectedTeam.value) {
    localStorage.removeItem(STORAGE_KEY_TEAM);
    return;
  }
  localStorage.setItem(STORAGE_KEY_TEAM, JSON.stringify(selectedTeam.value));
  selectedRoundTab.value = 0;
}

async function onClubSelected() {
  if (restoring) return;

  selectedTeam.value = undefined;

  if (!selectedClub.value) {
    localStorage.removeItem(STORAGE_KEY_CLUB);
    localStorage.removeItem(STORAGE_KEY_TEAM);
    return;
  }

  localStorage.setItem(STORAGE_KEY_CLUB, JSON.stringify(selectedClub.value));
  localStorage.removeItem(STORAGE_KEY_TEAM);

  await fetchTeamsExecute();
}

async function restoreFromSession() {
  if (!import.meta.client) return;

  const savedClub = localStorage.getItem(STORAGE_KEY_CLUB);
  const savedTeam = localStorage.getItem(STORAGE_KEY_TEAM);

  if (!savedClub) return;

  restoring = true;
  try {
    selectedClub.value = JSON.parse(savedClub);
    await fetchTeamsExecute();

    if (savedTeam) {
      const parsedTeam: Team = JSON.parse(savedTeam);
      const match = teams.value?.find(
          (t) => t.team_id === parsedTeam.team_id,
      );
      if (match) {
        selectedTeam.value = match;
        await fetchMeetingsExecute();
      }
    }
  } finally {
    restoring = false;
    selectedRoundTab.value = 0;
  }
}

onMounted(async () => {
  await restoreFromSession();
});

type RoundGroup = MeetingGroup & { label: string };

const ROUND_TYPE_VORRUNDE = 0;
const ROUND_TYPE_RUECKRUNDE = 1;

function roundKey(meeting: Meeting): string {
  const type = parseInt(meeting.round_type);
  if (type === ROUND_TYPE_VORRUNDE || type === ROUND_TYPE_RUECKRUNDE) {
    return `type:${type}`;
  }
  return `name:${meeting.round_name}`;
}

function roundLabel(meeting: Meeting): string {
  const type = parseInt(meeting.round_type);
  if (type === ROUND_TYPE_VORRUNDE) return "Vorrunde";
  if (type === ROUND_TYPE_RUECKRUNDE) return "Rückrunde";
  return meeting.round_name;
}

const groupedByRound = computed<RoundGroup[]>(() => {
  const groups = new Map<string, RoundGroup>();

  for (const meeting of meetings.value ?? []) {
    const key = roundKey(meeting);
    let group = groups.get(key);
    if (!group) {
      group = { roundType: key, label: roundLabel(meeting), meetings: [] };
      groups.set(key, group);
    }
    group.meetings.push(meeting);
  }

  return Array.from(groups.values());
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
              autocomplete="off"
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
              autocomplete="off"
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
          v-for="(group, index) in groupedByRound"
          :key="group.roundType"
          :value="index"
        >
          {{ group.label }}
        </v-tab>
      </v-tabs>

      <div v-if="scheduleLoading" ref="sentinel" class="pa-2 text-center">
        <v-progress-circular indeterminate color="primary" />
      </div>
      <v-tabs-window v-model="selectedRoundTab">
        <v-tabs-window-item
          v-for="(group, index) in groupedByRound"
          :key="group.roundType"
          :value="index"
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

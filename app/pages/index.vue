<script setup lang="ts">
import { formatDate } from "~/composables/useDateUtils.ts";

interface Club {
  external_id: string;
  clubname: string;
  clubnr: string;
  organization_id: number;
  organization_name: string;
  organization_short: string;
}

interface Team {
  season: string;
  team_id: string;
  team_name: string;
  group_id: string;
  league_name: string;
  team_organisation_short: string;
}

interface Meeting {
  date: string;
  live: boolean;
  team_home: string;
  team_away: string;
  meeting_id: string;
  is_meeting_completed: string;
}

interface ClubsResponse {
  results: Club[];
  total_count: number;
  pages_count: number;
  page: number;
  pagesize: number;
}

interface TeamsResponse {
  data: {
    teams_list: {
      club_teams: Team[];
    };
  };
}

interface MeetingGroup {
  [date: string]: Meeting[];
}

interface MeetingsResponse {
  data: {
    table: {};
    head_infos: {};
    meetings_excerpt: {
      meetings: MeetingGroup[];
    };
  };
}

const router = useRouter();
const search = ref("");
const clubs = ref<Club[]>([]);
const selectedClub = ref<Club>();
const teams = ref<Team[]>([]);
const meetings = ref<Meeting[]>([]);
const selectedTeam = ref<Team | null>();
const page = ref(1);
const totalPages = ref(1);
const loading = ref(false);
const scheduleLoading = ref(false);
const meetingHeaders = [
  { title: "Live", value: "live" },
  {
    title: "Datum",
    key: "date",
    value: (item: Meeting) => formatDate(item.date),
  },
  { title: "Heim-Mannschaft", value: "team_home" },
  { title: "Auswährts-Mannschaft", value: "team_away" },
];

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
    totalPages.value = res.pages_count;
  } finally {
    loading.value = false;
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
}

async function restoreFromSession() {
  if (!import.meta.client) return;

  const savedClub = sessionStorage.getItem(STORAGE_KEY_CLUB);
  const savedTeam = sessionStorage.getItem(STORAGE_KEY_TEAM);

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

function onMeetingClick(_: any, item: {item: Meeting}) {
  router.push(`/meetings/${item.item.meeting_id}`)
}

onMounted(async () => {
  await fetchClubs();
  await restoreFromSession();
});

let debounceTimer: ReturnType<typeof setTimeout>;

watch(search, () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => fetchClubs(), 300);
});

watch(selectedClub, async (club) => {
  if (restoring) return;

  selectedTeam.value = null;
  meetings.value = [];

  if (!club) {
    teams.value = [];
    sessionStorage.removeItem(STORAGE_KEY_CLUB);
    sessionStorage.removeItem(STORAGE_KEY_TEAM);
    return;
  }

  sessionStorage.setItem(STORAGE_KEY_CLUB, JSON.stringify(club));
  sessionStorage.removeItem(STORAGE_KEY_TEAM);

  await fetchTeams();
});

watch(selectedTeam, (team) => {
  if (restoring) return;

  if (!team) {
    sessionStorage.removeItem(STORAGE_KEY_TEAM);
    return;
  }

  sessionStorage.setItem(STORAGE_KEY_TEAM, JSON.stringify(team));
});

watch(search, () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => fetchClubs(), 300);
});

watch(selectedClub, async (club) => {
  selectedTeam.value = null;
  if (!club) {
    teams.value = [];
    return;
  }

  await fetchTeams();
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
                :loading="loading"
                item-title="clubname"
                item-value="clubnr"
                label="Verein wählen"
                variant="outlined"
                clearable
                no-filter
                return-object
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
                  <v-list-item-title>Zuerst Verein wählen</v-list-item-title>
                </v-list-item>
              </template>
            </v-select>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
    <v-divider />
    <div class="table-wrapper">
      <div v-if="scheduleLoading" ref="sentinel" class="pa-2 text-center">
        <v-progress-circular indeterminate size="20" color="primary" />
      </div>
      <v-data-table
          v-else
          :headers="meetingHeaders"
          :items="meetings"
          :items-per-page="-1"
          no-data-text="Keine Spiele vorhanden!"
          fixed-header
          height="100%"
          hide-default-footer
          @click:row="onMeetingClick"
      >
        <template #item.live="{ item }">
          <v-chip v-if="item.live" color="red" size="small" variant="flat">
            LIVE
          </v-chip>

          <v-icon
              v-else-if="item.is_meeting_completed"
              color="green"
              icon="mdi-check-circle"
          />

          <v-icon v-else color="grey" icon="mdi-clock-outline" />
        </template>
      </v-data-table>
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
  overflow: auto;
}
</style>

<script setup lang="ts">
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
  [date: string]: Meeting[]
}

interface MeetingsResponse {
  data: {
    table: {},
    head_infos: {},
    meetings_excerpt: {
      meetings: MeetingGroup[]
    };
  };
}

const search = ref("");
const clubs = ref<Club[]>([]);
const selectedClub = ref<Club>();
const teams = ref<Team[]>([]);
const meetings = ref<Team[]>([]);
const selectedTeam = ref<Team>();
const page = ref(1);
const totalPages = ref(1);
const loading = ref(false);
const meetingHeaders = [
  { title: 'Live', value: 'live' },
  { title: 'Datum', value: 'date' },
  { title: 'Heim-Mannschaft', value: 'team_home' },
  { title: 'Auswährts-Mannschaft', value: 'team_away' },
  { title: 'Ergebnis', value: 'team_away' },
];

async function fetchClubs() {
  try {
    const res = await $fetch<ClubsResponse>("/api/clubs", {
      query: { name: search.value, page: page.value },
    });

    res.results = res.results.filter((e) => e.clubname !== "-kein-club-");

    clubs.value = res.results
    totalPages.value = res.pages_count;
  } finally {
    loading.value = false;
  }
}

async function fetchTeams() {
  try {
    console.log(selectedClub.value);
    const res = await $fetch<TeamsResponse>("/api/teams", {
      query: {
        association: selectedClub.value.organization_short,
        clubId: selectedClub.value.clubnr,
      },
    });

    teams.value = res.data.teams_list.club_teams;
  } catch (error) {
    console.error(error);
  }
}

async function onTeamSelected() {
  try {
    console.log(selectedClub.value);
    const res = await $fetch<MeetingsResponse>("/api/team-schedule", {
      query: {
        association: selectedTeam.value?.team_organisation_short,
        groupId: selectedTeam.value?.group_id,
        teamId: selectedTeam.value?.team_id,
      },
    });

    meetings.value = res.data.meetings_excerpt.meetings.flatMap(group =>
        Object.values(group).flat()
    )
    console.log(meetings.value)
  } catch (error) {
    console.error(error);
  }
}

onMounted(() => fetchClubs());

let debounceTimer: ReturnType<typeof setTimeout>;
watch(search, () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => fetchClubs(true), 300);
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
  <v-container class="fill-height" fluid>
    <v-row justify="center" align="center">
      <v-col cols="12" sm="8" md="6" lg="4">
        <p class="text-h6 mb-2">Wähle deinen Verein</p>

        <v-autocomplete
          v-model="selectedClub"
          v-model:search="search"
          :items="clubs"
          :loading="loading"
          item-title="clubname"
          item-value="clubnr"
          label="Verein suchen"
          variant="outlined"
          clearable
          no-filter
          return-object
        >
          <template #append-item>
            <div ref="sentinel" class="pa-2 text-center">
              <v-progress-circular
                v-if="loadingMore"
                indeterminate
                size="20"
                color="primary"
              />
            </div>
          </template>
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

        <p class="text-h6 mb-2">Mannschaft</p>
        <v-select
          v-model="selectedTeam"
          :items="teams"
          item-title="team_name"
          item-value="team_id"
          label="Mannschaft auswählen"
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
              <v-list-item-title>Keine Mannschaften gefunden</v-list-item-title>
            </v-list-item>
          </template>
        </v-select>
      </v-col>
    </v-row>
    <v-divider />
    <v-row>
      <v-col cols="12">
        <v-data-table :headers="meetingHeaders" :items="meetings" hide-default-footer>
          <template #item.live="{ item }">
            <v-chip
                v-if="item.live"
                color="red"
                size="small"
                variant="flat"
            >
              LIVE
            </v-chip>

            <v-icon
                v-else-if="item.is_match_completed"
                color="green"
                icon="mdi-check-circle"
            />

            <v-icon
                v-else
                color="grey"
                icon="mdi-clock-outline"
            />
          </template>
        </v-data-table>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.fill-height {
  min-height: 100vh;
}
</style>

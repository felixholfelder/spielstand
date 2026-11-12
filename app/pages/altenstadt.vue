<script setup lang="ts">
import type { ScheduleMeeting } from "~~/server/api/altenstadt-schedule.get";

definePageMeta({
  layout: "home",
});

const { showError } = useSnackbar();

const STORAGE_KEY_TEAM = "selectedTeam";

const selectedTeam = ref<string | null>(null);
const selectedMonthTab = ref<string>();

const { data, status, error } = useFetch<{ meetings: ScheduleMeeting[] }>(
    "/api/altenstadt-schedule",
);

const loading = computed(() => status.value === "pending");
const meetings = computed<ScheduleMeeting[]>(() => data.value?.meetings ?? []);

watch(error, (err) => {
  if (err) showError("Spielplan konnte nicht geladen werden.");
});

const teams = computed<string[]>(() =>
    [...new Set(meetings.value.map((m) => m.team))].sort((a, b) =>
        a.localeCompare(b, "de", { numeric: true }),
    ),
);

const filteredMeetings = computed(() =>
    selectedTeam.value
        ? meetings.value.filter((m) => m.team === selectedTeam.value)
        : meetings.value,
);

interface MonthGroup {
  key: string; // YYYY-MM
  label: string;
  meetings: ScheduleMeeting[];
}

const groupedByMonth = computed<MonthGroup[]>(() => {
  const groups = new Map<string, MonthGroup>();

  for (const meeting of filteredMeetings.value) {
    const key = meeting.date.slice(0, 7);
    let group = groups.get(key);
    if (!group) {
      const [y, mo] = key.split("-").map(Number);
      group = {
        key,
        label: new Date(y, mo - 1, 1).toLocaleDateString("de-DE", {
          month: "long",
          year: "numeric",
        }),
        meetings: [],
      };
      groups.set(key, group);
    }
    group.meetings.push(meeting);
  }

  return [...groups.values()];
});

// Tab zurücksetzen, wenn sich die Gruppen ändern
watch(
    groupedByMonth,
    (groups) => {
      if (!groups.some((g) => g.key === selectedMonthTab.value)) {
        selectedMonthTab.value = groups[0]?.key;
      }
    },
    { immediate: true },
);

function onTeamSelected() {
  if (selectedTeam.value) {
    localStorage.setItem(STORAGE_KEY_TEAM, selectedTeam.value);
  } else {
    localStorage.removeItem(STORAGE_KEY_TEAM);
  }
}

onMounted(() => {
  const saved = localStorage.getItem(STORAGE_KEY_TEAM);
  if (saved) selectedTeam.value = saved;
});

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

function openMeeting(meeting: ScheduleMeeting) {
  // matchId als Route-Param, der Rest als Query für den Score-Endpunkt
  return navigateTo({
    path: `/meetings/${meeting.matchId}`,
    query: {
      association: meeting.association,
      season: meeting.season,
      league: meeting.league,
      groupId: meeting.groupId,
    },
  });
}
</script>

<template>
  <v-container fluid class="fill-height d-flex flex-column">
    <v-card class="mb-4">
      <v-card-text>
        <v-select
            v-model="selectedTeam"
            :items="teams"
            :loading="loading"
            label="Mannschaft wählen (leer = alle)"
            variant="outlined"
            clearable
            @update:model-value="onTeamSelected"
        />
      </v-card-text>
    </v-card>
    <v-divider />

    <div class="table-wrapper">
      <div v-if="loading" class="pa-2 text-center">
        <v-progress-circular indeterminate color="primary" />
      </div>

      <template v-else>
        <v-tabs v-model="selectedMonthTab">
          <v-tab v-for="group in groupedByMonth" :key="group.key" :value="group.key">
            {{ group.label }}
          </v-tab>
        </v-tabs>

        <v-tabs-window v-model="selectedMonthTab">
          <v-tabs-window-item
              v-for="group in groupedByMonth"
              :key="group.key"
              :value="group.key"
          >
            <v-table>
              <thead>
              <tr>
                <th>Datum</th>
                <th>Zeit</th>
                <th v-if="!selectedTeam">Mannschaft</th>
                <th>Heim</th>
                <th>Gast</th>
                <th />
              </tr>
              </thead>
              <tbody>
              <tr v-for="meeting in group.meetings" :key="meeting.matchId">
                <td>{{ formatDate(meeting.date) }}</td>
                <td>{{ meeting.time }}</td>
                <td v-if="!selectedTeam">{{ meeting.team }}</td>
                <td :class="{ 'font-weight-bold': meeting.isHome }">{{ meeting.home }}</td>
                <td :class="{ 'font-weight-bold': !meeting.isHome }">{{ meeting.guest }}</td>
                <td class="text-right">
                  <v-btn size="small" variant="tonal" @click="openMeeting(meeting)">
                    Live
                  </v-btn>
                </td>
              </tr>
              </tbody>
            </v-table>
          </v-tabs-window-item>
        </v-tabs-window>

        <div v-if="groupedByMonth.length === 0" class="pa-4 text-center">
          Keine Spiele gefunden
        </div>
      </template>
    </div>
  </v-container>
</template>

<style>
.fill-height {
  height: 100vh;
}

.table-wrapper {
  flex: 1;
  min-height: 0;
  width: 100%;
}
</style>

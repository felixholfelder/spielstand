<script setup lang="ts">
import type { Meeting } from "~/models/meeting.ts";
import type { Club } from "~/models/club.ts";
import type { Team } from "~/models/team.ts";
import { formatDate } from "~/composables/useDateUtils.ts";

defineProps<{
  meetings: Meeting[];
  selectedClub: Club | undefined;
  selectedTeam: Team | undefined;
}>();

const router = useRouter();
const meetingHeaders = [
  { title: "Status", value: "live" },
  {
    title: "Datum",
    key: "date",
    value: (item: Meeting) => formatDate(item.date),
  },
  { title: "Heim", value: "team_home" },
  { title: "Gast", value: "team_away" },
  {
    title: "Ergebnis",
    key: "matches_won",
    value: (item: Meeting) => `${item.matches_won}:${item.matches_lost}`,
  },
];

function onMeetingClick(_: any, item: { item: Meeting }) {
  router.push(`/meetings/${item.item.meeting_id}`);
}
</script>

<template>
  <div>
    <v-data-table
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
          v-else-if="item.is_meeting_complete"
          color="green"
          icon="mdi-check-circle"
        />

        <v-icon v-else color="grey" icon="mdi-clock-outline" />
      </template>
      <template #item.team_home="{ item }">
        <div
          :class="{
            'font-weight-bold': item.team_home_id == selectedTeam?.team_id,
          }"
        >
          {{ item.team_home }}
        </div>
      </template>
      <template #item.team_away="{ item }">
        <div
          :class="{
            'font-weight-bold': item.team_away_id == selectedTeam?.team_id,
          }"
        >
          {{ item.team_away }}
        </div>
      </template>
    </v-data-table>
  </div>
</template>

<style scoped></style>

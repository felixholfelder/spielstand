<script setup lang="ts">
import type { LiveMeeting, LiveMeetingsResponse } from "~/models/live-meeting";
import type { MeetingsResponse } from "~/models/meeting.ts";

definePageMeta({
  layout: "meeting",
});

const route = useRoute();

function queryString(key: string): string | undefined {
  const value = route.query[key];
  return typeof value === "string" && value !== "" ? value : undefined;
}

async function loadMeeting(): Promise<LiveMeeting> {
  const res = await $fetch<LiveMeetingsResponse>("/api/meetings", {
    query: {
      meetingId: route.params.meetingId,
    },
  });

  return res.data;
}

// Logo-IDs werden erst hier geladen, nicht schon für jede Zeile der Liste
const homeLogoId = ref<string>();
const awayLogoId = ref<string>();

async function fetchClubLogoId(teamId?: string): Promise<string | undefined> {
  const association = queryString("team_association");
  const groupId = queryString("group_id");
  if (!teamId || !association || !groupId) return undefined;

  try {
    const res = await $fetch<MeetingsResponse>("/api/team-schedule", {
      query: { association, groupId, teamId },
    });
    return res.data.head_infos.club_logo_id;
  } catch (error) {
    // Ohne Logo zeigt das Scoreboard einfach den Teamnamen
    console.error(error);
    return undefined;
  }
}

onMounted(async () => {
  const [home, away] = await Promise.all([
    fetchClubLogoId(queryString("home_team_id")),
    fetchClubLogoId(queryString("away_team_id")),
  ]);
  homeLogoId.value = home;
  awayLogoId.value = away;
});
</script>

<template>
  <meeting-scoreboard
    :load="loadMeeting"
    :home-logo-id="homeLogoId"
    :away-logo-id="awayLogoId"
  />
</template>

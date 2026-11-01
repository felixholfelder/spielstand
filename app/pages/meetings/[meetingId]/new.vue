<script setup lang="ts">
import type { LiveMeeting, LiveMeetingsResponse } from "~/models/live-meeting.ts";

definePageMeta({
  layout: "meeting",
});

const route = useRoute();

async function loadViaScoreApi(): Promise<LiveMeeting> {
  const meetingId = route.params.meetingId;

  const query = {
    association: route.query.association,
    season: route.query.season,
    league: "x",
    groupId: route.query.group_id,
    matchId: meetingId,
  };

  const [score, res] = await Promise.all([
    $fetch<{ home: number; guest: number }>("/api/score", { query }),
    $fetch<LiveMeetingsResponse>("/api/meetings", { query: { meetingId } }),
  ]);

  return {
    matches_home: score.home,
    matches_guest: score.guest,
    team_home: res.data.team_home,
    team_guest: res.data.team_guest,
  };
}
</script>

<template>
  <MeetingScoreboard :load="loadViaScoreApi" />
</template>

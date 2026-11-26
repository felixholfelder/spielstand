<script setup lang="ts">
import type { LiveMeeting, LiveMeetingsResponse } from "~/models/live-meeting";

definePageMeta({
  layout: "meeting",
});

const route = useRoute();

async function loadMeeting(): Promise<LiveMeeting> {
  const res = await $fetch<LiveMeetingsResponse>("/api/meetings", {
    query: {
      meetingId: route.params.meetingId,
    },
  });

  return {
    ...res.data,
    play_mode: route.query.play_mode,
  }
}
</script>

<template>
  <meeting-scoreboard :load="loadMeeting" />
</template>

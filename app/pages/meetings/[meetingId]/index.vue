<script setup lang="ts">
import type { LiveMeeting, LiveMeetingsResponse } from "~/models/live-meeting";

definePageMeta({
  layout: "meeting",
});

const route = useRoute();

async function loadMeeting(): Promise<LiveMeeting> {
  const meetingId = route.params.meetingId;

  try {
    const res = await $fetch<LiveMeetingsResponse>("/api/meetings", {
      query: {
        meetingId: meetingId,
      },
    });

    return res.data;
  } catch (error) {
    console.error(error);
  }
}
</script>

<template>
  <meeting-scoreboard :load="loadMeeting" />
</template>

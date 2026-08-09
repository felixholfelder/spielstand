<script setup lang="ts">
import type { LiveMeeting, LiveMeetingsResponse } from "~/models/live-meeting";
import { useGamesCountFontSize } from "~/composables/useGamesCountFontsize.ts";

definePageMeta({
  layout: "meeting",
});

const route = useRoute();

const liveMeeting = ref<LiveMeeting>();

const { fontSize: gamesCountFontSize } = useGamesCountFontSize();

async function loadMeeting() {
  const meetingId = route.params.meetingId;

  try {
    const res = await $fetch<LiveMeetingsResponse>("/api/meetings", {
      query: {
        meetingId: meetingId,
      },
    });

    liveMeeting.value = res.data;
  } catch (error) {
    console.error(error);
  }
}

onMounted(async () => {
  await loadMeeting();

  setInterval(async () => await loadMeeting(), 60 * 1000);
});
</script>

<template>
  <v-container fluid class="fill-height d-flex flex-column">
    <v-row align="center" no-gutters class="flex-grow-1" @click="loadMeeting">
      <v-col class="text-center">
        <div
          class="games-count"
          :style="{ fontSize: `${gamesCountFontSize}px` }"
        >
          {{ liveMeeting?.games_home }}
        </div>
        <div class="team">{{ liveMeeting?.team_home }}</div>
      </v-col>

      <v-divider vertical :thickness="3" class="border-opacity-100" gradient />

      <v-col class="text-center">
        <div
          class="games-count"
          :style="{ fontSize: `${gamesCountFontSize}px` }"
        >
          {{ liveMeeting?.games_guest }}
        </div>
        <div class="team">{{ liveMeeting?.team_guest }}</div>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.v-row.flex-grow-1 {
  cursor: pointer;
  min-height: 100vh;
}

.games-count {
  font-weight: 700;
  line-height: 1;
}

.team {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 90%;
  margin: 0 auto;
  font-size: clamp(20px, 3vw, 260px);
}
</style>

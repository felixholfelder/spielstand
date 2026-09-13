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

let intervalId: ReturnType<typeof setInterval> | undefined;

onMounted(async () => {
  await loadMeeting();

  intervalId = setInterval(async () => await loadMeeting(), 120 * 1000);
});

onUnmounted(() => {
  if (intervalId) {
    clearInterval(intervalId);
  }
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
          {{ liveMeeting?.matches_home }}
        </div>
        <div class="team">{{ liveMeeting?.team_home }}</div>
      </v-col>

      <v-col class="separator-col" cols="auto">
        <div
          class="separator"
          :style="{ fontSize: `${gamesCountFontSize * 0.55}px` }"
        >
          :
        </div>
      </v-col>

      <v-col class="text-center">
        <div
          class="games-count"
          :style="{ fontSize: `${gamesCountFontSize}px` }"
        >
          {{ liveMeeting?.matches_guest }}
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
  flex-wrap: nowrap;
}

.v-row.flex-grow-1 > .v-col {
  min-width: 0;
}

.games-count {
  font-weight: 700;
  line-height: 1;
}

.separator-col {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  padding: 0 0.2em;
}

.separator {
  font-weight: 700;
  line-height: 1;
  opacity: 0.85;
  margin-bottom: 64px;
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

<script setup lang="ts">
import type { LiveMeeting } from "~/models/live-meeting";
import { useGamesCountFontSize } from "~/composables/useGamesCountFontsize.ts";
import { clubLogoUrl } from "~/composables/useClubLogo.ts";

const { meetingFetchError } = useLayoutControls();

const props = withDefaults(
  defineProps<{
    load: () => Promise<LiveMeeting>;
    intervalMinutes?: number;
    homeLogoId?: string;
    awayLogoId?: string;
  }>(),
  { intervalMinutes: 1 },
);

const { fontSize: gamesCountFontSize } = useGamesCountFontSize();

const liveMeeting = ref<LiveMeeting>();

// Wenn ein Logo nicht geladen werden kann, wird wieder der Teamname gezeigt
const homeLogoFailed = ref(false);
const awayLogoFailed = ref(false);

watch(
  () => props.homeLogoId,
  () => (homeLogoFailed.value = false),
);
watch(
  () => props.awayLogoId,
  () => (awayLogoFailed.value = false),
);

const showHomeLogo = computed(
  () => !!props.homeLogoId && !homeLogoFailed.value,
);
const showAwayLogo = computed(
  () => !!props.awayLogoId && !awayLogoFailed.value,
);

async function loadMeeting() {
  try {
    liveMeeting.value = await props.load();
    meetingFetchError.value = "";
  } catch (error) {
    console.error(error);
    meetingFetchError.value = error;
  }
}

let intervalId: ReturnType<typeof setInterval> | undefined;

onMounted(async () => {
  await loadMeeting();
  intervalId = setInterval(loadMeeting, props.intervalMinutes * 60 * 1000);
});

onUnmounted(() => {
  if (intervalId) clearInterval(intervalId);
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
        <img
          v-if="showHomeLogo"
          :src="clubLogoUrl(homeLogoId)"
          :alt="liveMeeting?.team_home"
          class="team-logo"
          @error="homeLogoFailed = true"
        >
        <div v-else class="team">{{ liveMeeting?.team_home }}</div>
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
        <img
          v-if="showAwayLogo"
          :src="clubLogoUrl(awayLogoId)"
          :alt="liveMeeting?.team_guest"
          class="team-logo"
          @error="awayLogoFailed = true"
        >
        <div v-else class="team">{{ liveMeeting?.team_guest }}</div>
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

.team-logo {
  display: block;
  margin: 0 auto;
  width: auto;
  max-width: 90%;
  height: clamp(60px, 12vw, 400px);
  object-fit: contain;
}
</style>

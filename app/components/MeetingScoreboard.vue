<script setup lang="ts">
import type { LiveMeeting } from "~/models/live-meeting";
import { useGamesCountFontSize } from "~/composables/useGamesCountFontsize.ts";
import { clubLogoUrl } from "~/composables/useClubLogo.ts";

const { meetingFetchError } = useLayoutControls();

const props = withDefaults(
    defineProps<{
      load: () => Promise<LiveMeeting>;
      intervalMinutes?: number;
    }>(),
    { intervalMinutes: 1 },
);

const { fontSize: gamesCountFontSize } = useGamesCountFontSize();

const liveMeeting = ref<LiveMeeting>();

const homeLogoId = computed(() => liveMeeting.value?.home_logo_id);
const awayLogoId = computed(() => liveMeeting.value?.guest_logo_id);

// Ein Logo, das nicht geladen werden kann, wird einfach nicht angezeigt
const homeLogoFailed = ref(false);
const awayLogoFailed = ref(false);

watch(homeLogoId, () => (homeLogoFailed.value = false));
watch(awayLogoId, () => (awayLogoFailed.value = false));

const showHomeLogo = computed(
    () => !!homeLogoId.value && !homeLogoFailed.value,
);
const showAwayLogo = computed(
    () => !!awayLogoId.value && !awayLogoFailed.value,
);

// Glückwunsch-Popup, sobald das Spiel beendet ist
const isComplete = computed(
    () => liveMeeting.value?.is_meeting_complete === true,
);

const winner = computed(() => {
  const m = liveMeeting.value;
  if (!m) return undefined;
  if (m.matches_home > m.matches_guest) {
    return { name: m.team_home, logoId: homeLogoId.value };
  }
  if (m.matches_guest > m.matches_home) {
    return { name: m.team_guest, logoId: awayLogoId.value };
  }
  return undefined; // Unentschieden
});

const showCelebration = ref(false);
let celebrated = false; // pro Seitenaufruf nur einmal, auch bei jedem Refresh

watch(isComplete, (complete) => {
  if (complete && !celebrated) {
    celebrated = true;
    showCelebration.value = true;
  }
});

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
        <div class="team-row">
          <img
              v-if="showHomeLogo"
              :src="clubLogoUrl(homeLogoId)"
              alt=""
              class="team-logo"
              @error="homeLogoFailed = true"
          >
          <div class="team">{{ liveMeeting?.team_home }}</div>
        </div>
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
        <div class="team-row">
          <img
              v-if="showAwayLogo"
              :src="clubLogoUrl(awayLogoId)"
              alt=""
              class="team-logo"
              @error="awayLogoFailed = true"
          >
          <div class="team">{{ liveMeeting?.team_guest }}</div>
        </div>
      </v-col>
    </v-row>

    <meeting-celebration
        v-model="showCelebration"
        :winner="winner"
        :score-home="liveMeeting?.matches_home ?? 0"
        :score-guest="liveMeeting?.matches_guest ?? 0"
    />
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

/* Logo und Name nebeneinander. Die Schriftgröße wird hier gesetzt, das Logo
   skaliert in em dazu. min-height sorgt dafür, dass die Zeile mit und ohne
   Logo gleich hoch ist und die Spielstände auf einer Höhe bleiben. */
.team-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4em;
  min-height: 4.5em;
  max-width: 100%;
  font-size: clamp(20px, 3vw, 260px);
}

.team {
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.team-logo {
  flex: 0 0 auto;
  width: auto;
  max-width: 30%;
  height: 3.5em;
  object-fit: contain;
}
</style>

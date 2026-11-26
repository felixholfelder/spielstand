<script setup lang="ts">
import { clubLogoUrl } from "~/composables/useClubLogo.ts";

interface Side {
  name: string;
  logoId?: string | null;
  score: number;
}

const props = withDefaults(
    defineProps<{
      home?: Side;
      guest?: Side;
      winnerSide?: "home" | "guest"; // undefined = Unentschieden
      confettiDuration?: number;
    }>(),
    { home: undefined, guest: undefined, winnerSide: undefined, confettiDuration: 10_000 },
);

// v-model: Popup offen/geschlossen
const open = defineModel<boolean>({ default: false });

const CONFETTI_COLORS = ["#f44336", "#ffc107", "#4caf50", "#2196f3", "#e91e63"];

// Gewinner und Gegner. Wer gewonnen hat, entscheidet der Aufrufer
// (siehe getMeetingResult). Ohne winnerSide ist es ein Unentschieden.
const result = computed(() => {
  const { home, guest, winnerSide } = props;
  if (!home || !guest || !winnerSide) return undefined;
  return winnerSide === "home"
      ? { winner: home, opponent: guest }
      : { winner: guest, opponent: home };
});

const winner = computed(() => result.value?.winner);

let confettiActive = false;

async function fireConfetti() {
  if (!import.meta.client) return;

  const { default: confetti } = await import("canvas-confetti");
  confettiActive = true;
  const end = Date.now() + props.confettiDuration;

  const options = {
    colors: CONFETTI_COLORS,
    zIndex: 3000, // über dem Vuetify-Dialog
    disableForReducedMotion: true,
  };

  // Großer Start-Knall in der Mitte
  confetti({ ...options, particleCount: 150, spread: 100, origin: { y: 0.6 } });

  // Danach Konfetti-Kanonen von beiden Seiten
  (function frame() {
    if (!confettiActive || Date.now() > end) return;
    confetti({ ...options, particleCount: 4, angle: 60, spread: 60, origin: { x: 0, y: 0.8 } });
    confetti({ ...options, particleCount: 4, angle: 120, spread: 60, origin: { x: 1, y: 0.8 } });
    requestAnimationFrame(frame);
  })();
}

watch(open, (isOpen) => {
  if (isOpen) {
    if (winner.value) fireConfetti();
  } else {
    confettiActive = false;
  }
});

onBeforeUnmount(() => {
  confettiActive = false;
});
</script>

<template>
  <v-dialog v-model="open" max-width="1300">
    <v-card class="celebration pa-8 text-center" @click="open = false">
      <div class="celebration-title">
        {{ winner ? "Glückwunsch an" : "Spiel beendet" }}
      </div>

      <div class="celebration-team">
        {{ winner ? `${winner.name}!` : "Unentschieden" }}
      </div>

      <img
          v-if="winnerSide && winner?.logoId"
          :src="clubLogoUrl(winner?.logoId)"
          alt=""
          class="celebration-logo"
      >

      <v-row>
        <v-col cols="5" class="d-flex align-center justify-center">
          <div class="text-lg-headline-large">{{ home?.name }}</div>
        </v-col>
        <v-col cols="2" class="d-flex align-center justify-center">
          <div class="celebration-score">{{ home?.score }}:{{ guest?.score }}</div>
        </v-col>
        <v-col cols="5" class="d-flex align-center justify-center">
          <div class="text-lg-headline-large">{{ guest?.name }}</div>
        </v-col>
      </v-row>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.celebration {
  cursor: pointer;
}

.celebration-title {
  font-size: clamp(24px, 3.5vw, 44px);
  font-weight: 500;
  line-height: 1.1;
  opacity: 0.85;
}

.celebration-team {
  margin-top: 8px;
  font-size: clamp(32px, 6vw, 80px);
  font-weight: 700;
  line-height: 1.1;
  overflow-wrap: anywhere;
  text-wrap: balance;
}

.celebration-logo {
  display: block;
  margin: 24px auto 0;
  max-width: 60%;
  height: clamp(100px, 24vh, 240px);
  object-fit: contain;
}

.celebration-score {
  margin-top: 24px;
  font-size: clamp(40px, 8vw, 96px);
  font-weight: 700;
  line-height: 1;
}
</style>

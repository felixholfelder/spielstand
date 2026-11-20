<script setup lang="ts">
import { clubLogoUrl } from "~/composables/useClubLogo.ts";

interface Winner {
  name: string;
  logoId?: string | null;
}

const props = withDefaults(
    defineProps<{
      winner?: Winner | undefined;
      scoreHome: number;
      scoreGuest: number;
      confettiDuration?: number;
    }>(),
    { confettiDuration: 10_000 },
);

// v-model: Popup offen/geschlossen
const open = defineModel<boolean>({ default: false });

const CONFETTI_COLORS = ["#f44336", "#ffc107", "#4caf50", "#2196f3", "#e91e63"];

// Ein Logo, das nicht geladen werden kann, wird einfach nicht angezeigt
const logoFailed = ref(false);
watch(
    () => props.winner?.logoId,
    () => (logoFailed.value = false),
);
const showLogo = computed(
    () => !!props.winner?.logoId && !logoFailed.value,
);

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
    if (props.winner) fireConfetti();
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

      <!-- Name immer genau einmal, mit oder ohne Logo -->
      <div class="celebration-team">
        {{ winner ? `${winner.name}!` : "Unentschieden" }}
      </div>

      <!-- Logo nur, wenn vorhanden. Ohne Logo rückt der Rest einfach nach. -->
      <img
          v-if="showLogo"
          :src="clubLogoUrl(winner?.logoId)"
          alt=""
          class="celebration-logo"
          @error="logoFailed = true"
      >

      <div class="celebration-score">{{ scoreHome }}:{{ scoreGuest }}</div>
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
  height: clamp(100px, 20vh, 240px);
  object-fit: contain;
}

.celebration-score {
  margin-top: 24px;
  font-size: clamp(40px, 8vw, 96px);
  font-weight: 700;
  line-height: 1;
}
</style>
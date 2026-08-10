<script setup lang="ts">
import { useTheme } from "vuetify";

const theme = useTheme();
const { increase, decrease } = useGamesCountFontSize();

import { ref, onMounted, onBeforeUnmount } from 'vue'
const isFullscreen = ref(false)

function updateFullscreenState() {
  const state = !!document.fullscreenElement
  isFullscreen.value = state
}
async function toggleFullscreen() {
  try {
    if (!document.fullscreenElement) {
      await enterFullscreen()
      localStorage.setItem("isFullscreen", "1")
    } else {
      await exitFullscreen()
      localStorage.setItem("isFullscreen", "0")
    }
  } catch (err) {
    console.error('Fullscreen-Fehler:', err)
  }
}

async function enterFullscreen() {
  await document.documentElement.requestFullscreen()
}

async function exitFullscreen() {
  await document.exitFullscreen()
}

onBeforeUnmount(() => {
  document.removeEventListener('fullscreenchange', updateFullscreenState)
})

onMounted(async () => {
  document.addEventListener('fullscreenchange', updateFullscreenState)
  if (localStorage.getItem("isFullscreen") == "1") {
    await enterFullscreen()
  }

  if (import.meta.client) {
    const saved = localStorage.getItem("theme");
    if (saved) {
      theme.global.name.value = saved;
    }
  }
});
</script>

<template>
  <v-app>
    <v-main>
      <div class="controls-row">
        <v-icon-btn icon="mdi-arrow-left" @click="exitFullscreen(); $router.back()" />
        <v-spacer />
        <v-icon-btn :icon="isFullscreen ? 'mdi-arrow-collapse' : 'mdi-arrow-expand'" @click="toggleFullscreen"></v-icon-btn>
        <v-divider class="ma-2" vertical />
        <v-icon-btn icon="mdi-minus" @click="decrease" />
        <v-icon-btn icon="mdi-plus" @click="increase" />
      </div>

      <slot />
    </v-main>
  </v-app>
</template>

<style scoped>
.controls-row {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 16px;
}
</style>

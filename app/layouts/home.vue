<script setup lang="ts">
import { useTheme } from "vuetify";

const theme = useTheme();
const route = useRoute();

const isDark = ref(theme.global.name.value === "dark");
const showShutdownDialog = ref(false);

function toggleTheme() {
  theme.global.name.value =
    theme.global.name.value === "light" ? "dark" : "light";
  if (import.meta.client) {
    localStorage.setItem("theme", theme.global.name.value);
  }
}

async function callShutdown() {
  await fetch("http://localhost:5005/shutdown");
}

async function callReboot() {
  await fetch("http://localhost:5005/reboot");
}

onMounted(() => {
  if (import.meta.client) {
    const saved = localStorage.getItem("theme");
    if (saved) {
      isDark.value = saved === "dark";
      theme.global.name.value = saved;
    }
  }
});
</script>

<template>
  <v-app>
    <v-app-bar>
      <v-app-bar-title>Spielstand</v-app-bar-title>

      <v-spacer />

      <v-btn icon @click="toggleTheme">
        <v-icon>
          {{
            theme.global.name.value === "dark"
              ? "mdi-weather-sunny"
              : "mdi-weather-night"
          }}
        </v-icon>
      </v-btn>

      <v-icon-btn
        v-if="route.query.platform == 'raspberry'"
        icon="mdi-power"
        @click="showShutdownDialog = !showShutdownDialog"
      />

      <shutdown-dialog
        v-model="showShutdownDialog"
        @shutdown="callShutdown"
        @reboot="callReboot"
        @update:model-value="showShutdownDialog = false"
      />
    </v-app-bar>

    <v-main>
      <slot />
    </v-main>
  </v-app>
</template>

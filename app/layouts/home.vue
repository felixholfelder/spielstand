<script setup lang="ts">
import { useTheme } from "vuetify";

const theme = useTheme();

const isDark = ref(theme.global.name.value === "dark");

function toggleTheme() {
  theme.global.name.value = isDark.value ? "dark" : "light";
  if (import.meta.client) {
    localStorage.setItem("theme", theme.global.name.value);
  }
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

      <v-switch
          v-model="isDark"
          label="Dark Mode"
          hide-details
          density="compact"
          class="mr-4"
          @update:model-value="toggleTheme"
      />
    </v-app-bar>

    <v-main>
      <slot />
    </v-main>
  </v-app>
</template>

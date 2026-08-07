<script setup lang="ts">
import { useTheme } from "vuetify";

const theme = useTheme();

onMounted(() => {
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
      <slot />
    </v-main>
  </v-app>
</template>

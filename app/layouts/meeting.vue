<script setup lang="ts">
import { useTheme } from "vuetify";

const theme = useTheme();

const { increase, decrease } = useGamesCountFontSize();

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
      <div class="controls-row">
        <v-icon-btn icon="mdi-arrow-left" @click="$router.back()" />
        <v-spacer />
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

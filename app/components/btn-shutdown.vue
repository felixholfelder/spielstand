<template>
  <v-btn icon="mdi-power" :disabled="isShuttingDown" @click="confirmShutdown"/>
</template>

<script setup>
import { ref } from "vue";

const SHUTDOWN_ENDPOINT = "http://localhost:5005/shutdown";

const isShuttingDown = ref(false);
const error = ref(null);

async function confirmShutdown() {
  const bestaetigt = window.confirm("Raspberry Pi wirklich herunterfahren?");
  if (!bestaetigt) return;

  isShuttingDown.value = true;
  error.value = null;

  try {
    await fetch(SHUTDOWN_ENDPOINT, { method: "POST" });
    // Ab hier fährt der Pi herunter, ein Reset von isShuttingDown ist nicht mehr nötig
  } catch (e) {
    console.error("Shutdown-Anfrage fehlgeschlagen:", e);
    error.value = "Herunterfahren fehlgeschlagen. Läuft der lokale Service?";
    isShuttingDown.value = false;
  }
}
</script>

<style scoped>
.shutdown-button {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  border: none;
  border-radius: 8px;
  background-color: #d9534f;
  color: white;
  cursor: pointer;
}

.shutdown-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>

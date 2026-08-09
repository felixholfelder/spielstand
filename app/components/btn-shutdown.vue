<script setup lang="ts">
defineEmits(["click"]);
</script>

<template>
  <v-btn icon="mdi-power" @click="$emit('click')" />
</template>

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

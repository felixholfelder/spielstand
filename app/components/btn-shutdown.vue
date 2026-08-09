<script setup lang="ts">
defineEmits(["click"]);
</script>

<template>
  <v-btn icon="mdi-power" @click="$emit('click')" />
</template>

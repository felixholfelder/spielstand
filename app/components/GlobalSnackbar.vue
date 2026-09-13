<script setup lang="ts">
const { state, hide } = useSnackbar();
</script>

<template>
  <v-snackbar
      v-model="state.visible"
      :color="state.color"
      :timeout="state.timeout"
      location="bottom"
  >
    {{ state.message }}

    <template #actions>
      <v-btn variant="text" @click="hide">Schließen</v-btn>
    </template>
  </v-snackbar>
</template>

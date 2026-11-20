<script setup lang="ts">
defineProps<{
  modelValue: boolean;
}>();

defineEmits(["shutdown", "reboot", "update:model-value"]);
</script>

<template>
  <v-dialog
    :model-value="modelValue"
    max-width="500px"
    @update:model-value="$emit('update:model-value')"
  >
    <v-card title="Spielstand ausschalten">
      <v-row justify="center">
        <v-col md="6" xs="12" class="text-center" @click="$emit('shutdown')">
          <v-row justify="center">
            <v-icon-btn icon="mdi-power" icon-size="48" />
          </v-row>
          <v-row justify="center"> Ausschalten </v-row>
        </v-col>
        <v-col md="6" xs="12" class="justify-center" @click="$emit('reboot')">
          <v-row justify="center">
            <v-icon-btn icon="mdi-reload" icon-size="48" />
          </v-row>
          <v-row justify="center"> Neustart </v-row>
        </v-col>
      </v-row>
      <v-row />
    </v-card>
  </v-dialog>
</template>

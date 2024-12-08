<template>
  <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
    <div class="flex flex-col">
      <InputPanel />
    </div>
    <div class="flex flex-col">
      <OutputPanel />
    </div>
  </div>
</template>

<script setup lang="ts">
import InputPanel from '../components/InputPanel.vue'
import OutputPanel from '../components/OutputPanel.vue'
</script>

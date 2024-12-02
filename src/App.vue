<template>
  <div class="min-h-screen p-4 bg-gray-100">
    <div class="container mx-auto max-w-[1800px]">
      <div class="flex items-center justify-between mb-8">
        <div class="flex items-center gap-4">
          <button 
            @click="store.toggleCreationMode" 
            class="px-3.5 py-1.5 text-sm text-white rounded" 
            :class="store.isCreationMode ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-blue-600 hover:bg-blue-700'"
          >
            {{ store.isCreationMode ? "Switch to Convert" : "Switch to Create" }}
          </button>
        </div>
        <h1 class="text-3xl font-bold">
          {{ store.isCreationMode ? "Snippet/Live Template Creator" : "Snippet/Live Template Converter" }}
        </h1>
        <div class="w-[120px]"></div>
      </div>

      <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div class="flex flex-col">
          <InputPanel />
        </div>
        <div class="flex flex-col">
          <OutputPanel />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAppStore } from './stores/app'
import InputPanel from './components/InputPanel.vue'
import OutputPanel from './components/OutputPanel.vue'

const store = useAppStore()
</script>
<template>
  <div class="flex-1">
    <label class="block text-sm font-medium text-gray-700 mb-2">Output Filename</label>
    <div class="flex gap-2 items-center">
      <input 
        :value="modelValue"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        type="text" 
        class="flex-1 h-10 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        placeholder="snippets"
      >
      <span class="text-gray-600">.json</span>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: string
}>();
defineEmits<{
  (e: 'update:modelValue', value: string): void
}>();
</script>
<template>
  <div class="flex-1">
    <div class="flex items-center gap-2">
      <label class="text-sm font-medium text-gray-700">Output File</label>
      <div class="relative flex-1 ml-2">
        <input 
          :value="modelValue"
          @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
          type="text" 
          class="w-full h-10 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 pl-[10px] pr-8"
          placeholder=""
        >
        <button
          v-if="modelValue"
          @click="$emit('update:modelValue', '')"
          class="absolute text-blue-500 -translate-y-1/2 right-2 top-1/2 hover:text-blue-600"
        >
          <Trash2 class="w-4 h-4" />
        </button>
      </div>
      <span class="text-gray-600">.{{ computedExtension }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Trash2 } from 'lucide-vue-next';

interface Props {
  modelValue: string
  language?: string
  content?: string
}

const props = withDefaults(defineProps<Props>(), {
  language: '',
  content: ''
})

const computedExtension = computed(() => {
  if (!props.content.trim()) return ''
  if (!props.language) return ''
  return props.language === 'vscode-snippet' ? 'json' : 'xml'
})

defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()
</script>
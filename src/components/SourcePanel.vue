<template>
  <div class="p-4 bg-white rounded-lg shadow">
    <div class="flex items-center justify-between mb-4 h-20">
      <div>
        <h2 class="text-xl font-semibold">WebStorm Templates</h2>
        <p class="text-sm text-gray-600">{{ templateCount }} templates loaded</p>
      </div>
      <button 
        @click="$emit('clear')" 
        class="px-4 py-2 text-white bg-red-600 rounded hover:bg-red-700"
      >
        Clear
      </button>
    </div>
    <MonacoEditor
      v-model="editorContent"
      language="xml"
      @update:modelValue="updateContent"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import MonacoEditor from './MonacoEditor.vue'

const props = defineProps<{
  modelValue: string
  templateCount: number
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'clear'): void
}>()

const editorContent = ref(props.modelValue)

watch(() => props.modelValue, (newValue) => {
  editorContent.value = newValue
})

function updateContent(value: string) {
  emit('update:modelValue', value)
}
</script>
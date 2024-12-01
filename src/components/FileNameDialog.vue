<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
    <div class="bg-white rounded-lg p-6 w-[400px]">
      <h3 class="mb-4 text-lg font-semibold">Download File</h3>
      <div class="flex items-center gap-2">
        <input
          ref="inputRef"
          v-model="filename"
          type="text"
          class="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 pl-[10px] pb-[10px] pt-[10px]"
          placeholder="Enter file name"
          @keyup.enter="handleConfirm"
          @focus="$event.target.select()"
        />
        <span class="text-gray-500">.{{ extension }}</span>
      </div>
      <div class="flex justify-end gap-2 mt-4">
        <button
          @click="$emit('close')"
          class="px-4 py-2 text-gray-700 border rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          @click="handleConfirm"
          class="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          Save
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'

const props = defineProps<{
  isOpen: boolean
  extension: string
  defaultFilename: string
}>()

const emit = defineEmits<{
  (e: 'confirm', filename: string): void
  (e: 'close'): void
}>()

const filename = ref('')
const inputRef = ref<HTMLInputElement>()

watch(() => props.isOpen, (newValue) => {
  if (newValue) {
    filename.value = props.defaultFilename
    // Focus input on next tick to ensure it's mounted
    setTimeout(() => inputRef.value?.focus(), 0)
  }
})

function handleConfirm() {
  if (filename.value.trim()) {
    emit('confirm', filename.value.trim())
    filename.value = ''
  }
}
</script>

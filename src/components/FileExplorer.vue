<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black bg-opacity-50" @click="close"></div>
    
    <!-- Modal -->
    <div class="relative bg-white rounded-lg shadow-xl w-[600px] max-h-[80vh] flex flex-col">
      <!-- Header -->
      <div class="flex items-center justify-between p-4 border-b">
        <h3 class="text-lg font-semibold">Select File</h3>
        <button 
          @click="close"
          class="text-gray-400 hover:text-gray-600"
        >
          <X class="w-5 h-5" />
        </button>
      </div>
      
      <!-- Content -->
      <div class="flex-1 p-4 overflow-y-auto">
        <input
          type="file"
          ref="fileInput"
          @change="handleFileSelect"
          accept=".json,.xml"
          class="hidden"
        />
        <div 
          class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 cursor-pointer"
          @click="$refs.fileInput.click()"
          @dragover.prevent
          @drop.prevent="handleFileDrop"
        >
          <FileIcon class="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p class="text-lg text-gray-600 mb-2">Drag and drop a file here</p>
          <p class="text-sm text-gray-500">or click to browse</p>
          <p class="text-xs text-gray-400 mt-2">Supported formats: .json, .xml</p>
        </div>
      </div>
      
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { X, FileIcon } from 'lucide-vue-next'

const props = defineProps<{
  isOpen: boolean
}>()

const fileInput = ref<HTMLInputElement>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'select', filename: string, content: string): void
}>()

async function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsText(file)
  })
}

async function processFile(file: File) {
  try {
    const content = await readFile(file)
    emit('select', file.name, content)
    close()
  } catch (error) {
    console.error('Error reading file:', error)
  }
}

function close() {
  emit('close')
}

async function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) {
    await processFile(file)
  }
}

async function handleFileDrop(event: DragEvent) {
  const file = event.dataTransfer?.files[0]
  if (file) {
    await processFile(file)
  }
}
</script>
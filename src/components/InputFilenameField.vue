<template>
  <div class="flex-1">
    <div class="flex items-center gap-2">
      <label class="text-sm font-medium text-gray-700">Input File</label>
      <div class="relative flex-1 ml-2">
        <input 
          ref="fileInput"
          type="text"
          :value="modelValue"
          readonly
          placeholder="Click here to open explorer or click browse to drag and drop"
          @click="openFileDialog"
          class="w-full h-10 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 pl-[5px] pr-8 cursor-pointer bg-gray-50"
        />
        <button
          v-if="modelValue"
          @click="$emit('update:modelValue', '')"
          class="absolute text-blue-500 -translate-y-1/2 right-2 top-1/2 hover:text-blue-600"
        >
          <Trash2 class="w-4 h-4" />
        </button>
      </div>
      <button
        @click="showFileExplorer = true"
        class="h-9 px-3.5 text-sm text-white bg-blue-600 rounded hover:bg-blue-700 flex items-center gap-2"
      >
        <FolderOpen class="w-4 h-4" />
        Browse
      </button>
      
      <FileExplorer
        :is-open="showFileExplorer"
        @close="showFileExplorer = false"
        @select="handleFileSelect"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Trash2, FolderOpen } from 'lucide-vue-next';
import FileExplorer from './FileExplorer.vue';
import { useToast } from 'vue-toastification'

const toast = useToast()
const fileInput = ref<HTMLInputElement>()
const hiddenInput = ref<HTMLInputElement>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'file-selected', content: string): void
}>();

const showFileExplorer = ref(false)

defineProps<{
  modelValue: string
}>();

function openFileDialog() {
  try {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json,.xml'
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      emit('update:modelValue', file.name)
      
      const reader = new FileReader()
      reader.onload = () => {
        const content = reader.result as string
        emit('file-selected', content)
      }
      reader.readAsText(file)
      input.value = ''  // Reset the input for future selections
    }
    
    input.click()
  } catch (error) {
    console.error('Error reading file:', error)
    toast.error('Failed to read file')
  }
}

function handleFileSelect(filename: string, content: string) {
  emit('update:modelValue', filename)
  emit('file-selected', content)
}
</script>
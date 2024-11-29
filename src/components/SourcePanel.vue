<template>
  <div class="p-4 bg-white rounded-lg shadow">
    <div class="flex items-center justify-between mb-4">
      <div>
        <h2 class="text-xl font-semibold">{{ panelTitle }}</h2>
        <p v-if="modelValue.trim() && !isCreationMode" class="text-sm text-gray-600">
          {{ templateCount }} {{ detectInputFormat(modelValue) === 'xml' ? 
            (templateCount === 1 ? 'template' : 'templates') : 
            (templateCount === 1 ? 'snippet' : 'snippets') }} loaded
        </p>
      </div>
      <div class="flex items-center gap-4">
        <button 
          @click="clearAll" 
          class="px-3.5 py-1.5 text-sm text-white bg-red-600 rounded hover:bg-red-700"
        >
          Clear
        </button>
      </div>
    </div>
    
    <div v-if="isCreationMode" class="mb-4">
      <CreationModeInputs
        v-model="snippetTemplateData"
        @update:modelValue="updateSnippetTemplateData"
      />
    </div>
    
    <MonacoEditor
      v-model="editorContent"
      :class="{ 'h-[calc(100vh-280px)]': isCreationMode }"
      :language="isCreationMode ? 'typescript' : inputLanguage"
      @update:modelValue="updateContent"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useToast } from 'vue-toastification'
import MonacoEditor from './MonacoEditor.vue'
import CreationModeInputs from './CreationModeInputs.vue'
import { detectInputFormat } from '@/utils/detector'
import { generateSnippet, formatSnippetJson } from '@/utils/snippetConverter'
import { convertToWebStormTemplate } from '@/utils/vscodeToWebstorm'

const toast = useToast()

const props = defineProps<{
  modelValue: string
  templateCount: number
  isCreationMode: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'clear'): void
  (e: 'update:is-creation-mode', value: boolean): void
  (e: 'snippet-generated', value: string): void
  (e: 'update:input-filename', value: string): void
}>()

const editorContent = ref(props.modelValue)
const snippetTemplateData = ref({
  name: '',
  scope: '',
  description: ''
})

const inputLanguage = computed(() => {
  if (props.isCreationMode) {
    return 'typescript'
  }
  return detectInputFormat(editorContent.value) === 'xml' ? 'xml' : 'vscode-snippet'
})

const panelTitle = computed(() => {
  if (!editorContent.value.trim() || props.isCreationMode) return 'Source Input'
  const format = detectInputFormat(editorContent.value)
  return format === 'xml' ? 'Live Templates' : 'VSCode Snippets'
})

watch(() => props.modelValue, (newValue) => {
  editorContent.value = newValue
})

function updateContent(value: string) {
  emit('update:modelValue', value)
  if (props.isCreationMode) {
    generateVSCodeSnippet(value)
  }
}

function clearAll() {
  emit('clear')
  emit('update:input-filename', '')
}

function updateSnippetTemplateData(data: typeof snippetTemplateData.value) {
  snippetTemplateData.value = data
  generateVSCodeSnippet(editorContent.value)
}

function generateVSCodeSnippet(sourceCode: string) {
  const snippet = generateSnippet({
    name: snippetTemplateData.value.name || 'untitled',
    prefix: snippetTemplateData.value.name || 'untitled',
    description: snippetTemplateData.value.description,
    scope: snippetTemplateData.value.scope,
    sourceCode
  })
  
  // Don't proceed if snippet is empty
  if (!Object.keys(snippet).length) {
    emit('snippet-generated', '')
    return
  }
  
  const formattedSnippet = formatSnippetJson(snippet)
  
  const snippetName = snippetTemplateData.value.name || 'untitled'
  
  // Generate WebStorm live template
  const webstormTemplate = convertToWebStormTemplate({ 
    [snippetName]: {
      prefix: snippetName,
      body: snippet[snippetName].body,
      description: snippetTemplateData.value.description || '',
      scope: snippetTemplateData.value.scope || ''
    }
  }, {
    includeTemplateSet: false,
    group: 'Custom'
  })
  
  emit('snippet-generated', formattedSnippet)
}
</script>
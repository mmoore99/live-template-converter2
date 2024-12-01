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
      <!-- Remove the clear button div from here -->
    </div>
    
    <div v-if="isCreationMode" class="mb-4">
      <CreationModeInputs
        v-model="snippetTemplateData"
        @update:modelValue="updateSnippetTemplateData"
      />
    </div>
    
    <!-- Editor section with improved stacking context -->
    <div class="editor-wrapper">
      <div class="relative isolate">
        <button 
          @click="clearAll" 
          class="editor-clear-btn"
        >
          Clear
        </button>
        <MonacoEditor
          v-model="editorContent"
          :language="isCreationMode ? 'typescript' : inputLanguage"
          @update:modelValue="updateContent"
          :height="isCreationMode ? 'calc(100vh - 350px)' : ''"
        />
      </div>
    </div>
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

<style scoped>
.editor-wrapper {
  position: relative;
}

.editor-clear-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 9999;
  padding: 0.3rem 0.75rem;  /* Reduced from 0.375rem 0.875rem */
  font-size: 0.8125rem;     /* Reduced from 0.875rem */
  line-height: 1.15rem;     /* Reduced from 1.25rem */
  color: white;
  background-color: rgb(220 38 38);
  border-radius: 0.25rem;
  transition: background-color 0.2s;
}

.editor-clear-btn:hover {
  background-color: rgb(185 28 28);
}
</style>
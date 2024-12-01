<template>
  <div class="space-y-1.5">
    <div class="relative group">
      <input
        v-model="name"
        type="text"
        class="w-full h-10 pt-4 pl-3 pr-8 placeholder-transparent border-gray-300 rounded-md shadow-sm peer"
        placeholder=" "
        @input="emitUpdate"
        id="name-input"
      />
      <label 
        for="name-input"
        class="absolute left-3 -top-0.5 text-xs text-gray-500 transition-all 
               peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 
               peer-placeholder-shown:top-2.5 peer-focus:-top-0.5 peer-focus:text-xs 
               peer-focus:text-indigo-500"
      >
        Name/Prefix
      </label>
      <button
        v-if="name"
        @click="clearField('name')"
        class="absolute text-blue-500 -translate-y-1/2 right-2 top-1/2 hover:text-blue-600"
      >
        <Trash2 class="w-4 h-4" />
      </button>
    </div>
    <div class="relative group">
      <input
        v-model="description"
        type="text"
        class="w-full h-10 pt-4 pl-3 pr-8 placeholder-transparent border-gray-300 rounded-md shadow-sm peer"
        placeholder=" "
        @input="emitUpdate"
        id="description-input"
      />
      <label 
        for="description-input"
        class="absolute left-3 -top-0.5 text-xs text-gray-500 transition-all 
               peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 
               peer-placeholder-shown:top-2.5 peer-focus:-top-0.5 peer-focus:text-xs 
               peer-focus:text-indigo-500"
      >
        Description
      </label>
      <button
        v-if="description"
        @click="clearField('description')"
        class="absolute text-blue-500 -translate-y-1/2 right-2 top-1/2 hover:text-blue-600"
      >
        <Trash2 class="w-4 h-4" />
      </button>
    </div>
    <div class="relative">
      <div class="flex items-center gap-2">
        <div class="relative flex-1 group">
          <textarea
            v-model="scope"
            rows="1"
            class="w-full rounded-md border-gray-300 shadow-sm pl-3 pr-8 pt-4 placeholder-transparent min-h-[40px] overflow-hidden peer"
            placeholder=" "
            @input="adjustTextareaHeight"
            id="scope-input"
          />
          <label 
            for="scope-input"
            class="absolute left-3 -top-0.5 text-xs text-gray-500 transition-all 
                   peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 
                   peer-placeholder-shown:top-2.5 peer-focus:-top-0.5 peer-focus:text-xs 
                   peer-focus:text-indigo-500"
          >
            Scopes
          </label>
          <button
            v-if="scope"
            @click.stop="clearField('scope')"
            class="absolute text-blue-500 -translate-y-1/2 right-2 top-1/2 hover:text-blue-600"
          >
            <Trash2 class="w-4 h-4" />
          </button>
        </div>
        <button
          @click="showScopeSelector = true"
          class="px-2 h-7 text-sm text-white bg-blue-600 rounded hover:bg-blue-700 flex items-center gap-2 self-start mt-1"
        >
          <List class="w-3.5 h-3.5" />
          Select
        </button>
      </div>
    </div>
  </div>
  
  <ScopeSelectorModal
    :is-open="showScopeSelector"
    :selected-scopes="scope"
    @close="showScopeSelector = false"
    @save="handleScopeSave"
  />
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { Trash2, List } from 'lucide-vue-next'
import ScopeSelectorModal from './ScopeSelectorModal.vue'

const props = defineProps<{
  modelValue: {
    name: string
    scope: string
    description: string
  }
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: { name: string; scope: string; description: string }): void
}>()

const name = ref(props.modelValue.name)
const scope = ref(props.modelValue.scope)
const description = ref(props.modelValue.description)
const showScopeSelector = ref(false)

// Add this function for auto-height adjustment
function adjustTextareaHeight(event: Event) {
  const textarea = event.target as HTMLTextAreaElement
  textarea.style.height = '40px'
  textarea.style.height = `${textarea.scrollHeight}px`
  emitUpdate()
}

function emitUpdate() {
  emit('update:modelValue', {
    name: name.value,
    scope: scope.value,
    description: description.value
  })
}

function handleScopeSave(scopes: string) {
  scope.value = scopes
  emitUpdate()
}

// Add to watch handler to adjust height when scope changes from external updates
watch(() => props.modelValue, async (newValue) => {
  name.value = newValue.name
  scope.value = newValue.scope
  description.value = newValue.description
  
  // Wait for DOM update then adjust textarea height
  await nextTick()
  const textarea = document.getElementById('scope-input') as HTMLTextAreaElement
  if (textarea) {
    textarea.style.height = '40px'
    textarea.style.height = `${textarea.scrollHeight}px`
  }
}, { deep: true })

function clearField(field: 'name' | 'scope' | 'description') {
  if (field === 'name') name.value = ''
  if (field === 'scope') scope.value = ''
  if (field === 'description') description.value = ''
  emitUpdate()
}
</script>

<style scoped>
input:focus, textarea:focus {
  outline: none !important;
  box-shadow: none !important;
  border-color: #e5e7eb !important;
}

/* Disable WebKit's default focus styles */
input, textarea {
  -webkit-appearance: none;
}

/* Remove Firefox's default focus outline */
input::-moz-focus-inner,
textarea::-moz-focus-inner {
  border: 0;
}
</style>
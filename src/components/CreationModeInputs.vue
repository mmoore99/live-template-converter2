<template>
  <div class="space-y-2">
    <div class="grid grid-cols-2 gap-4">
      <div class="relative">
        <input
          v-model="name"
          type="text"
          class="w-full h-10 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 pl-3 pr-8"
          placeholder="Name"
          @input="emitUpdate"
        />
        <button
          v-if="name"
          @click="clearField('name')"
          class="absolute right-2 top-1/2 -translate-y-1/2 text-blue-500 hover:text-blue-600"
        >
          <Trash2 class="w-4 h-4" />
        </button>
      </div>
      <div class="relative">
        <input
          v-model="scope"
          type="text"
          class="w-full h-10 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 pl-3 pr-8"
          placeholder="Scope"
          @input="emitUpdate"
        />
        <button
          v-if="scope"
          @click="clearField('scope')"
          class="absolute right-2 top-1/2 -translate-y-1/2 text-blue-500 hover:text-blue-600"
        >
          <Trash2 class="w-4 h-4" />
        </button>
      </div>
    </div>
    <div class="relative">
      <input
        v-model="description"
        type="text"
        class="w-full h-10 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 pl-3 pr-8"
        placeholder="Description"
        @input="emitUpdate"
      />
      <button
        v-if="description"
        @click="clearField('description')"
        class="absolute right-2 top-1/2 -translate-y-1/2 text-blue-500 hover:text-blue-600"
      >
        <Trash2 class="w-4 h-4" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Trash2 } from 'lucide-vue-next'

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

function emitUpdate() {
  emit('update:modelValue', {
    name: name.value,
    scope: scope.value,
    description: description.value
  })
}

watch(() => props.modelValue, (newValue) => {
  name.value = newValue.name
  scope.value = newValue.scope
  description.value = newValue.description
}, { deep: true })

function clearField(field: 'name' | 'scope' | 'description') {
  if (field === 'name') name.value = ''
  if (field === 'scope') scope.value = ''
  if (field === 'description') description.value = ''
  emitUpdate()
}
</script>
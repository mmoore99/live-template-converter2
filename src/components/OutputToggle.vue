<template>
  <label class="relative inline-flex items-center gap-2 cursor-pointer">
    <span class="text-sm font-medium text-gray-700">Enclose in braces</span>
    <input 
      type="checkbox"
      :checked="modelValue"
      @change="$emit('update:modelValue', !modelValue)"
      class="hidden"
    >
    <div 
      :class="[
        'relative w-11 h-6 rounded-full transition-colors duration-200',
        modelValue ? 'bg-blue-600' : 'bg-gray-200'
      ]"
    >
      <div 
        class="absolute top-[2px] left-[2px] bg-white border border-gray-300 rounded-full h-5 w-5 transition-transform duration-200"
        :class="{ 'translate-x-5': modelValue }"
      ></div>
    </div>
  </label>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: boolean
}>()

defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()
</script>
<template>
  <div class="flex flex-col gap-2">
    <label class="relative inline-flex items-center cursor-pointer gap-2">
      <span class="text-sm font-medium text-gray-700">Include templateSet</span>
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
    <input 
      v-if="modelValue"
      :value="groupValue"
      @input="$emit('update:groupValue', ($event.target as HTMLInputElement).value)"
      type="text"
      class="h-8 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 pl-[10px]"
      placeholder="TemplateSet group"
    >
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: boolean
  groupValue: string
}>()

defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'update:groupValue', value: string): void
}>()
</script>
<template>
    <label class="relative inline-flex items-center gap-2 cursor-pointer">
        <span class="text-sm font-medium text-gray-700">{{ label }}</span>
        <input
            type="checkbox"
            :checked="modelValue"
            @change="$emit('update:modelValue', !modelValue)"
            class="hidden" />
        <div :class="['relative h-6 w-11 rounded-full transition-colors duration-200', modelValue ? 'bg-blue-600' : 'bg-gray-200']">
            <div
                class="absolute left-[2px] top-[2px] h-5 w-5 rounded-full border border-gray-300 bg-white transition-transform duration-200"
                :class="{ 'translate-x-5': modelValue }"></div>
        </div>
    </label>
</template>

<script setup lang="ts">
defineProps<{
    modelValue: boolean;
    label?: string;
}>();

defineEmits<{
    (e: "update:modelValue", value: boolean): void;
}>();
</script>

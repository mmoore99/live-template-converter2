<template>
    <div class="flex items-center justify-center gap-10">
        <label class="relative inline-flex items-center gap-2 cursor-pointer">
            <span class="text-sm font-medium text-gray-700">Include templateSet</span>
            <input type="checkbox" :checked="modelValue" @change="$emit('update:modelValue', !modelValue)" class="hidden" />
            <div :class="['relative w-11 h-6 rounded-full transition-colors duration-200', modelValue ? 'bg-blue-600' : 'bg-gray-200']">
                <div class="absolute top-[2px] left-[2px] bg-white border border-gray-300 rounded-full h-5 w-5 transition-transform duration-200" :class="{ 'translate-x-5': modelValue }"></div>
            </div>
        </label>
        <div class="relative" :class="{ 'opacity-50': !modelValue }">
            <input
                :value="groupValue"
                @input="$emit('update:groupValue', ($event.target as HTMLInputElement).value)"
                type="text"
                id="templateSetGroup"
                :disabled="!modelValue"
                class="h-6 px-3 pt-2 pb-0 text-sm border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-0 peer disabled:cursor-not-allowed"
                placeholder=" "
            />
            <label
                for="templateSetGroup"
                class="absolute left-2 -top-1 text-[10px] text-gray-600 transition-all duration-200 bg-white px-1 peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-500 peer-placeholder-shown:top-[3px] peer-focus:-top-1 peer-focus:text-[10px] peer-focus:text-indigo-500"
            >
                TemplateSet Group
            </label>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { watch } from "vue";

    const props = defineProps<{
        modelValue: boolean;
        groupValue: string;
    }>();

    const emit = defineEmits<{
        "update:modelValue": [value: boolean];
        "update:groupValue": [value: string];
    }>();

    watch(
        () => props.modelValue,
        (newValue) => {
            if (!newValue) {
                emit("update:groupValue", "");
            }
        }
    );
</script>

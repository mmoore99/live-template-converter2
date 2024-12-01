<template>
    <div class="p-4 bg-white rounded-lg shadow">
        <div :class="['flex justify-between', isCreationMode ? 'items-start' : 'items-center h-10 mb-4']">
            <div>
                <h2 class="mb-1 text-xl font-semibold">Generated Output</h2>
                <div v-if="isCreationMode" class="mt-1 space-y-1">
                    <label class="flex items-center">
                        <input type="radio" v-model="outputType" value="snippet" class="w-4 h-4 text-blue-600" />
                        <span class="ml-2 text-sm text-gray-700">VSCode Snippet</span>
                    </label>
                    <label class="flex items-center">
                        <input type="radio" v-model="outputType" value="template" class="w-4 h-4 text-blue-600" />
                        <span class="ml-2 text-sm text-gray-700">Live Template</span>
                    </label>
                </div>
                <p v-if="content.trim() && !isCreationMode" class="text-sm text-gray-600">{{ templateCount }} {{ language === "xml" ? (templateCount === 1 ? "template" : "templates") : templateCount === 1 ? "snippet" : "snippets" }} loaded</p>
            </div>
            <div class="flex items-center space-x-4">
                <TemplateSetControls
                    v-if="language === 'xml' && content.trim() && filename"
                    v-model="props.includeTemplateSet"
                    v-model:groupValue="props.templateSetGroup"
                    @update:modelValue="$emit('update:include-template-set', $event)"
                    @update:groupValue="$emit('update:template-set-group', $event)"
                />
                <OutputToggle v-if="language === 'vscode-snippet' && content.trim()" v-model="localIncludeBrackets" @update:modelValue="$emit('update:include-brackets', $event)" />
                <div class="space-x-2">
                    <button @click="$emit('copy')" class="px-3.5 py-1.5 text-sm text-white bg-blue-600 rounded hover:bg-blue-700">Copy to Clipboard</button>
                    <button v-if="!props.isCreationMode" @click="$emit('download')" class="px-3.5 py-1.5 text-sm text-white bg-green-600 rounded hover:bg-green-700">Download</button>
                </div>
            </div>
        </div>
        <div class="mt-4">
            <MonacoEditor v-model="editorContent" :language="language" :read-only="true" :height="isCreationMode ? 'calc(100vh - 240px)' : ''" />
        </div>
    </div>
</template>

<script setup lang="ts">
    import { ref, watch, computed } from "vue";
    import MonacoEditor from "./MonacoEditor.vue";
    import OutputToggle from "./OutputToggle.vue";
    import TemplateSetControls from "./TemplateSetControls.vue";

    const props = defineProps<{
        content: string;
        filename: string;
        language: string;
        includeBrackets: boolean;
        includeTemplateSet: boolean;
        templateSetGroup: string;
        templateCount?: number;
        isCreationMode: boolean;
    }>();

    const emit = defineEmits<{
        (e: "copy"): void;
        (e: "download"): void;
        (e: "update:include-brackets", value: boolean): void;
        (e: "update:include-template-set", value: boolean): void;
        (e: "update:template-set-group", value: string): void;
    }>();

    const outputType = ref("snippet");
    const editorContent = ref(props.content);
    const localIncludeBrackets = ref(props.includeBrackets);

    watch(outputType, (newValue) => {
        emit("update:output-type", newValue);
    });

    watch(
        () => props.content,
        (newValue) => {
            editorContent.value = newValue;
        }
    );

    watch(
        () => props.includeBrackets,
        (newValue) => {
            localIncludeBrackets.value = newValue;
        }
    );
</script>

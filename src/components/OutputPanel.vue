<template>
    <div class="p-4 bg-white rounded-lg shadow">
        <div :class="[hasValidContent ? 'mb-[15px]' : 'mb-[22px]', 'flex justify-between', isCreationMode ? 'items-start' : 'items-center']">
            <div>
                <h2 class="text-xl font-semibold">Generated Output</h2>
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
                <p v-if="hasValidContent" class="text-sm text-gray-600">{{ templateCount }} {{ language === "xml" ? (templateCount === 1 ? "live template" : "live templates") : templateCount === 1 ? "snippet" : "snippets" }} generated</p>
            </div>
            <div class="flex items-center space-x-4">
                <TemplateSetControls v-if="language === 'xml' && hasValidContent" v-model="props.includeTemplateSet" v-model:groupValue="props.templateSetGroup" @update:modelValue="$emit('update:include-template-set', $event)" @update:groupValue="$emit('update:template-set-group', $event)" />
                <OutputToggle v-if="language === 'vscode-snippet' && hasValidContent" v-model="localIncludeBrackets" @update:modelValue="$emit('update:include-brackets', $event)" />
                <div class="space-x-2">
                    <button @click="copyToClipboard" class="px-3.5 py-1.5 text-sm text-white bg-blue-600 rounded hover:bg-blue-700">Copy to Clipboard</button>
                    <button v-if="!props.isCreationMode" @click="handleDownload" class="px-3.5 py-1.5 text-sm text-white bg-green-600 rounded hover:bg-green-700">Download</button>
                </div>
            </div>
        </div>
        <div class="">
            <MonacoEditor v-model="editorContent" :language="language" :read-only="true" :height="isCreationMode ? 'calc(100vh - 240px)' : ''" />
        </div>
    </div>
    <FileNameDialog
        :is-open="showFileNameDialog"
        :extension="downloadExtension"
        :default-filename="getDefaultFilename()"
        @confirm="handleDownloadConfirm"
        @close="showFileNameDialog = false"
    />
</template>

<script setup lang="ts">
    import { ref, watch, computed } from "vue";
    import MonacoEditor from "./MonacoEditor.vue";
    import OutputToggle from "./OutputToggle.vue";
    import TemplateSetControls from "./TemplateSetControls.vue";
    import FileNameDialog from "./FileNameDialog.vue";
    import { useToast } from "vue-toastification";

    const toast = useToast();

    const props = defineProps<{
        content: string;
        filename: string;
        language: string;
        includeBrackets: boolean;
        includeTemplateSet: boolean;
        templateSetGroup: string;
        templateCount?: number;
        isCreationMode: boolean;
        (e: "update:output-type", value: string): void;
    }>();

    const emit = defineEmits<{
        (e: "copy"): void;
        (e: "download"): void;
        (e: "update:include-brackets", value: boolean): void;
        (e: "update:include-template-set", value: boolean): void;
        (e: "update:template-set-group", value: string): void;
        (e: "update:output-type", value: string): void;
    }>();

    const outputType = ref("snippet");
    const editorContent = ref(props.content);
    const localIncludeBrackets = ref(props.includeBrackets);

    const hasValidContent = computed(() => props.content.trim() && !props.isCreationMode);
    

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

    // Expose editorContent to parent components
    defineExpose({
        editorContent,
    });

    // Handle copy functionality within OutputPanel
    function copyToClipboard() {
        navigator.clipboard
            .writeText(editorContent.value)
            .then(() => {
                toast.success("Copied to clipboard!");
            })
            .catch((error) => {
                console.error("Error copying to clipboard:", error);
                toast.error("Failed to copy to clipboard");
            });
    }

    const showFileNameDialog = ref(false);
    const downloadExtension = ref("");

    function handleDownload() {
        downloadExtension.value = props.language === 'vscode-snippet' ? 'json' : 'xml';
        showFileNameDialog.value = true;
    }

    function handleDownloadConfirm(filename: string) {
        const blob = new Blob([editorContent.value], {
            type: props.language === 'vscode-snippet' ? "application/json" : "application/xml",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${filename}.${downloadExtension.value}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showFileNameDialog.value = false;
    }

    function getDefaultFilename(): string {
        const now = new Date();
        const timestamp = now.getFullYear().toString() + 
            String(now.getMonth() + 1).padStart(2, "0") + 
            String(now.getDate()).padStart(2, "0") + 
            String(now.getHours()).padStart(2, "0") + 
            String(now.getMinutes()).padStart(2, "0");

        return props.language === 'vscode-snippet' 
            ? `GeneratedvscodeSnippets-${timestamp}` 
            : `GeneratedLiveTemplates-${timestamp}`;
    }
</script>

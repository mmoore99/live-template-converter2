<template>
    <div class="p-4 bg-white rounded-lg shadow">
        <div class="flex items-center justify-between mb-4">
            <div class="flex-1 flex items-center gap-2">
                <div>
                    <h2 class="text-xl font-semibold">{{ panelTitle }}</h2>
                    <p v-if="modelValue.trim() && !isCreationMode" class="text-sm text-gray-600">{{ templateCount }} {{ detectInputFormat(modelValue) === "xml" ? (templateCount === 1 ? "template" : "templates") : templateCount === 1 ? "snippet" : "snippets" }} loaded</p>
                </div>
                <div class="relative flex-1 ml-2">
                    <input
                        ref="fileInput"
                        type="text"
                        :value="inputFilename"
                        readonly
                        placeholder="Click here to open explorer or click browse to drag and drop"
                        @click="openFileDialog"
                        class="w-full h-10 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 pl-[5px] pr-8 cursor-pointer bg-gray-50"
                    />
                    <button v-if="inputFilename" @click="clearFilename" class="absolute text-blue-500 -translate-y-1/2 right-2 top-1/2 hover:text-blue-600">
                        <Trash2 class="w-4 h-4" />
                    </button>
                </div>
                <button @click="showFileExplorer = true" class="h-9 px-3.5 text-sm text-white bg-blue-600 rounded hover:bg-blue-700 flex items-center gap-2">
                    <FolderOpen class="w-4 h-4" />
                    Browse
                </button>

                <FileExplorer :is-open="showFileExplorer" @close="showFileExplorer = false" @select="handleFileSelect" />
            </div>
        </div>

        <div v-if="isCreationMode" class="mb-4">
            <CreationModeInputs v-model="snippetTemplateData" @update:modelValue="updateSnippetTemplateData" />
        </div>

        <!-- Editor section with improved stacking context -->
        <div class="editor-wrapper">
            <div class="relative isolate">
                <button @click="clearAll" class="editor-clear-btn">Clear</button>
                <MonacoEditor v-model="editorContent" :language="isCreationMode ? 'typescript' : inputLanguage" @update:modelValue="updateContent" :height="isCreationMode ? 'calc(100vh - 350px)' : ''" />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { ref, watch, computed } from "vue";
    import { useToast } from "vue-toastification";
    import MonacoEditor from "./MonacoEditor.vue";
    import CreationModeInputs from "./CreationModeInputs.vue";
    import FileExplorer from "./FileExplorer.vue";
    import { Trash2, FolderOpen } from "lucide-vue-next";
    import { detectInputFormat } from "@/utils/detector";
    import { generateSnippet, formatSnippetJson } from "@/utils/snippetConverter";
    import { convertToWebStormTemplate } from "@/utils/vscodeToWebstorm";

    const toast = useToast();

    const props = defineProps<{
        modelValue: string;
        templateCount: number;
        isCreationMode: boolean;
    }>();

    const emit = defineEmits<{
        (e: "update:modelValue", value: string): void;
        (e: "clear"): void;
        (e: "update:is-creation-mode", value: boolean): void;
        (e: "snippet-generated", value: string): void;
        (e: "update:input-filename", value: string): void;
    }>();

    const editorContent = ref(props.modelValue);
    const snippetTemplateData = ref({
        name: "",
        scope: "",
        description: "",
    });

    const inputLanguage = computed(() => {
        if (props.isCreationMode) {
            return "typescript";
        }
        return detectInputFormat(editorContent.value) === "xml" ? "xml" : "vscode-snippet";
    });

    const panelTitle = computed(() => {
        if (!editorContent.value.trim() || props.isCreationMode) return "Source Input";
        const format = detectInputFormat(editorContent.value);
        return format === "xml" ? "Live Templates" : "VSCode Snippets";
    });

    watch(
        () => props.modelValue,
        (newValue) => {
            editorContent.value = newValue;
        }
    );

    function updateContent(value: string) {
        emit("update:modelValue", value);
        if (props.isCreationMode) {
            generateVSCodeSnippet(value);
        }
    }

    function clearAll() {
        emit("clear");
        emit("update:input-filename", "");
    }

    function updateSnippetTemplateData(data: typeof snippetTemplateData.value) {
        snippetTemplateData.value = data;
        generateVSCodeSnippet(editorContent.value);
    }

    function generateVSCodeSnippet(sourceCode: string) {
        const snippet = generateSnippet({
            name: snippetTemplateData.value.name || "untitled",
            prefix: snippetTemplateData.value.name || "untitled",
            description: snippetTemplateData.value.description,
            scope: snippetTemplateData.value.scope,
            sourceCode,
        });

        // Don't proceed if snippet is empty
        if (!Object.keys(snippet).length) {
            emit("snippet-generated", "");
            return;
        }

        const formattedSnippet = formatSnippetJson(snippet);

        const snippetName = snippetTemplateData.value.name || "untitled";

        // Generate WebStorm live template
        const webstormTemplate = convertToWebStormTemplate(
            {
                [snippetName]: {
                    prefix: snippetName,
                    body: snippet[snippetName].body,
                    description: snippetTemplateData.value.description || "",
                    scope: snippetTemplateData.value.scope || "",
                },
            },
            {
                includeTemplateSet: false,
                group: "Custom",
            }
        );

        emit("snippet-generated", formattedSnippet);
    }

    // Add new refs
    const showFileExplorer = ref(false);
    const fileInput = ref<HTMLInputElement>();
    const inputFilename = ref("");

    // Add new file handling methods
    function openFileDialog() {
        try {
            const input = document.createElement("input");
            input.type = "file";
            input.accept = ".json,.xml";

            input.onchange = async (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (!file) return;
                inputFilename.value = file.name;
                emit("update:input-filename", file.name);

                const reader = new FileReader();
                reader.onload = () => {
                    const content = reader.result as string;
                    updateContent(content);
                };
                reader.readAsText(file);
                input.value = "";
            };

            input.click();
        } catch (error) {
            console.error("Error reading file:", error);
            toast.error("Failed to read file");
        }
    }

    function handleFileSelect(filename: string, content: string) {
        inputFilename.value = filename;
        emit("update:input-filename", filename);
        updateContent(content);
    }

    function clearFilename() {
        inputFilename.value = "";
        emit("update:input-filename", "");
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
        padding: 0.3rem 0.75rem; /* Reduced from 0.375rem 0.875rem */
        font-size: 0.8125rem; /* Reduced from 0.875rem */
        line-height: 1.15rem; /* Reduced from 1.25rem */
        color: white;
        background-color: rgb(220 38 38);
        border-radius: 0.25rem;
        transition: background-color 0.2s;
    }

    .editor-clear-btn:hover {
        background-color: rgb(185 28 28);
    }
</style>

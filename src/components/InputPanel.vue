<template>
    <div class="rounded-lg bg-white p-4 shadow">
        <div :class="[store.isCreationMode ? '' : 'h-[84px]']">
            <div class="mb-4 flex items-center justify-between">
                <div class="flex flex-1 items-center gap-2">
                    <div>
                        <h2 class="text-xl font-semibold">{{ panelTitle }}</h2>
                        <p
                            v-if="store.sourceContent.trim() && !store.isCreationMode"
                            class="text-sm text-gray-600">
                            {{ store.templateCount }}
                            {{
                                detectInputFormat(store.sourceContent) === "xml"
                                    ? store.templateCount === 1
                                        ? "template"
                                        : "templates"
                                    : store.templateCount === 1
                                      ? "snippet"
                                      : "snippets"
                            }}
                            loaded
                        </p>
                    </div>
                    <div class="relative ml-2 flex-1">
                        <input
                            ref="fileInput"
                            type="text"
                            :value="store.inputFilename"
                            readonly
                            placeholder="Click here to open explorer or click browse to drag and drop"
                            @click="openFileDialog"
                            class="h-10 w-full cursor-pointer rounded-md border-gray-300 bg-gray-50 pl-[5px] pr-8 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
                        <button
                            v-if="store.inputFilename"
                            @click="clearFilename"
                            class="absolute right-2 top-1/2 -translate-y-1/2 text-blue-500 hover:text-blue-600">
                            <Trash2 class="h-4 w-4" />
                        </button>
                    </div>
                    <button
                        @click="showFileExplorer = true"
                        class="flex w-[120px] items-center justify-center gap-2 rounded bg-blue-600 px-3.5 py-1.5 text-sm text-white hover:bg-blue-700">
                        <FolderOpen class="h-4 w-4" />
                        <span>Browse</span>
                    </button>
                    <FileExplorer
                        :is-open="showFileExplorer"
                        @close="showFileExplorer = false"
                        @select="handleFileSelect" />
                </div>
            </div>
            <div
                v-if="!store.isCreationMode"
                class="h-5"></div>
            <div
                v-if="store.isCreationMode"
                class="mb-4">
                <CreationModeInputs
                    v-model="snippetTemplateData"
                    @update:modelValue="updateSnippetTemplateData" />
            </div>
        </div>

        <div class="editor-wrapper">
            <div class="relative isolate">
                <button
                    @click="clearAll"
                    class="editor-clear-btn">
                    Clear
                </button>
                <MonacoEditor
                    v-model="editorContent"
                    :language="inputLanguage"
                    :height="store.isCreationMode ? 'calc(100vh - 350px)' : ''"
                    :context-menu-items="editorContextMenuItems"
                    @context-menu-action="handleEditorContextMenu"
                    :disable-validation="store.isCreationMode" />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useToast } from "vue-toastification";
import { useAppStore } from "@/stores/app";
import { detectInputFormat } from "@/utils/detector";
import { generateSnippet, formatSnippetJson } from "@/utils/snippetConverter";
import { convertToWebStormTemplate } from "@/utils/vscodeToWebstorm";
import { parseWebStormTemplate, convertToSnippets } from "@/utils/converter";
import MonacoEditor from "./MonacoEditor.vue";
import CreationModeInputs from "./CreationModeInputs.vue";
import FileExplorer from "./FileExplorer.vue";
import { Trash2, FolderOpen } from "lucide-vue-next";

const store = useAppStore();
const toast = useToast();

// Local state
const showFileExplorer = ref(false);
const fileInput = ref<HTMLInputElement>();
const editorContent = ref("");
const snippetTemplateData = ref({
    name: "",
    scope: "",
    description: "",
});

// Add monacoInstance at the top with other state variables
const monacoInstance = ref<any>(null);

// Watch for store content changes
watch(
    () => store.sourceContent,
    (newValue) => {
        if (editorContent.value !== newValue) {
            editorContent.value = newValue;
        }
    },
    { immediate: true }
);

watch(editorContent, (newValue) => {
    updateContent(newValue);
});

// Watch for mode changes to reset the editor content
watch(
    () => store.isCreationMode,
    () => {
        editorContent.value = "";
        snippetTemplateData.value = {
            name: "",
            scope: "",
            description: "",
        };
    }
);

const inputLanguage = computed(() => {
    if (store.isCreationMode) return "typescript";
    return detectInputFormat(editorContent.value) === "xml" ? "xml" : "vscode-snippet";
});

const panelTitle = computed(() => {
    if (!editorContent.value.trim() || store.isCreationMode) return "Source Input";
    const format = detectInputFormat(editorContent.value);
    return format === "xml" ? "Live Templates" : "VSCode Snippets";
});

function updateContent(value: string) {
    store.setSourceContent(value);
    editorContent.value = value;
    if (store.isCreationMode) {
        generateVSCodeSnippet(value);
    } else {
        createSnippetsFromSourceContent();
    }
}

function clearAll() {
    store.clearContent();
    store.setInputFilename("");
    store.setSnippets({});
    editorContent.value = "";
    snippetTemplateData.value = {
        name: "",
        scope: "",
        description: "",
    };
}

function clearFilename() {
    store.setInputFilename("");
}

function updateSnippetTemplateData(data: typeof snippetTemplateData.value) {
    snippetTemplateData.value = data;
    generateVSCodeSnippet(editorContent.value);
}

function generateVSCodeSnippet(sourceCode: string) {
    if (!sourceCode.trim()) {
        store.setSnippets({});
        return;
    }

    const snippet = generateSnippet({
        name: snippetTemplateData.value.name || "untitled",
        prefix: snippetTemplateData.value.name || "untitled",
        description: snippetTemplateData.value.description,
        scope: snippetTemplateData.value.scope,
        sourceCode,
    });

    if (!Object.keys(snippet).length) {
        store.setSnippets({});
        return;
    }

    store.setSnippets(snippet);
}

function createSnippetsFromSourceContent() {
    try {
        if (!store.sourceContent.trim()) {
            store.setSnippets({});
            store.setOutputFormat("json");
            return;
        }

        const inputFormat = detectInputFormat(store.sourceContent);
        store.setOutputFormat(inputFormat === "xml" ? "json" : "xml");

        if (inputFormat === "xml") {
            const templates = parseWebStormTemplate(store.sourceContent);
            store.setSnippets(convertToSnippets(templates));
        } else {
            const content = store.sourceContent.trim();
            const vsCodeSnippets = content.startsWith("{") ? JSON.parse(content) : JSON.parse(`{${content}}`);
            store.setSnippets(vsCodeSnippets);
        }
    } catch (error) {
        console.error("Error converting template:", error);
        toast.error("Invalid template format");
    }
}

function openFileDialog() {
    try {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".json,.xml";

        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;
            store.setInputFilename(file.name);

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
    store.setInputFilename(filename);
    updateContent(content);
}

interface EditorSelection {
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
}

// Add these utility functions
function getOffsetFromPosition(content: string, lineNumber: number, column: number): number {
    const lines = content.split("\n");
    let offset = 0;

    // Add up lengths of all previous lines
    for (let i = 0; i < lineNumber - 1; i++) {
        offset += lines[i].length + 1; // +1 for the newline character
    }

    // Add the columns in the current line
    offset += column - 1;

    return offset;
}

function getSelectedText(content: string, selection: EditorSelection): string {
    const startOffset = getOffsetFromPosition(content, selection.startLineNumber, selection.startColumn);
    const endOffset = getOffsetFromPosition(content, selection.endLineNumber, selection.endColumn);

    return content.substring(startOffset, endOffset);
}

// Example handler for context menu action that includes selection
function handleEditorAction(actionData: { id: string; selection?: EditorSelection }) {
    if (actionData.selection) {
        const selectedText = getSelectedText(editorContent.value, actionData.selection);
        // Now you can use the selected text
        console.log("Selected text:", selectedText);
    }
}

// Update findNextTabstopNumber to include both standard and placeholder/choice formats
function findNextTabstopNumber(content: string): number {
    const regex = /\$(?:\{(\d+)[:|]|\{?(\d+)\}?)/g;
    let match;
    let highest = 0;

    while ((match = regex.exec(content)) !== null) {
        const num = parseInt(match[1] || match[2], 10);
        if (num > highest) highest = num;
    }

    return highest + 1;
}

// Simplify insertSnippetText to be more direct
function insertSnippetText(editor: any, text: string) {
    const selection = editor.getSelection();
    const position = editor.getPosition();
    const range = selection.isEmpty()
        ? new monacoInstance.value.Range(position.lineNumber, position.column, position.lineNumber, position.column)
        : selection;

    editor.executeEdits("snippet-insert", [
        {
            range: range,
            text: text,
            forceMoveMarkers: true,
        },
    ]);
}

// Add new computed property for context menu items
const editorContextMenuItems = computed(() => [
    {
        id: "insertTabstop",
        label: "Insert Tabstop",
        keybinding: "Alt+1",
    },
    {
        id: "insertFinalTabstop",
        label: "Insert Final Tabstop",
        keybinding: "Alt+7",
    },
    {
        id: "insertPlaceholder",
        label: "Insert Placeholder",
        keybinding: "Alt+8",
    },
    {
        id: "insertChoice",
        label: "Insert Choice Placeholder",
        keybinding: "Alt+9",
    },
]);

// Update handleEditorContextMenu to properly handle cursor positioning
function handleEditorContextMenu(id: string, editor: any) {
    const nextNum = findNextTabstopNumber(editorContent.value);
    // Get Monaco instance from the editor if needed
    if (!monacoInstance.value) {
        monacoInstance.value = (window as any).monaco;
    }

    const selection = editor.getSelection();
    const position = editor.getPosition();

    switch (id) {
        case "insertTabstop":
            insertSnippetText(editor, `$${nextNum}`);
            break;

        case "insertFinalTabstop":
            insertSnippetText(editor, "$0");
            break;

        case "insertPlaceholder": {
            const text = `\${${nextNum}:}`;
            insertSnippetText(editor, text);
            editor.setPosition({
                lineNumber: position.lineNumber,
                column: position.column + text.indexOf(":") + 1,
            });
            editor.focus();
            break;
        }

        case "insertChoice": {
            const text = `\${${nextNum}||}`;
            insertSnippetText(editor, text);
            editor.setPosition({
                lineNumber: position.lineNumber,
                column: position.column + text.indexOf("|") + 1,
            });
            editor.focus();
            break;
        }
    }
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
    padding: 0.3rem 0.75rem;
    font-size: 0.8125rem;
    line-height: 1.15rem;
    color: white;
    background-color: rgb(220 38 38);
    border-radius: 0.25rem;
    transition: background-color 0.2s;
}

.editor-clear-btn:hover {
    background-color: rgb(185 28 28);
}
</style>

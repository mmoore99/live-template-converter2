<template>
    <div class="p-4 bg-white rounded-lg shadow">
        <div :class="store.isCreationMode ? 'h-[135px]' : 'h-[84px]'">
            <div :class="['flex justify-between', store.isCreationMode ? 'items-start' : 'items-center']">
                <div>
                    <h2 class="text-xl font-semibold">Generated Output</h2>
                    <div v-if="store.isCreationMode" class="mt-1 space-y-1">
                        <label class="flex items-center">
                            <input type="radio" v-model="localOutputType" value="snippet" class="w-4 h-4 text-blue-600" />
                            <span class="ml-2 text-sm text-gray-700">VSCode Snippet</span>
                        </label>
                        <label class="flex items-center">
                            <input type="radio" v-model="localOutputType" value="template" class="w-4 h-4 text-blue-600" />
                            <span class="ml-2 text-sm text-gray-700">Live Template</span>
                        </label>
                    </div>
                    <p v-if="hasValidContent" class="text-sm text-gray-600">{{ store.templateCount }} {{ language === "xml" ? (store.templateCount === 1 ? "live template" : "live templates") : store.templateCount === 1 ? "snippet" : "snippets" }} generated</p>
                </div>
                <div class="flex gap-[10px]">
                    <button @click="copyToClipboard" class="w-[120px] px-3.5 py-1.5 text-sm text-white bg-blue-600 rounded hover:bg-blue-700 flex items-center justify-center gap-2">
                        <ClipboardCopy class="w-4 h-4" />
                        <span>Copy</span>
                    </button>
                    <button v-if="!store.isCreationMode" @click="handleDownload" class="w-[120px] px-3.5 py-1.5 text-sm text-white bg-green-600 rounded hover:bg-green-700 flex items-center justify-center gap-2">
                        <Download class="w-4 h-4" />
                        <span>Download</span>
                    </button>
                </div>
            </div>
            <div class="flex items-center justify-center" :class="[hasValidContent ? 'h-[35px]' : 'h-[44px]']">
                <div class="flex items-center gap-4">
                    <TemplateSetControls v-if="language === 'xml' && hasValidContent" v-model="store.includeTemplateSet" v-model:groupValue="store.templateSetGroup" />
                    <OutputToggle 
                        v-if="language === 'vscode-snippet' && hasValidContent" 
                        v-model="store.includeBrackets"
                        label="Enclose in braces"
                    />
                    <OutputToggle 
                        v-if="hasValidContent"
                        v-model="store.sortOutput"
                        :label="`Sort ${language === 'xml' ? 'Templates' : 'Snippets'}`"
                    />
                </div>
            </div>
        </div>
        <div class="">
            <MonacoEditor 
                v-model="editorContent" 
                :language="language" 
                :read-only="true" 
                :height="store.isCreationMode ? 'calc(100vh - 275px)' : ''"
                :context-menu-items="contextMenuItems"
                @context-menu-action="handleContextMenuAction"
            />
        </div>
    </div>
    <FileNameDialog :is-open="showFileNameDialog" :extension="downloadExtension" :default-filename="getDefaultFilename()" @confirm="handleDownloadConfirm" @close="showFileNameDialog = false" />
</template>

<script setup lang="ts">
    import { ref, computed, watch } from "vue";
    import { useToast } from "vue-toastification";
    import { useAppStore } from "@/stores/app";
    import MonacoEditor from "./MonacoEditor.vue";
    import OutputToggle from "./OutputToggle.vue";
    import TemplateSetControls from "./TemplateSetControls.vue";
    import FileNameDialog from "./FileNameDialog.vue";
    import { formatSnippetOutput } from "@/utils/formatter";
    import { convertToWebStormTemplate } from "@/utils/vscodeToWebstorm";
    import { ClipboardCopy, Download } from "lucide-vue-next";

    const store = useAppStore();
    const toast = useToast();

    const editorContent = ref("");
    const showFileNameDialog = ref(false);
    const downloadExtension = ref("");
    const localOutputType = ref(store.outputType);

    const contextMenuItems = computed(() => [
        {
            id: 'copy',
            label: 'Copy to Clipboard',
            keybinding: 'Ctrl+C'
        },
        {
            id: 'download',
            label: 'Download File',
            keybinding: 'Ctrl+S'
        }
    ]);

    function handleContextMenuAction(id: string) {
        switch (id) {
            case 'copy':
                copyToClipboard();
                break;
            case 'download':
                if (!store.isCreationMode) {
                    handleDownload();
                }
                break;
        }
    }

    // Watch for changes to snippets and update editor content
    watch(
        () => [
            store.snippets,
            store.includeBrackets,
            localOutputType.value,
            store.sourceContent,
            store.includeTemplateSet, 
            store.templateSetGroup, 
            store.sortOutput, // Add this
        ],
        () => {
            if (store.isCreationMode) {
                if (localOutputType.value === "snippet") {
                    const output = formatSnippetOutput(store.snippets!, store.includeBrackets, store.sortOutput);
                    editorContent.value = output || "";
                } else {
                    editorContent.value = convertToWebStormTemplate(store.snippets!, {
                        includeTemplateSet: store.includeTemplateSet,
                        group: store.templateSetGroup,
                        sort: store.sortOutput,
                    });
                }
            } else if (store.outputFormat === "json") {
                const output = formatSnippetOutput(store.snippets!, store.includeBrackets, store.sortOutput);
                editorContent.value = output || "";
            } else {
                editorContent.value = convertToWebStormTemplate(store.snippets!, {
                    includeTemplateSet: store.includeTemplateSet,
                    group: store.templateSetGroup,
                    sort: store.sortOutput,
                });
            }
        },
        { immediate: true }
    );

    watch(localOutputType, (newValue) => {
        store.setOutputType(newValue);
    });

    const hasValidContent = computed(() => {
        return (store.sourceContent.trim() && !store.isCreationMode) || (store.isCreationMode && store.snippets && Object.keys(store.snippets).length > 0);
    });

    const language = computed(() => (store.isCreationMode ? (localOutputType.value === "snippet" ? "vscode-snippet" : "xml") : store.outputFormat === "json" ? "vscode-snippet" : "xml"));

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

    function handleDownload() {
        downloadExtension.value = language.value === "vscode-snippet" ? "json" : "xml";
        showFileNameDialog.value = true;
    }

    function handleDownloadConfirm(filename: string) {
        const blob = new Blob([editorContent.value], {
            type: language.value === "vscode-snippet" ? "application/json" : "application/xml",
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
        const timestamp = now.getFullYear().toString() + String(now.getMonth() + 1).padStart(2, "0") + String(now.getDate()).padStart(2, "0") + String(now.getHours()).padStart(2, "0") + String(now.getMinutes()).padStart(2, "0");

        return language.value === "vscode-snippet" ? `GeneratedvscodeSnippets-${timestamp}` : `GeneratedLiveTemplates-${timestamp}`;
    }
</script>

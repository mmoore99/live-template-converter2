<template>
    <div class="min-h-screen p-4 bg-gray-100">
        <div class="container mx-auto max-w-[1800px]">
            <div class="flex items-center justify-between mb-8">
                <div class="flex items-center gap-4">
                    <button @click="switchMode" class="px-3.5 py-1.5 text-sm text-white rounded" :class="isCreationMode ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-blue-600 hover:bg-blue-700'">
                        {{ isCreationMode ? "Switch to Convert" : "Switch to Create" }}
                    </button>
                </div>
                <h1 class="text-3xl font-bold">
                    {{ isCreationMode ? "Snippet/Live Template Creator" : "Snippet/Live Template Converter" }}
                </h1>
                <div class="w-[120px]"></div>
            </div>

            <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div class="flex flex-col">
                    <SourcePanel
                        v-model="sourceContent"
                        :template-count="templateCount"
                        :is-creation-mode="isCreationMode"
                        @update:is-creation-mode="isCreationMode = $event"
                        @snippet-generated="handleSnippetGenerated"
                        @update:input-filename="inputFilename = $event"
                        @clear="clearSource"
                    />
                </div>

                <div class="flex flex-col">
                    <OutputPanel
                        ref="outputPanelRef"
                        :content="formattedOutput"
                        :filename="filename"
                        :language="isCreationMode ? (outputType === 'snippet' ? 'vscode-snippet' : 'xml') : (outputFormat === 'json' ? 'vscode-snippet' : 'xml')"
                        :include-template-set="includeTemplateSet"
                        :template-set-group="templateSetGroup"
                        :template-count="templateCount"
                        :include-brackets="includeBrackets"
                        :is-creation-mode="isCreationMode"
                        @copy="copyToClipboard"
                        @download="handleDownloadSnippetOrLiveTemplate"
                        @update:output-type="outputType = $event"
                        @update:include-brackets="includeBrackets = $event"
                        @update:include-template-set="includeTemplateSet = $event"
                        @update:template-set-group="templateSetGroup = $event"
                    />
                </div>
            </div>
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
    import { ref, computed, watch, onMounted } from "vue";
    import { useToast } from "vue-toastification";
    import { useRoute } from "./composables/route";
    import { parseWebStormTemplate, convertToSnippets } from "./utils/converter";
    import { convertToWebStormTemplate } from "./utils/vscodeToWebstorm";
    import { detectInputFormat } from "./utils/detector";
    import { formatSnippetOutput, getFormattedContent, type SnippetOutput } from "./utils/formatter";
    import InputFilenameField from "./components/InputFilenameField.vue";
    import FilenameInput from "./components/FilenameInput.vue";
    import SourcePanel from "./components/SourcePanel.vue";
    import OutputPanel from "./components/OutputPanel.vue";
    import FileNameDialog from "./components/FileNameDialog.vue";

    const toast = useToast();
    const sourceContent = ref("");
    const snippets = ref<SnippetOutput>({});
    const filename = ref("");
    const inputFilename = ref("");
    const includeBrackets = ref(false);
    const includeTemplateSet = ref(true);
    const templateSetGroup = ref("");
    const outputFormat = ref<"xml" | "json">("json");
    const isCreationMode = ref(false);
    const outputType = ref("snippet");
    const showFileNameDialog = ref(false);
    const downloadContent = ref<string>("");
    const downloadExtension = ref("");

    const outputPanelRef = ref(null);

    const route = useRoute();

    function switchMode() {
        isCreationMode.value = !isCreationMode.value;
        sourceContent.value = "";
        snippets.value = {};
    }

    // Initialize mode based on URL path
    onMounted(() => {
        const path = window.location.pathname;
        isCreationMode.value = path.includes("/create");
    });

    // Watch for route changes
    watch(
        () => route.getPath(),
        (path) => {
            isCreationMode.value = path.includes("/create");
            sourceContent.value = "";
            snippets.value = {};
        },
        { immediate: true }
    );

    // Update URL when mode changes
    watch(isCreationMode, (newValue) => {
        const newPath = newValue ? "/create" : "/";
        const currentPath = route.getPath();
        if (currentPath !== newPath) {
            route.setPath(newPath);
        }
    });

    const formattedOutput = computed(() => {
        if (isCreationMode.value) {
            if (outputType.value === "snippet") {
                return formatSnippetOutput(snippets, includeBrackets.value);
            } else {
                return convertToWebStormTemplate(snippets.value, {
                    includeTemplateSet: false,
                    group: "Custom",
                });
            }
        } else if (outputFormat.value === "json") {
            return formatSnippetOutput(snippets, includeBrackets.value);
        }
        return convertToWebStormTemplate(snippets.value, {
            includeTemplateSet: includeTemplateSet.value && !!filename.value,
            group: templateSetGroup.value,
        });
    });

    const templateCount = computed(() => {
        return Object.keys(snippets.value).length;
    });

    function convertTemplate() {
        try {
            if (!sourceContent.value.trim()) {
                snippets.value = {};
                outputFormat.value = "json";
                return;
            }

            const format = detectInputFormat(sourceContent.value);
            outputFormat.value = format === "xml" ? "json" : "xml";

            if (format === "xml") {
                const templates = parseWebStormTemplate(sourceContent.value);
                snippets.value = convertToSnippets(templates);
            } else {
                // Handle both complete JSON objects and partial snippets
                const content = sourceContent.value.trim();
                const vsCodeSnippets = content.startsWith("{") ? JSON.parse(content) : JSON.parse(`{${content}}`);
                snippets.value = vsCodeSnippets;
            }
        } catch (error) {
            console.error("Error converting template:", error);
            toast.error("Invalid template format");
        }
    }

    function clearSource() {
        sourceContent.value = "";
        snippets.value = {};
    }

    async function copyToClipboard() {
        // Invoke copy method directly on OutputPanel component
        outputPanelRef.value?.copyToClipboard();
    }

    function handleDownloadSnippetOrLiveTemplate() {
        const content = outputPanelRef.value?.editorContent || "";
        downloadContent.value = content;
        downloadExtension.value = outputFormat.value === "json" ? "json" : "xml";
        showFileNameDialog.value = true;
    }

    function handleDownloadConfirm(filename: string) {
        const blob = new Blob([downloadContent.value], {
            type: outputFormat.value === "json" ? "application/json" : "application/xml",
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

    function handleFileSelected(content: string) {
        sourceContent.value = content;
    }

    function handleSnippetGenerated(snippetContent: string) {
        snippets.value = JSON.parse(`{${snippetContent}}`);
    }

    function getDefaultFilename(): string {
        const now = new Date();
        const timestamp = now.getFullYear().toString() + String(now.getMonth() + 1).padStart(2, "0") + String(now.getDate()).padStart(2, "0") + String(now.getHours()).padStart(2, "0") + String(now.getMinutes()).padStart(2, "0");

        return outputFormat.value === "json" ? `GeneratedvscodeSnippets-${timestamp}` : `GeneratedLiveTemplates-${timestamp}`;
    }

    // Watch for source content changes
    watch(sourceContent, (newValue) => {
        if (!isCreationMode.value) {
            convertTemplate();
        }
    });
</script>

import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { VSCodeSnippet } from "@/types";

export const useAppStore = defineStore("app", () => {
    // State
    const sourceContent = ref("");
    const snippets = ref<Record<string, VSCodeSnippet> | null>(null);
    const filename = ref("");
    const inputFilename = ref("");
    const includeBrackets = ref(false);
    const includeTemplateSet = ref(true);
    const templateSetGroup = ref("");
    const outputFormat = ref<"xml" | "json">("json");
    const isCreationMode = ref(false);
    const outputType = ref("snippet");

    // Computed
    const templateCount = computed(() => {
        if (!snippets.value) return 0;
        return Object.keys(snippets.value).length;
    });

    // Actions
    function setSourceContent(content: string) {
        sourceContent.value = content;
    }

    function setSnippets(newSnippets: Record<string, VSCodeSnippet>) {
        snippets.value = newSnippets;
    }

    function clearContent() {
        sourceContent.value = "";
        snippets.value = {};
    }

    function setFilename(name: string) {
        filename.value = name;
    }

    function setInputFilename(name: string) {
        inputFilename.value = name;
    }

    function setCreationMode(value: boolean) {
        isCreationMode.value = value;
    }

    function toggleCreationMode() {
        isCreationMode.value = !isCreationMode.value;
        clearContent();
        setInputFilename("");
        setFilename("");
        setOutputFormat("json");
        setOutputType("snippet");
        setIncludeBrackets(false);
        setIncludeTemplateSet(true);
        setTemplateSetGroup("");
    }

    function setOutputFormat(format: "xml" | "json") {
        outputFormat.value = format;
    }

    function setOutputType(type: string) {
        outputType.value = type;
    }

    function setIncludeBrackets(include: boolean) {
        includeBrackets.value = include;
    }

    function setIncludeTemplateSet(include: boolean) {
        includeTemplateSet.value = include;
    }

    function setTemplateSetGroup(group: string) {
        templateSetGroup.value = group;
    }

    return {
        // State
        sourceContent,
        snippets,
        filename,
        inputFilename,
        includeBrackets,
        includeTemplateSet,
        templateSetGroup,
        outputFormat,
        isCreationMode,
        outputType,

        // Computed
        templateCount,

        // Actions
        setSourceContent,
        setSnippets,
        clearContent,
        setFilename,
        setInputFilename,
        setCreationMode,
        toggleCreationMode,
        setOutputFormat,
        setOutputType,
        setIncludeBrackets,
        setIncludeTemplateSet,
        setTemplateSetGroup,
    };
});

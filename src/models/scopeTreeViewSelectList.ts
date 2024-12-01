export interface ScopeItem {
    snippetId: string;
    liveTemplateId: string;
    label: string;
    isChecked: boolean;
    isExpanded?: boolean;
    children?: ScopeItem[];
}

export interface ScopeGroup {
    snippetId: string;
    liveTemplateId: string;
    label: string;
    isChecked: boolean;
    isExpanded: boolean;
    children: ScopeItem[];
}

export const scopeTreeViewSelectList: ScopeGroup[] = [
    {
        snippetId: "javascript",
        liveTemplateId: "JAVA_SCRIPT",
        label: "JavaScript",
        isExpanded: false,
        isChecked: false,
        children: [
            {
                snippetId: "javascript",
                liveTemplateId: "JS_CLASS",
                label: "Class/Interface",
                isChecked: false,
            },
            {
                snippetId: "javascript",
                liveTemplateId: "JS_EXPRESSION",
                label: "Expression",
                isChecked: false,
                isExpanded: false,
            },
            {
                snippetId: "javascript",
                liveTemplateId: "JS_STATEMENT",
                label: "Statement",
                isExpanded: false,
                isChecked: false,
            },
            {
                snippetId: "javascript",
                liveTemplateId: "JS_TOP_LEVEL_STATEMENT",
                label: "Top Level Statement",
                isExpanded: false,
                isChecked: false,
            },
        ],
    },
    {
        snippetId: "typescript",
        liveTemplateId: "TypeScript",
        label: "TypeScript",
        isExpanded: false,
        isChecked: false,
        children: [
            {
                snippetId: "typescript",
                liveTemplateId: "TS_CLASS",
                label: "Class/Interface",
                isChecked: false,
            },
            {
                snippetId: "typescript",
                liveTemplateId: "TS_EXPRESSION",
                label: "Expression",
                isChecked: false,
                isExpanded: false,
            },
            {
                snippetId: "typescript",
                liveTemplateId: "TS_STATEMENT",
                label: "Statement",
                isExpanded: false,
                isChecked: false,
            },
            {
                snippetId: "typescript",
                liveTemplateId: "TS_TOP_LEVEL_STATEMENT",
                label: "Top Level Statement",
                isExpanded: false,
                isChecked: false,
            },
        ],
    },
    {
        snippetId: "vue",
        liveTemplateId: "Vue",
        label: "Vue",
        isExpanded: false,
        isChecked: false,
        children: [
            {
                snippetId: "vue",
                liveTemplateId: "VUE_COMPONENT",
                label: "Vue component",
                isChecked: false,
            },
            {
                snippetId: "vue",
                liveTemplateId: "VUE_SCRIPT",
                label: "Vue script tag content",
                isChecked: false,
            },
            {
                snippetId: "vue",
                liveTemplateId: "VUE_TEMPLATE",
                label: "Vue template",
                isChecked: false,
            },
            {
                snippetId: "vue",
                liveTemplateId: "VUE_TEMPLATE_TAG",
                label: "Vue template tag element",
                isChecked: false,
            },
            {
                snippetId: "vue",
                liveTemplateId: "VUE_TOP_LEVEL",
                label: "Vue top-level element",
                isChecked: false,
            },
            {
                snippetId: "vue",
                liveTemplateId: "VUE_OTHER",
                label: "Other",
                isChecked: false,
            },
        ],
    },
];

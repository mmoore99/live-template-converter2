import { Variable, WebStormTemplate } from "@/types";

const defaultLabels: Record<string, string> = {
    NAME: "name",
    PARAMS: "params",
    ARRAY: "array",
    ITEM: "item",
    CONDITION: "condition",
    EXPRESSION: "expression",
    METHOD_NAME: "methodName",
    COMPONENT_NAME: "componentName",
};

const scopeMappings: Record<string, string> = {
    js: "javascript",
    java_script: "javascript",
    ts: "typescript",
    typescript: "typescript",
    vue: "vue",
};

function parseEnumExpression(expression: string): string[] {
    if (!expression) return [];

    const match = expression.match(/enum\((.*)\)/);
    if (!match) return [];

    return match[1]
        .split(",")
        .map((s) => s.trim().replace(/"/g, ""))
        .filter(Boolean);
}

function createPlaceholder(variable: Variable, index: number): string {
    if (variable.enumValues.length > 0) {
        const choices = variable.enumValues.join(",");
        return `\${${index}|${choices}|}`;
    }

    const label = getVariableLabel(variable);
    return label ? `\${${index}:${label}}` : `\${${index}}`;
}

function getVariableLabel(variable: Variable): string {
    if (!variable.defaultValue || variable.defaultValue === '""') return "";

    if (variable.name in defaultLabels) {
        return defaultLabels[variable.name];
    }

    return variable.defaultValue.replace(/"/g, "");
}

function determineScope(options: string[]): string {
    const standardScopes = new Set<string>();
    const originalScopes = new Set<string>();

    for (const option of options) {
        let isMappedScope = false;
        for (const [key, value] of Object.entries(scopeMappings)) {
            if (option.toLowerCase().includes(key.toLowerCase())) {
                standardScopes.add(value);
                isMappedScope = true;
                break;
            }
        }
        // Add all original options regardless of mapping
        originalScopes.add(option);
    }

    // Prioritize javascript, typescript, and vue scopes
    const priorityScopes = ["javascript", "typescript", "vue"];

    const allScopes = [...standardScopes, ...originalScopes];
    return allScopes
        .sort((a, b) => {
            const aIndex = priorityScopes.indexOf(a);
            const bIndex = priorityScopes.indexOf(b);
            if (aIndex !== -1 && bIndex === -1) return -1;
            if (aIndex === -1 && bIndex !== -1) return 1;
            if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
            return a.localeCompare(b);
        })
        .join(",");
}

function processBody(template: WebStormTemplate): string[] {
    let value = template.value;
    let varIndex = 1;

    // Replace variables with placeholders
    for (const variable of template.variables) {
        const placeholder = createPlaceholder(variable, varIndex++);
        value = value.replace(new RegExp(`\\$${variable.name}\\$`, "g"), placeholder);
    }

    // Replace end marker and HTML entities
    value = value
        .replace(/\$END\$/g, "$0")
        .replace(/\$SELECTION\$/g, "$TM_SELECTED_TEXT")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");

    // Escape dollar signs and backslashes
    value = value
        .replace(/\\(?!\\)/g, "\\\\")
        .replace(/`([^`]*)`/g, (match) => match.replace(/\$\{/g, "\\${"))
        .replace(/\$(?![\d{])/g, "\\$");

    // Split into lines while preserving empty lines and indentation
    return value.split(/(?:&#10;|\n)/);
}

export function convertToSnippets(templates: WebStormTemplate[]): Record<string, any> {
    const snippets: Record<string, any> = {};

    for (const template of templates) {
        snippets[template.name] = {
            prefix: template.name,
            body: processBody(template),
            description: template.description,
            scope: determineScope(template.contextOptions),
        };
    }

    return snippets;
}

export function parseWebStormTemplate(content: string): WebStormTemplate[] {
    const wrappedContent = content.trim().startsWith("<?xml") || content.trim().startsWith("<templateSet") ? content : `<templateSet>${content}</templateSet>`;

    const parser = new DOMParser();
    const doc = parser.parseFromString(wrappedContent, "text/xml");

    if (doc.documentElement.nodeName === "parsererror") {
        throw new Error("Invalid XML format");
    }

    const templates = doc.getElementsByTagName("template");

    return Array.from(templates).map((t) => {
        const contextElement = t.getElementsByTagName("context")[0];
        const options = contextElement ? Array.from(contextElement.getElementsByTagName("option")).map((o) => o.getAttribute("name") || "") : [];

        return {
            name: t.getAttribute("name") || "",
            value: t.getAttribute("value") || "",
            description: t.getAttribute("description") || "",
            variables: Array.from(t.getElementsByTagName("variable")).map((v) => ({
                name: v.getAttribute("name") || "",
                expression: v.getAttribute("expression") || "",
                defaultValue: v.getAttribute("defaultValue") || "",
                enumValues: parseEnumExpression(v.getAttribute("expression") || ""),
            })),
            contextOptions: options,
        };
    });
}
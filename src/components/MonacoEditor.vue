<template>
    <div class="monaco-container">
        <div
            ref="editorContainer"
            class="w-full overflow-hidden rounded border"
            :style="{ height: height || 'calc(100vh - 220px)' }"></div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from "vue";
import loader from "@monaco-editor/loader";
import type * as monaco from "monaco-editor";

interface ContextMenuItem {
    id: string;
    label: string;
    keybinding?: string;
}

const monacoInstance = ref<typeof monaco>();
loader.config({ paths: { vs: "https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs" } });

function configureTypeScript(monaco: typeof monacoInstance, disableValidation = false) {
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
        target: monaco.languages.typescript.ScriptTarget.Latest,
        allowNonTsExtensions: true,
        moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
        module: monaco.languages.typescript.ModuleKind.CommonJS,
        noEmit: true,
        esModuleInterop: true,
        jsx: monaco.languages.typescript.JsxEmit.React,
        reactNamespace: "React",
        allowJs: true,
        typeRoots: ["node_modules/@types"],
        strict: !disableValidation, // Turn off strict checking if validation is disabled
        lib: ["es2020", "dom"],
    });

    if (disableValidation) {
        monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
            noSemanticValidation: true,
            noSyntaxValidation: true,
            noSuggestionDiagnostics: true,
            diagnosticCodesToIgnore: [1005, 1006, 1010, 1011, 1109, 1128, 1161, 1308, 1378], // Common TypeScript errors
        });
    }
}

// Add this function after the configureTypeScript function
function updateTypeScriptValidation(monaco: typeof monacoInstance, disable: boolean) {
    // Turn off all TypeScript validations
    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: disable,
        noSyntaxValidation: disable,
        noSuggestionDiagnostics: disable,
        diagnosticCodesToIgnore: disable ? [1005, 1006, 1010, 1011, 1109, 1128, 1161, 1308, 1378] : [],
    });

    // Update the editor model if it exists
    if (editor) {
        const model = editor.getModel();
        if (model) {
            model.updateOptions({
                semanticHighlighting: { enabled: !disable },
                formatOnType: !disable,
                formatOnPaste: !disable,
            });
        }

        // Update editor options
        editor.updateOptions({
            renderValidationDecorations: disable ? "off" : "on",
            semanticValidation: !disable,
            syntaxValidation: !disable,
            quickSuggestions: !disable,
            parameterHints: { enabled: !disable },
            suggestOnTriggerCharacters: !disable,
            acceptSuggestionOnEnter: disable ? "off" : "on",
            tabCompletion: disable ? "off" : "on",
            wordBasedSuggestions: !disable,
            lightbulb: { enabled: !disable },
            signatureHelp: { enabled: !disable },
            hover: { enabled: !disable },
            colorDecorators: !disable,
            gotoLocation: { enabled: !disable },
            codeLens: !disable,
            snippetSuggestions: disable ? "none" : "inline",
            occurrencesHighlight: !disable,
            inlayHints: { enabled: !disable },
        });
    }
}

// Add basic TypeScript/JavaScript types
function addTypeScriptTypes(monaco: typeof monacoInstance) {
    monaco.languages.typescript.typescriptDefaults.addExtraLib(
        `
  declare var console: {
    log(message?: any, ...optionalParams: any[]): void;
    error(message?: any, ...optionalParams: any[]): void;
    warn(message?: any, ...optionalParams: any[]): void;
    info(message?: any, ...optionalParams: any[]): void;
  };
  `,
        "global.d.ts"
    );
}

// Add this helper function at the top level
function formatXml(xml: string): string {
    let formatted = "";
    let indent = "";
    const tab = "  "; // 2 spaces
    xml.split(/>\s*</).forEach(function (node) {
        if (node.match(/^\/\w/)) indent = indent.substring(tab.length); // decrease indent
        formatted += indent + "<" + node + ">\r\n";
        if (node.match(/^<?\w[^>]*[^\/]$/)) indent += tab; // increase indent
    });
    return formatted.substring(1, formatted.length - 3);
}

// Register XML language if not already registered
function registerXmlLanguage(monaco: typeof monacoInstance) {
    if (!monaco.languages.getLanguages().some((lang) => lang.id === "xml")) {
        monaco.languages.register({ id: "xml" });
        monaco.languages.setMonarchTokensProvider("xml", {
            defaultToken: "",
            tokenPostfix: ".xml",

            tokenizer: {
                root: [
                    [/^\s+$/, ""], // Handle whitespace-only lines
                    [/[<&]/, { token: "delimiter.xml", next: "@tag" }],
                    [/[^<&\s][\s\S]*?(?=[<&]|$)/, "text.xml"], // Modified text handling
                ],

                tag: [
                    [/[<](\/?)([\w\-:.]+)/, ["delimiter.xml", { token: "tag.xml", next: "@tagAttributes" }]],
                    [/>/, { token: "delimiter.xml", next: "@pop" }],
                    [/[&][\w\-:.]+;/, "entity.xml"],
                ],

                tagAttributes: [
                    [/[\w\-:.]+/, "attribute.name.xml"],
                    [/=/, "delimiter.xml"],
                    [/"([^"]*)"/, "attribute.value.xml"],
                    [/'([^']*)'/, "attribute.value.xml"],
                    [/>/, { token: "delimiter.xml", next: "@pop" }],
                ],
            },
        });

        // Update XML language configuration
        monaco.languages.setLanguageConfiguration("xml", {
            brackets: [
                ["<", ">"],
                ["<!--", "-->"],
            ],
            autoClosingPairs: [
                { open: "<", close: ">" },
                { open: '"', close: '"' },
                { open: "'", close: "'" },
            ],
            surroundingPairs: [
                { open: "<", close: ">" },
                { open: '"', close: '"' },
                { open: "'", close: "'" },
            ],
            folding: {
                markers: {
                    start: new RegExp("^\\s*<!--\\s*#region\\b.*-->"),
                    end: new RegExp("^\\s*<!--\\s*#endregion\\b.*-->"),
                },
            },
            onEnterRules: [
                {
                    beforeText: new RegExp(`<([_:\\w][_:\\w-.\\d]*)([^/>]*(?!/)>)[^<]*$`, "i"),
                    afterText: /^<\/([_:\w][_:\w-.\d]*)\s*>$/i,
                    action: { indentAction: monaco.languages.IndentAction.IndentOutdent },
                },
                {
                    beforeText: new RegExp(`<(\\w[\\w\\d]*)([^/>]*(?!/)>)[^<]*$`, "i"),
                    action: { indentAction: monaco.languages.IndentAction.Indent },
                },
                {
                    beforeText: /<\w[^>]*$/,
                    action: { indentAction: monaco.languages.IndentAction.Indent },
                },
            ],
            // Add indentation rules
            indentationRules: {
                increaseIndentPattern: /<(?!\?|!|\/)[^>]*>$/,
                decreaseIndentPattern: /^<\/[^>]*>/,
            },
        });

        // Register a formatter for XML
        monaco.languages.registerDocumentFormattingEditProvider("xml", {
            provideDocumentFormattingEdits: (model) => {
                const text = model.getValue();
                const formatted = formatXml(text);
                return [
                    {
                        range: model.getFullModelRange(),
                        text: formatted,
                    },
                ];
            },
        });
    }
}

// Define a custom language for VSCode snippets
function registerSnippetLanguage(monaco: typeof monacoInstance) {
    monaco.languages.register({ id: "vscode-snippet" });

    monaco.languages.setMonarchTokensProvider("vscode-snippet", {
        defaultToken: "",
        tokenPostfix: ".json",

        tokenizer: {
            root: [
                // Placeholders like ${1:label}, ${1}, ${1|option1,option2|}
                [/\$\{[\d]+(:[^}]+)?\}/, "variable.parameter"],
                [/\$\{[\d]+\|[^}]+\|\}/, "variable.parameter"],
                [/\$[\d]+/, "variable.parameter"],
                // Strings
                [/"([^"\\]|\\.)*"/, "string"],
                // Numbers
                [/\b\d+\b/, "number"],
                // Keywords (true, false, null)
                [/\b(?:true|false|null)\b/, "keyword"],
                // Brackets and punctuation
                [/[{}]/, "delimiter.bracket"],
                [/[\[\]]/, "delimiter.array"],
                [/,/, "delimiter.comma"],
                // Comments
                [/\/\/.*$/, "comment"],
                [/\/\*/, "comment", "@comment"],
                // Whitespace
                [/\s+/, "white"],
            ],
            comment: [
                [/[^/*]+/, "comment"],
                [/\*\//, "comment", "@pop"],
                [/./, "comment"],
            ],
        },
    });
}

function configureSnippetLanguage(monaco: typeof monacoInstance) {
    monaco.languages.setLanguageConfiguration("vscode-snippet", {
        comments: {
            lineComment: "//",
            blockComment: ["/*", "*/"],
        },
        brackets: [
            ["{", "}"],
            ["[", "]"],
            ["(", ")"],
        ],
        autoClosingPairs: [
            { open: "{", close: "}" },
            { open: "[", close: "]" },
            { open: "(", close: ")" },
            { open: '"', close: '"' },
        ],
        surroundingPairs: [
            { open: "{", close: "}" },
            { open: "[", close: "]" },
            { open: "(", close: ")" },
            { open: '"', close: '"' },
        ],
    });
}

const props = defineProps<{
    modelValue: string;
    language?: string;
    readOnly?: boolean;
    height?: string;
    contextMenuItems?: ContextMenuItem[];
    disableValidation?: boolean;
}>();

const emit = defineEmits<{
    "update:modelValue": [value: string];
    contextMenuAction: [id: string];
}>();

const editorContainer = ref<HTMLElement>();
let editor: monaco.editor.IStandaloneCodeEditor | null = null;

onMounted(async () => {
    if (!editorContainer.value) return;

    try {
        monacoInstance.value = await loader.init();
        const monaco = monacoInstance.value;

        configureTypeScript(monaco, props.disableValidation); // Pass the disableValidation prop
        addTypeScriptTypes(monaco);
        registerXmlLanguage(monaco);
        registerSnippetLanguage(monaco);
        configureSnippetLanguage(monaco);

        // Enhanced theme with better syntax highlighting
        monaco.editor.defineTheme("snippetTheme", {
            base: "vs-dark",
            inherit: true,
            rules: [
                // XML specific rules
                { token: "tag.xml", foreground: "569CD6", fontStyle: "bold" },
                { token: "attribute.name.xml", foreground: "9CDCFE" },
                { token: "attribute.value.xml", foreground: "CE9178" },
                { token: "delimiter.xml", foreground: "808080" },
                { token: "text.xml", foreground: "D4D4D4" },
                { token: "entity.xml", foreground: "D7BA7D" },
                // JSON specific rules
                { token: "string.key.json", foreground: "9CDCFE" }, // Property names in blue
                { token: "string.value.json", foreground: "CE9178" }, // String values in orange
                { token: "number", foreground: "B5CEA8" },
                { token: "keyword", foreground: "C586C0" },
                { token: "delimiter.bracket", foreground: "FFFFFF" },
                { token: "delimiter.array", foreground: "FFFFFF" },
                { token: "delimiter.comma", foreground: "FFFFFF" },
                { token: "comment", foreground: "6A9955", fontStyle: "italic" },
                { token: "variable.parameter", foreground: "569CD6", fontStyle: "bold" },
                // Updated JSON specific rules
                { token: "property.json", foreground: "9CDCFE" }, // Property names
                { token: "string.json", foreground: "CE9178" }, // String values
                { token: "variable.snippet", foreground: "569CD6" }, // Snippet variables like ${1}
                { token: "variable.name.snippet", foreground: "CE9178" }, // Variable labels
                { token: "delimiter.snippet", foreground: "D4D4D4" }, // Variable delimiters
                { token: "number", foreground: "B5CEA8" },
                { token: "keyword", foreground: "C586C0" },
                { token: "delimiter.bracket", foreground: "FFFFFF" },
                { token: "delimiter.array", foreground: "FFFFFF" },
                { token: "delimiter.comma", foreground: "FFFFFF" },
                { token: "comment", foreground: "6A9955", fontStyle: "italic" },
                { token: "identifier.ts", foreground: "9CDCFE" }, // Variables
                { token: "function.ts", foreground: "DCDCAA" }, // Function names
                { token: "keyword.ts", foreground: "C586C0" }, // Keywords
                { token: "variable.ts", foreground: "9CDCFE" }, // Variables
                { token: "function.declaration.ts", foreground: "DCDCAA" }, // Function declarations
                { token: "keyword.control.ts", foreground: "C586C0" }, // Control keywords
                { token: "keyword.operator.ts", foreground: "C586C0" }, // Operators
                { token: "keyword.other.ts", foreground: "C586C0" }, // Other keywords
                { token: "variable.parameter.ts", foreground: "4EC9B0" }, // Parameters
                { token: "function.call.ts", foreground: "DCDCAA" }, // Function calls
                { token: "variable.readwrite.ts", foreground: "9CDCFE" }, // Read/write variables
                { token: "variable.readonly.ts", foreground: "4EC9B0" }, // Read-only variables
                // Assign colors to the new token types
                { token: "function", foreground: "DCDCAA" }, // Functions in yellow
                { token: "variable", foreground: "9CDCFE" }, // Variables in blue
                { token: "type", foreground: "4EC9B0" }, // Types in green
                { token: "keyword", foreground: "C586C0" }, // Keywords in purple
                { token: "identifier", foreground: "9CDCFE" }, // Identifiers in blue
            ],
            colors: {
                "editor.background": "#000000",
                "editor.foreground": "#FFFFFF",
                "editor.lineHighlightBackground": "#000000",
                "editorLineNumber.foreground": "#999999",
                "editor.selectionBackground": "#ADD6FF",
                "editor.inactiveSelectionBackground": "#E5EBF1",
                "editorIndentGuide.background": "#D3D3D3",
                "editorIndentGuide.activeBackground": "#A9A9A9",
            },
        });

        // Configure JSON language features with enhanced schema
        if (props.language === "jsonc") {
            monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
                validate: true,
                allowComments: true,
                schemas: [
                    {
                        uri: "vscode://schemas/snippets",
                        fileMatch: ["*"],
                        schema: {
                            type: "object",
                            additionalProperties: {
                                type: "object",
                                required: ["prefix", "body"],
                                properties: {
                                    prefix: {
                                        type: ["string", "array"],
                                        description: "The prefix to use when selecting the snippet",
                                        items: {
                                            type: "string",
                                        },
                                    },
                                    body: {
                                        type: ["string", "array"],
                                        description: "The snippet content",
                                        items: {
                                            type: "string",
                                        },
                                    },
                                    description: {
                                        type: "string",
                                        description: "The description of the snippet",
                                    },
                                    scope: {
                                        type: "string",
                                        description: "A comma-separated list of language names where the snippet is applicable",
                                    },
                                },
                            },
                        },
                    },
                ],
                enableSchemaRequest: true,
                schemaRequest: "warning",
            });
        }

        // Enhanced tokenizer for VSCode snippet variables
        if (props.language === "jsonc") {
            monaco.languages.setMonarchTokensProvider("jsonc", {
                defaultToken: "",
                tokenPostfix: ".json",

                tokenizer: {
                    root: [
                        // Special snippet variable highlighting
                        [/(\$)(\d+)/, ["variable.other", "variable.other"]],
                        [
                            /(\$\{)([^:}]+)(:)([^}]+)(\})/,
                            ["variable.parameter", "variable.parameter", "variable.parameter", "variable.parameter", "variable.parameter"],
                        ],
                        [/(\$\{)([^}]+)(\})/, ["variable.parameter", "variable.parameter", "variable.parameter"]],

                        // Updated JSON syntax for property names vs values
                        [/"([^"\\]|\\.)*"(?=\s*:)/, "string.key.json"], // Property names
                        [/"([^"\\]|\\.)*"/, "string.value.json"], // String values
                        [/[{}]/, "delimiter.bracket"],
                        [/[[\]]/, "delimiter.array"],
                        [/[,]/, "delimiter.comma"],
                        [/[0-9]+/, "number"],
                        [/true|false/, "keyword"],
                        [/null/, "keyword"],

                        // Comments
                        [/\/\/.*$/, "comment.line"],
                        [/\/\*/, "comment", "@comment"],
                    ],
                    comment: [
                        [/[^/*]+/, "comment.block"],
                        [/\*\//, "comment.block", "@pop"],
                        [/[/*]/, "comment.block"],
                    ],
                },
            });
        }

        // Update the tokenizer for VSCode snippets and JSONC
        const jsonTokenizer = {
            root: [
                // Property names (before colon)
                [/"([^"\\]|\\.)*"(?=\s*:)/, "property.json"],

                // Snippet variable patterns
                [/(\$)(\d+)/, "variable.snippet"],
                [
                    /(\$\{)(\d+)(:)([^|}]+)(\})/,
                    ["delimiter.snippet", "variable.snippet", "delimiter.snippet", "variable.name.snippet", "delimiter.snippet"],
                ],
                [
                    /(\$\{)(\d+)(\|)([^}]+)(\|)(\})/,
                    ["delimiter.snippet", "variable.snippet", "delimiter.snippet", "variable.name.snippet", "delimiter.snippet", "delimiter.snippet"],
                ],

                // Standard JSON syntax
                [/"([^"\\]|\\.)*"/, "string.json"],
                [/[{}]/, "delimiter.bracket"],
                [/[[\]]/, "delimiter.array"],
                [/,/, "delimiter.comma"],
                [/-?\d+\.?\d*([eE][+-]?\d+)?/, "number"],
                [/true|false/, "keyword"],
                [/null/, "keyword"],

                // Comments
                [/\/\/.*$/, "comment"],
                [/\/\*/, "comment", "@comment"],
            ],
            comment: [
                [/[^/*]+/, "comment"],
                [/\*\//, "comment", "@pop"],
                [/[/*]/, "comment"],
            ],
        };

        // Apply the tokenizer to both JSONC and vscode-snippet languages
        monaco.languages.setMonarchTokensProvider("jsonc", {
            defaultToken: "",
            tokenPostfix: ".json",
            tokenizer: jsonTokenizer,
        });

        monaco.languages.setMonarchTokensProvider("vscode-snippet", {
            defaultToken: "",
            tokenPostfix: ".json",
            tokenizer: jsonTokenizer,
        });

        editor = monaco.editor.create(editorContainer.value, {
            value: props.modelValue.trim(), // Trim the initial value
            language: props.language || "plaintext",
            theme: "snippetTheme",
            automaticLayout: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            readOnly: props.readOnly,
            fontSize: 14,
            tabSize: 2,
            wordWrap: "on", // Change from 'off' to 'on'
            lineNumbers: "on",
            renderWhitespace: "none",
            bracketPairColorization: {
                enabled: true,
            },
            semanticHighlighting: {
                enabled: true,
            },
            autoClosingBrackets: "always",
            autoClosingQuotes: "always",
            autoIndent: "advanced",
            autoClosingPairs: [
                { open: "{", close: "}" },
                { open: "[", close: "]" },
                { open: "(", close: ")" },
                { open: '"', close: '"' },
                { open: "'", close: "'" },
                { open: "<", close: ">" },
            ],
            scrollbar: {
                vertical: "visible",
                horizontal: "visible",
            },
            formatOnPaste: true,
            formatOnType: props.language !== "xml", // Disable for XML to prevent formatting issues
            suggest: {
                showWords: false,
                showSnippets: true,
                showUsers: false,
                showMethods: false,
                showFunctions: false,
                showConstructors: false,
                showFields: false,
                showVariables: false,
                showClasses: false,
                showStructs: false,
                showInterfaces: false,
                showModules: false,
                showProperties: false,
                showEvents: false,
                showOperators: false,
                showUnits: false,
                showValues: false,
                showConstants: false,
                showEnums: false,
                showEnumMembers: false,
                showKeywords: false,
                showTypeParameters: false,
                showColors: false,
                showFiles: false,
                showReferences: false,
                showFolders: false,
                showInlineDetails: true,
                showStatusBar: true,
            },
            wrappingIndent: "indent",
            renderWhitespace: "selection",
            contextmenu: true,
            renderValidationDecorations: props.disableValidation ? "off" : "on",
            semanticValidation: !props.disableValidation,
            syntaxValidation: !props.disableValidation,
            codeActionsOnSaveTimeout: 0,
            // Enhanced validation disabling when in creation mode
            ...(props.disableValidation
                ? {
                      quickSuggestions: false,
                      parameterHints: { enabled: false },
                      suggestOnTriggerCharacters: false,
                      acceptSuggestionOnEnter: "off",
                      tabCompletion: "off",
                      wordBasedSuggestions: false,
                      semanticHighlighting: { enabled: false },
                      lightbulb: { enabled: false },
                      signatureHelp: { enabled: false },
                      hover: { enabled: false },
                      colorDecorators: false,
                      gotoLocation: { enabled: false },
                      codeLens: false,
                      snippetSuggestions: "none",
                      formatOnType: false,
                      linkedEditing: false,
                      occurrencesHighlight: false,
                      inlayHints: { enabled: false },
                  }
                : {}),
        });

        // Add context menu items after editor creation
        if (props.contextMenuItems) {
            // Add submenu separator first
            editor.addAction({
                id: "snippet-menu-separator",
                label: "────── Snippet Tools ──────",
                contextMenuGroupId: "9_cutcopypaste",
                contextMenuOrder: 0,
                run: () => {}, // No-op
            });

            // Add custom items in their own group
            props.contextMenuItems.forEach((item, index) => {
                if (!item.id) return;

                // Create the action
                const action = {
                    id: item.id,
                    label: item.label,
                    contextMenuGroupId: "snippetTools",
                    contextMenuOrder: index + 1,

                    // Important: pass both editor and the item id
                    run: (editor: any) => {
                        emit("contextMenuAction", item.id, editor);
                    },
                };

                // Add keybinding if specified
                if (item.keybinding) {
                    const binding = parseKeybinding(item.keybinding, monaco);

                    if (binding !== 0) {
                        action.keybindings = [binding];
                    }
                }

                // Register the action with Monaco
                editor.addAction(action);
            });
        }

        // Add specific format options for XML
        if (props.language === "xml") {
            const model = editor.getModel();
            if (model) {
                model.updateOptions({
                    insertSpaces: true,
                    tabSize: 2,
                    trimAutoWhitespace: false,
                });
                // Format the initial XML content
                setTimeout(() => {
                    editor?.getAction("editor.action.formatDocument")?.run();
                }, 100);
            }
        }

        editor.onDidChangeModelContent(() => {
            const value = editor?.getValue() || "";
            emit("update:modelValue", value);
        });

        // Format the initial content
        if (props.language === "jsonc" || (props.language === "xml" && editor)) {
            setTimeout(() => {
                editor?.getAction("editor.action.formatDocument")?.run();
            }, 100);
        }

        // Add keyboard shortcuts
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
            editor?.getAction("editor.action.formatDocument")?.run();
        });

        // Add format command to editor
        editor.addCommand(monacoInstance.value.KeyMod.CtrlCmd | monacoInstance.value.KeyCode.KeyF, () => {
            editor?.getAction("editor.action.formatDocument")?.run();
        });

        // Also update TypeScript configuration if needed
        if (props.disableValidation && props.language === "typescript") {
            monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
                noSemanticValidation: true,
                noSyntaxValidation: true,
                noSuggestionDiagnostics: true,
            });
        }
    } catch (error) {
        console.error("Failed to initialize Monaco Editor:", error);
    }
});

watch(
    () => props.modelValue,
    (newValue) => {
        if (editor && newValue !== editor.getValue()) {
            if (props.language === "xml") {
                const formatted = formatXml(newValue.trim());
                editor.setValue(formatted);
            } else {
                editor.setValue(newValue.trim());
            }
            if (props.language === "jsonc" || props.language === "json" || props.language === "xml") {
                setTimeout(() => {
                    editor?.getAction("editor.action.formatDocument")?.run();
                }, 100);
            }
        }
    }
);

watch(
    () => props.language,
    (newValue) => {
        if (editor) {
            const model = editor.getModel();
            if (model) {
                monaco.editor.setModelLanguage(model, newValue);
            }
        }
    }
);

// Add this watch after the other watch statements
watch(
    () => props.disableValidation,
    (newValue) => {
        if (monacoInstance.value) {
            updateTypeScriptValidation(monacoInstance.value, newValue);
        }
    }
);

// Add this helper function after existing functions
function parseKeybinding(keybindingStr: string, monaco: typeof monacoInstance): number {
    const keys = keybindingStr.split("+");
    let binding = 0;

    keys.forEach((key) => {
        const k = key.trim();

        switch (k.toLowerCase()) {
            case "ctrl":
            case "cmd":
                binding |= monaco.KeyMod.CtrlCmd;
                break;
            case "shift":
                binding |= monaco.KeyMod.Shift;
                break;
            case "alt":
                binding |= monaco.KeyMod.Alt;
                break;
            default:
                let keyCode;

                if (/^[A-Z]$/i.test(k)) {
                    keyCode = monaco.KeyCode[`Key${k.toUpperCase()}`];
                } else if (/^\d$/.test(k)) {
                    keyCode = monaco.KeyCode[`Digit${k}`];
                } else {
                    keyCode = monaco.KeyCode[k.toUpperCase()];
                }

                if (typeof keyCode === "number") {
                    binding |= keyCode;
                }
                break;
        }
    });

    return binding;
}

onBeforeUnmount(() => {
    if (editor) {
        editor.dispose();
    }
});
</script>

<style scoped>
/* Remove all z-index related styles */
</style>

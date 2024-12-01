<template>
  <div class="monaco-container">
    <div 
      ref="editorContainer" 
      class="w-full overflow-hidden border rounded"
      :style="{ height: height || 'calc(100vh - 300px)' }"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import loader from '@monaco-editor/loader'
import type * as monaco from 'monaco-editor'

const monacoInstance = ref<typeof monaco>()
loader.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs' } })

function configureTypeScript(monaco: typeof monacoInstance) {
  monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
    target: monaco.languages.typescript.ScriptTarget.Latest,
    allowNonTsExtensions: true,
    moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
    module: monaco.languages.typescript.ModuleKind.CommonJS,
    noEmit: true,
    esModuleInterop: true,
    jsx: monaco.languages.typescript.JsxEmit.React,
    reactNamespace: 'React',
    allowJs: true,
    typeRoots: ['node_modules/@types'],
    strict: true,
    lib: ['es2020', 'dom']
  })
}

// Add basic TypeScript/JavaScript types
function addTypeScriptTypes(monaco: typeof monacoInstance) {
  monaco.languages.typescript.typescriptDefaults.addExtraLib(`
  declare var console: {
    log(message?: any, ...optionalParams: any[]): void;
    error(message?: any, ...optionalParams: any[]): void;
    warn(message?: any, ...optionalParams: any[]): void;
    info(message?: any, ...optionalParams: any[]): void;
  };
  `, 'global.d.ts')
}

// Register XML language if not already registered
function registerXmlLanguage(monaco: typeof monacoInstance) {
  if (!monaco.languages.getLanguages().some(lang => lang.id === 'xml')) {
    monaco.languages.register({ id: 'xml' })
    monaco.languages.setMonarchTokensProvider('xml', {
      defaultToken: '',
      tokenPostfix: '.xml',

      tokenizer: {
        root: [
          [/[<&]/, { token: 'delimiter.xml', next: '@tag' }],
          [/[^<&]+/, 'text.xml']
        ],

        tag: [
          [/[<](\/?)([\w\-:.]+)/, ['delimiter.xml', { token: 'tag.xml', next: '@tagAttributes' }]],
          [/>/, { token: 'delimiter.xml', next: '@pop' }],
          [/[&][\w\-:.]+;/, 'entity.xml']
        ],

        tagAttributes: [
          [/[\w\-:.]+/, 'attribute.name.xml'],
          [/=/, 'delimiter.xml'],
          [/"([^"]*)"/, 'attribute.value.xml'],
          [/'([^']*)'/, 'attribute.value.xml'],
          [/>/, { token: 'delimiter.xml', next: '@pop' }]
        ]
      }
    })
  }
}

// Define a custom language for VSCode snippets
function registerSnippetLanguage(monaco: typeof monacoInstance) {
  monaco.languages.register({ id: 'vscode-snippet' })

  monaco.languages.setMonarchTokensProvider('vscode-snippet', {
  defaultToken: '',
  tokenPostfix: '.json',

  tokenizer: {
    root: [
      // Placeholders like ${1:label}, ${1}, ${1|option1,option2|}
      [/\$\{[\d]+(:[^}]+)?\}/, 'variable.parameter'],
      [/\$\{[\d]+\|[^}]+\|\}/, 'variable.parameter'],
      [/\$[\d]+/, 'variable.parameter'],
      // Strings
      [/"([^"\\]|\\.)*"/, 'string'],
      // Numbers
      [/\b\d+\b/, 'number'],
      // Keywords (true, false, null)
      [/\b(?:true|false|null)\b/, 'keyword'],
      // Brackets and punctuation
      [/[{}]/, 'delimiter.bracket'],
      [/[\[\]]/, 'delimiter.array'],
      [/,/, 'delimiter.comma'],
      // Comments
      [/\/\/.*$/, 'comment'],
      [/\/\*/, 'comment', '@comment'],
      // Whitespace
      [/\s+/, 'white'],
    ],
    comment: [
      [/[^/*]+/, 'comment'],
      [/\*\//, 'comment', '@pop'],
      [/./, 'comment'],
    ],
  },
})
}

function configureSnippetLanguage(monaco: typeof monacoInstance) {
  monaco.languages.setLanguageConfiguration('vscode-snippet', {
  comments: {
    lineComment: '//',
    blockComment: ['/*', '*/'],
  },
  brackets: [
    ['{', '}'],
    ['[', ']'],
    ['(', ')'],
  ],
  autoClosingPairs: [
    { open: '{', close: '}' },
    { open: '[', close: ']' },
    { open: '(', close: ')' },
    { open: '"', close: '"' },
  ],
  surroundingPairs: [
    { open: '{', close: '}' },
    { open: '[', close: ']' },
    { open: '(', close: ')' },
    { open: '"', close: '"' },
  ],
})
}

const props = defineProps<{
  modelValue: string
  language: string
  readOnly?: boolean
  height?: string  // New prop for height
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const editorContainer = ref<HTMLElement>()
let editor: monaco.editor.IStandaloneCodeEditor | null = null

onMounted(async () => {
  if (!editorContainer.value) return

  try {
    monacoInstance.value = await loader.init()
    const monaco = monacoInstance.value

    configureTypeScript(monaco)
    addTypeScriptTypes(monaco)
    registerXmlLanguage(monaco)
    registerSnippetLanguage(monaco)
    configureSnippetLanguage(monaco)

    // Enhanced theme with better syntax highlighting
    monaco.editor.defineTheme('snippetTheme', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      // XML specific rules
      { token: 'tag.xml', foreground: '569CD6', fontStyle: 'bold' },
      { token: 'attribute.name.xml', foreground: '9CDCFE' },
      { token: 'attribute.value.xml', foreground: 'CE9178' },
      { token: 'delimiter.xml', foreground: '808080' },
      { token: 'text.xml', foreground: 'D4D4D4' },
      { token: 'entity.xml', foreground: 'D7BA7D' },
      // JSON specific rules
      { token: 'string', foreground: 'CE9178' },
      { token: 'number', foreground: 'B5CEA8' },
      { token: 'keyword', foreground: 'C586C0' },
      { token: 'delimiter.bracket', foreground: 'FFFFFF' },
      { token: 'delimiter.array', foreground: 'FFFFFF' },
      { token: 'delimiter.comma', foreground: 'FFFFFF' },
      { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
      { token: 'variable.parameter', foreground: '569CD6', fontStyle: 'bold' }
    ],
    colors: {
      'editor.background': '#000000',
      'editor.foreground': '#FFFFFF',
      'editor.lineHighlightBackground': '#000000',
      'editorLineNumber.foreground': '#999999',
      'editor.selectionBackground': '#ADD6FF',
      'editor.inactiveSelectionBackground': '#E5EBF1',
      'editorIndentGuide.background': '#D3D3D3',
      'editorIndentGuide.activeBackground': '#A9A9A9'
    }
  })

    // Configure JSON language features with enhanced schema
    if (props.language === 'jsonc') {
      monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
      validate: true,
      allowComments: true,
      schemas: [{
        uri: 'vscode://schemas/snippets',
        fileMatch: ['*'],
        schema: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            required: ['prefix', 'body'],
            properties: {
              prefix: {
                type: ['string', 'array'],
                description: 'The prefix to use when selecting the snippet',
                items: {
                  type: 'string'
                }
              },
              body: {
                type: ['string', 'array'],
                description: 'The snippet content',
                items: {
                  type: 'string'
                }
              },
              description: {
                type: 'string',
                description: 'The description of the snippet'
              },
              scope: {
                type: 'string',
                description: 'A comma-separated list of language names where the snippet is applicable'
              }
            }
          }
        }
      }],
      enableSchemaRequest: true,
      schemaRequest: 'warning'
    })
    }

    // Enhanced tokenizer for VSCode snippet variables
    if (props.language === 'jsonc') {
      monaco.languages.setMonarchTokensProvider('jsonc', {
      defaultToken: '',
      tokenPostfix: '.json',

      tokenizer: {
        root: [
          // Special snippet variable highlighting
          [/(\$)(\d+)/, ['variable.other', 'variable.other']],
          [/(\$\{)([^:}]+)(:)([^}]+)(\})/, ['variable.parameter', 'variable.parameter', 'variable.parameter', 'variable.parameter', 'variable.parameter']],
          [/(\$\{)([^}]+)(\})/, ['variable.parameter', 'variable.parameter', 'variable.parameter']],
          
          // Standard JSON syntax
          [/"([^"\\]|\\.)*"/, 'string'],
          [/[{}]/, 'delimiter.bracket'],
          [/[[\]]/, 'delimiter.array'],
          [/[,]/, 'delimiter.comma'],
          [/[0-9]+/, 'number'],
          [/true|false/, 'keyword'],
          [/null/, 'keyword'],
          
          // Comments
          [/\/\/.*$/, 'comment.line'],
          [/\/\*/, 'comment.block', '@comment']
        ],
        
        comment: [
          [/[^/*]+/, 'comment.block'],
          [/\*\//, 'comment.block', '@pop'],
          [/[/*]/, 'comment.block']
        ]
      }
    })
    }

    editor = monaco.editor.create(editorContainer.value, {
    value: props.modelValue,
    language: props.language === 'typescript' ? 'typescript' : 
             props.language === 'vscode-snippet' ? 'vscode-snippet' : 
             props.language,
    theme: 'snippetTheme',
    automaticLayout: true,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    readOnly: props.readOnly,
    fontSize: 14,
    tabSize: 2,
    wordWrap: 'off',
    lineNumbers: 'on',
    renderWhitespace: 'none',
    bracketPairColorization: {
      enabled: true,
    },
    semanticHighlighting: {
      enabled: true
    },
    autoClosingBrackets: 'always',
    autoClosingQuotes: 'always',
    autoIndent: 'advanced',
    autoClosingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '"', close: '"' },
      { open: "'", close: "'" },
      { open: '<', close: '>' }
    ],
    scrollbar: {
      vertical: 'visible',
      horizontal: 'visible'
    },
    formatOnPaste: true,
    formatOnType: props.language !== 'xml', // Disable for XML to prevent formatting issues
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
    }
  })

    editor.onDidChangeModelContent(() => {
      const value = editor?.getValue() || ''
      emit('update:modelValue', value)
    })

    // Format the initial content
    if (props.language === 'jsonc' && editor) {
      editor.getAction('editor.action.formatDocument')?.run()
    }

    // Add keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      editor?.getAction('editor.action.formatDocument')?.run()
    })
  } catch (error) {
    console.error('Failed to initialize Monaco Editor:', error)
  }
})

watch(() => props.modelValue, (newValue) => {
  if (editor && newValue !== editor.getValue()) {
    editor.setValue(newValue)
    if (props.language === 'jsonc' || props.language === 'json') {
      editor.getAction('editor.action.formatDocument')?.run()
    }
  }
})

watch(() => props.language, (newValue) => {
  if (editor) {
    const model = editor.getModel()
    if (model) {
      monaco.editor.setModelLanguage(model, newValue)
    }
  }
})

onBeforeUnmount(() => {
  if (editor) {
    editor.dispose()
  }
})
</script>

<style scoped>
/* Remove all z-index related styles */
</style>
<template>
  <div ref="editorContainer" class="w-full h-[calc(100vh-300px)] border rounded overflow-hidden"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import * as monaco from 'monaco-editor'

const props = defineProps<{
  modelValue: string
  language: string
  readOnly?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const editorContainer = ref<HTMLElement>()
let editor: monaco.editor.IStandaloneCodeEditor | null = null

onMounted(() => {
  if (!editorContainer.value) return

  // Enhanced theme with better syntax highlighting
  monaco.editor.defineTheme('snippetTheme', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'string.key.json', foreground: '9CDCFE', fontStyle: 'bold' },
      { token: 'string.value.json', foreground: 'CE9178' },
      { token: 'keyword.json', foreground: 'C586C0' },
      { token: 'number.json', foreground: 'B5CEA8' },
      { token: 'string.escape.json', foreground: 'D19A66' },
      { token: 'variable.parameter', foreground: 'DCDCAA', fontStyle: 'italic' },
      { token: 'variable.other', foreground: 'DCDCAA' },
      { token: 'delimiter.bracket.json', foreground: 'FFFFFF', fontStyle: 'bold' },
      { token: 'delimiter.array.json', foreground: 'FFFFFF' },
      { token: 'delimiter.comma.json', foreground: 'FFFFFF' },
      { token: 'comment.line.json', foreground: '6A9955', fontStyle: 'italic' },
      { token: 'comment.block.json', foreground: '6A9955', fontStyle: 'italic' }
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

  // Define a custom language for VSCode snippets
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

  editor = monaco.editor.create(editorContainer.value, {
    value: props.modelValue,
    language: props.language === 'vscode-snippet' ? 'vscode-snippet' : props.language,
    theme: 'snippetTheme',
    automaticLayout: true,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    readOnly: props.readOnly,
    fontSize: 14,
    tabSize: 2,
    wordWrap: 'on',
    lineNumbers: 'on',
    renderWhitespace: 'selection',
    bracketPairColorization: {
      enabled: true,
    },
    scrollbar: {
      vertical: 'visible',
      horizontal: 'visible'
    },
    formatOnPaste: true,
    formatOnType: true,
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
})

watch(() => props.modelValue, (newValue) => {
  if (editor && newValue !== editor.getValue()) {
    editor.setValue(newValue)
    if (props.language === 'jsonc') {
      editor.getAction('editor.action.formatDocument')?.run()
    }
  }
})

onBeforeUnmount(() => {
  if (editor) {
    editor.dispose()
  }
})
</script>
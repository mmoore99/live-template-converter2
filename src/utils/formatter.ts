import { type Ref } from 'vue'

export interface SnippetOutput {
  [key: string]: {
    prefix: string
    body: string[]
    description?: string
    scope?: string
  }
}

function preserveIndentation(lines: string[]): string[] {
  if (lines.length === 0) return lines
  
  // Find common indentation
  const indentMatch = lines[0].match(/^\s+/)
  const baseIndent = indentMatch ? indentMatch[0].length : 0
  
  return lines.map(line => {
    // Preserve empty lines
    if (!line.trim()) return ''
    
    // Keep relative indentation from the base
    const currentIndent = line.match(/^\s+/)?.[0].length || 0
    const relativeIndent = Math.max(0, currentIndent - baseIndent)
    return ' '.repeat(relativeIndent) + line.trim()
  })
}

export function formatSnippetOutput(
  snippets: Ref<SnippetOutput>,
  includeBrackets: boolean = false
): string {
  const formattedSnippets = { ...snippets.value }
  
  // Process each snippet's body to preserve formatting
  for (const key in formattedSnippets) {
    if (Array.isArray(formattedSnippets[key].body)) {
      formattedSnippets[key].body = preserveIndentation(formattedSnippets[key].body)
    }
  }
  
  const output = JSON.stringify(formattedSnippets, null, 2)
  if (!output || output === '{}') return ''
  
  if (includeBrackets) {
    return output
  }
  
  const lines = output.split('\n')
  return lines.slice(1, -1).join('\n').trim()
}

export function getFormattedContent(
  snippets: SnippetOutput,
  includeBrackets: boolean = false
): string {
  const formattedSnippets = { ...snippets }
  
  // Process each snippet's body to preserve formatting
  for (const key in formattedSnippets) {
    if (Array.isArray(formattedSnippets[key].body)) {
      formattedSnippets[key].body = preserveIndentation(formattedSnippets[key].body)
    }
  }
  
  const output = JSON.stringify(formattedSnippets, null, 2)
  if (!output || output === '{}') return ''
  
  if (includeBrackets) {
    return output
  }
  
  const lines = output.split('\n')
  return lines.slice(1, -1).join('\n').trim()
}
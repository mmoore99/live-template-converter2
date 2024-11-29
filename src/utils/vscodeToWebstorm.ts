import { VSCodeSnippet } from '@/types';

function getVariableName(placeholder: string): string {
  const match = placeholder.match(/\$\{(\d+)(?::([^}]+))?\}/)
  if (!match) return ''
  
  const [_, number, label] = match
  return label || number
}

function escapeXmlChars(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function extractVariables(body: string[]): Array<{ name: string, expression: string, defaultValue: string }> {
  const variables = new Map<string, { name: string, expression: string, defaultValue: string }>();
  
  body.forEach(line => {
    const placeholderRegex = /\$\{(\d+)(?::([^}]+))?\}/g;
    let match;
    
    while ((match = placeholderRegex.exec(line)) !== null) {
      const [_, number, label] = match;
      const name = label || number;
      
      if (!variables.has(name)) {
        variables.set(name, {
          name,
          expression: '',
          defaultValue: label ? `"${label}"` : '""'
        });
      }
    }
  });
  
  return Array.from(variables.values());
}

function convertBody(body: string[]): string {
  return body
    .map(line => {
      let result = line
        .replace(/\$\{(\d+)(?::([^}]+))?\}/g, (match) => {
          const varName = getVariableName(match)
          return varName ? `$${varName}$` : match
        })
        .replace(/\$(\d+)/g, (_, num) => {
          return `$${num}$`;
        })
        .replace(/\$TM_SELECTED_TEXT/g, '$SELECTION$')
        .replace(/\\\$/g, '$')
        .replace(/\$0/g, '$END$')
      return result
    })
    .join('&#10;');
}

function getScopeContext(scope: string): string[] {
  if (!scope) return [];
  
  return scope.split(',').map(s => s.trim());
}

interface TemplateSetOptions {
  includeTemplateSet: boolean;
  group: string;
}

export function convertToWebStormTemplate(
  snippets: Record<string, VSCodeSnippet>,
  options: TemplateSetOptions = { includeTemplateSet: true, group: 'Custom' }
): string {
  const templates = Object.entries(snippets).map(([name, snippet]) => {
    const value = Array.isArray(snippet.body) 
      ? convertBody(snippet.body)
      : convertBody([snippet.body]);
    
    const variables = extractVariables(Array.isArray(snippet.body) ? snippet.body : [snippet.body]);
    
    const variableElements = variables.map(v => 
      `      <variable name="${escapeXmlChars(v.name)}" 
        expression="${escapeXmlChars(v.expression)}" 
        defaultValue="${escapeXmlChars(v.defaultValue)}" 
        alwaysStopAt="true" />`
    ).join('\n');
      
    const scopes = getScopeContext(snippet.scope || '');
    const contextOptions = scopes.map(scope => 
      `      <option name="${escapeXmlChars(scope)}" value="true" />`
    ).join('\n');

    return `  <template name="${escapeXmlChars(name)}" 
    value="${escapeXmlChars(value)}"
    description="${escapeXmlChars(snippet.description || '')}"
    toReformat="true">
    <variables>
${variableElements}
    </variables>
    <context>
${contextOptions}
    </context>
  </template>`;
  });
  
  if (!options.includeTemplateSet) {
    return templates.join('\n\n');
  }
  
  return `<templateSet group="${escapeXmlChars(options.group)}">
${templates.join('\n\n')}
</templateSet>`;
}
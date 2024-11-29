import { Variable } from '@/types';

export function extractVariablesFromBody(body: string[]): Variable[] {
  const variables: Variable[] = [];
  const variableMap = new Map<string, Variable>();

  body.forEach(line => {
    // Handle both labeled ${1:label} and unlabeled ${1} placeholders
    const placeholderRegex = /\$\{(\d+)(?::([^}]+))?\}/g;
    let match;

    while ((match = placeholderRegex.exec(line)) !== null) {
      const [_, number, label = ''] = match;
      const index = parseInt(number);
      const varName = label || `var${index}`;
      
      if (!variableMap.has(varName)) {
        variableMap.set(varName, {
          name: varName,
          expression: '',
          defaultValue: '""',
          enumValues: []
        });
      }
    }
  });

  return Array.from(variableMap.values());
}
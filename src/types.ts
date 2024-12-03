export interface Variable {
  name: string;
  expression: string;
  defaultValue: string;
  enumValues: string[];
}

export interface WebStormTemplate {
  name: string;
  value: string;
  description: string;
  variables: Variable[];
  contextOptions: string[];
}

export interface VSCodeSnippet {
  prefix: string;
  body: string[];
  description: string;
  scope: string;
}

export interface SnippetInput {
  name: string;
  prefix?: string;
  description?: string;
  scope?: string;
  sourceCode: string;
}

export interface VSCodeSnippet {
  {
    prefix: string;
    body: string[];
    description?: string;
    scope?: string;
  };
}
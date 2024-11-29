import type { SnippetInput, VSCodeSnippet } from '../types';

const escapeSnippetCharacters = (line: string): string => {
    let inBackticks = false;
    let escapedLine = "";

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === "`") {
            inBackticks = !inBackticks;
        }

        if (char === "$") {
            if (inBackticks && line[i + 1] === "{") {
                escapedLine += "\\$";
            } else if (!inBackticks && line[i + 1] === "{") {
                escapedLine += char;
            } else if (/\d/.test(line[i + 1])) {
                escapedLine += char;
            } else {
                escapedLine += "\\$";
            }
        } else if (char === "\\") {
            escapedLine += "\\\\";
        } else {
            escapedLine += char;
        }
    }

    return escapedLine;
};

const formatSourceCode = (code: string): string[] => {
    if (!code.trim()) return [];
    return code
        .split("\n")
        .map((line) => line.trimLeft())
        .filter((line) => line !== "")
        .map(escapeSnippetCharacters);
};

export const generateSnippet = (input: SnippetInput): VSCodeSnippet => {
    const { name, prefix, description, scope, sourceCode } = input;

    if (!sourceCode.trim()) {
        return {};
    }

    return {
        [name || 'untitled']: {
            prefix: prefix || 'snippet',
            body: formatSourceCode(sourceCode),
            description: description || '',
            scope: scope || '',
        },
    };
};

export const formatSnippetJson = (snippet: VSCodeSnippet): string => {
    const jsonString = JSON.stringify(snippet, null, 2);
    // Remove the first and last lines (opening and closing braces)
    const lines = jsonString.split('\n');
    return lines.slice(1, -1).join('\n').trim();
};
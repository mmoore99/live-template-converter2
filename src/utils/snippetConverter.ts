import type { SnippetInput, VSCodeSnippet } from "../types";

const escapeSnippetCharacters = (line: string): string => {
    let inBackticks = false;
    let escapedLine = "";

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];

        if (char === "`") {
            inBackticks = !inBackticks;
            escapedLine += char;
            continue;
        }

        if (char === "$") {
            if (inBackticks && nextChar === "{") {
                escapedLine += "\\$";
                continue;
            }
            if (!inBackticks && (nextChar === "{" || /\d/.test(nextChar))) {
                escapedLine += char;
                continue;
            }
            escapedLine += "\\$";
            continue;
        }

        if (char === "\\") {
            escapedLine += "\\\\";
            continue;
        }

        escapedLine += char;
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

export const generateSnippet = (input: SnippetInput): Record<string, VSCodeSnippet> => {
    const { name, prefix, description, scope, sourceCode } = input;

    if (!sourceCode.trim()) {
        return {};
    }

    return {
        [name || "untitled"]: {
            prefix: prefix || "snippet",
            body: formatSourceCode(sourceCode),
            description: description || "",
            scope: scope || "",
        },
    };
};

export const formatSnippetJson = (snippet: VSCodeSnippet): string => {
    const jsonString = JSON.stringify(snippet, null, 2);
    // Remove the first and last lines (opening and closing braces)
    const lines = jsonString.split("\n");
    return lines.slice(1, -1).join("\n").trim();
};

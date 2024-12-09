import type { VSCodeSnippet } from "@/types";

function preserveIndentation(lines: string[]): string[] {
    if (lines.length === 0) return lines;

    // Find common indentation
    const indentMatch = lines[0].match(/^\s+/);
    const baseIndent = indentMatch ? indentMatch[0].length : 0;

    return lines.map((line) => {
        // Preserve empty lines
        if (!line.trim()) return "";

        // Keep relative indentation from the base
        const currentIndent = line.match(/^\s+/)?.[0].length || 0;
        const relativeIndent = Math.max(0, currentIndent - baseIndent);
        return " ".repeat(relativeIndent) + line.trim();
    });
}

export function formatSnippetOutput(snippets: Record<string, VSCodeSnippet> | null, includeBrackets: boolean, sort: boolean = false): string {
    if (!snippets) return "";

    let entries = Object.entries(snippets);

    if (sort) {
        entries = entries.sort(([keyA], [keyB]) => keyA.localeCompare(keyB));
    }

    const formattedSnippets = entries
        .map(([name, snippet]) => {
            const snippetJson = JSON.stringify(snippet, null, 2)
                .split("\n")
                .map((line) => "  " + line) // Indent each line
                .join("\n");
            return `"${name}": ${snippetJson}`;
        })
        .join(",\n");

    return includeBrackets ? `{\n${formattedSnippets}\n}` : formattedSnippets;
}

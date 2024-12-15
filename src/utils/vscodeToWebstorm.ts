import { VSCodeSnippet } from "@/types";

interface TemplateSetOptions {
    includeTemplateSet: boolean;
    group: string;
    sort?: boolean;
}

export function convertToWebStormTemplate(
    snippets: Record<string, VSCodeSnippet> | null,
    options: TemplateSetOptions = { includeTemplateSet: true, group: "Custom", sort: false }
): string {
    if (!snippets) return "";

    // Helper function to convert VSCode placeholders to WebStorm variables
    function convertPlaceholders(text: string): string {
        return text.replace(/\$\{(\d+)\|([^}]+)\}|\$\{(\d+):([^}]+)\}|\$\{(\d+)\}|\$(\d+)/g, (match, p1, p2, p3, p4, p5, p6) => {
            // Special case for ${0} or $0
            if (p5 === "0" || p6 === "0") {
                return "$END$";
            }

            if (p1 && p2) {
                // Choice placeholder
                return `$VAR${p1}$`;
            } else if (p3 && p4) {
                // Placeholder with default value
                return `$${p4}$`;
            } else if (p5) {
                // Simple placeholder ${1}
                return `$VAR${p5}$`;
            } else if (p6) {
                // Simple placeholder $1
                return `$VAR${p6}$`;
            }
            return match;
        });
    }

    // Helper function to escape XML special characters
    function escapeXml(unsafe: string): string {
        return unsafe.replace(/[<>&'"]/g, (c) => {
            switch (c) {
                case "<":
                    return "&lt;";
                case ">":
                    return "&gt;";
                case "&":
                    return "&amp;";
                case "'":
                    return "&apos;";
                case '"':
                    return "&quot;";
                default:
                    return c;
            }
        });
    }

    // Convert each snippet to a WebStorm template
    let entries = Object.entries(snippets);

    if (options.sort) {
        entries = entries.sort(([keyA], [keyB]) => keyA.localeCompare(keyB));
    }

    const templates = entries
        .map(([_name, snippet]) => {
            const { prefix, body, description, scope } = snippet;
            // First convert placeholders and escape XML, then add line breaks
            const bodyString = body.map((line) => escapeXml(convertPlaceholders(line))).join("&#10;");

            // Keep track of processed variable names
            const processedVars = new Set<string>();

            const variables =
                bodyString
                    .match(/\$VAR(\d+)\$|\$([a-zA-Z0-9_]+)\$/g)
                    ?.map((varMatch) => {
                        const varNumberMatch = varMatch.match(/VAR(\d+)/);
                        const varNameMatch = varMatch.match(/\$([a-zA-Z0-9_]+)\$/);

                        // Skip END marker
                        if (varMatch === "$END$") {
                            return "";
                        }

                        if (varNumberMatch) {
                            const varNumber = varNumberMatch[1];
                            const varName = `VAR${varNumber}`;

                            // Skip if we've already processed this variable
                            if (processedVars.has(varName)) {
                                return "";
                            }
                            processedVars.add(varName);

                            const choicePlaceholder = body.join("\n").match(new RegExp(`\\$\\{${varNumber}\\|([^}]+)\\}`));
                            if (choicePlaceholder) {
                                const choices = choicePlaceholder[1]
                                    .replace(/\|$/, "") // Remove trailing pipe if present
                                    .split(",")
                                    .map((choice) => `&quot;${choice.trim()}&quot;`)
                                    .join(",");
                                const defaultValue = choicePlaceholder[1].split(",")[0].trim();
                                return `<variable name="${varName}" expression="enum(${choices})" defaultValue="&quot;${defaultValue}&quot;" alwaysStopAt="true" />`;
                            } else {
                                // For simple tabstops like $1, $2, use empty default value without quotes
                                return `<variable name="${varName}" expression="" defaultValue="" alwaysStopAt="true" />`;
                            }
                        } else if (varNameMatch) {
                            const varName = varNameMatch[1];

                            // Skip if we've already processed this variable
                            if (processedVars.has(varName)) {
                                return "";
                            }
                            processedVars.add(varName);

                            // For named placeholders, use the name as the default value
                            return `<variable name="${varName}" expression="" defaultValue="&quot;${varName}&quot;" alwaysStopAt="true" />`;
                        }
                        return "";
                    })
                    .filter(Boolean) // Remove empty strings
                    .join("\n") || "";

            // ...existing code...
            const context = scope
                ? scope
                      .split(",")
                      .map((s) => `<option name="${s.trim()}" value="true" />`)
                      .join("\n")
                : "";
            // ...existing code...

            return `
  <template name="${prefix}" value="${bodyString}" description="${description}" toReformat="false" toShortenFQNames="true">
    ${variables}
    <context>
      ${context}
    </context>
  </template>`;
        })
        .join("\n");

    // Wrap templates in a templateSet if required
    if (options.includeTemplateSet) {
        return `<templateSet group="${options.group}">
    ${templates}
  </templateSet>`;
    }

    return templates;
}

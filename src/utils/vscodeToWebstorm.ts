export interface VSCodeSnippet {
    [key: string]: {
        prefix: string;
        body: string[];
        description?: string;
        scope?: string;
    };
}

interface TemplateSetOptions {
    includeTemplateSet: boolean;
    group: string;
}

export function convertToWebStormTemplate(snippets: Record<string, VSCodeSnippet>, options: TemplateSetOptions = { includeTemplateSet: true, group: "Custom" }): string {
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
    const templates = Object.values(snippets)
        .map((snippet) => {
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
                                return `<variable name="${varName}" expression="enum(${choices})" defaultValue="${defaultValue}" alwaysStopAt="true" />`;
                            } else {
                                return `<variable name="${varName}" expression="" defaultValue="" alwaysStopAt="true" />`;
                            }
                        } else if (varNameMatch) {
                            const varName = varNameMatch[1];

                            // Skip if we've already processed this variable
                            if (processedVars.has(varName)) {
                                return "";
                            }
                            processedVars.add(varName);

                            const defaultPlaceholder = body.join("\n").match(new RegExp(`\\$\\{\\d+:${varName}\\}`));
                            if (defaultPlaceholder) {
                                return `<variable name="${varName}" expression="" defaultValue="${varName}" alwaysStopAt="true" />`;
                            }
                        }
                        return "";
                    })
                    .filter(Boolean) // Remove empty strings
                    .join("\n") || "";

            const context = scope
                ? scope
                      .split(",")
                      .map((s) => `<option name="${s.trim().toUpperCase()}" value="true" />`)
                      .join("\n")
                : "";

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

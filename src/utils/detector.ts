export function detectInputFormat(content: string): 'xml' | 'json' {
  const trimmedContent = content.trim();
  
  // Check for XML format
  if (
    trimmedContent.startsWith('<?xml') || 
    trimmedContent.startsWith('<templateSet') ||
    trimmedContent.startsWith('<template')
  ) {
    return 'xml';
  }
  
  // Check for JSON format
  try {
    // Try parsing as complete JSON or as a snippet fragment
    const content = trimmedContent.startsWith('{') ? 
      trimmedContent : 
      `{${trimmedContent}}`;
    JSON.parse(content);
    return 'json';
  } catch {
    return 'xml';
  }
}
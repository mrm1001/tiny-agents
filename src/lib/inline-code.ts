const ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (ch) => ESCAPES[ch]!);

/**
 * Takeaways are copied verbatim from the curriculum table and use Markdown
 * backticks, but they render outside the Markdown pipeline (index rows, the
 * lesson callout). This turns `code` into <code> and nothing else — the input
 * is escaped first, so it is safe to pass to set:html.
 */
export const inlineCode = (text: string) =>
  escapeHtml(text).replace(/`([^`]+)`/g, '<code>$1</code>');

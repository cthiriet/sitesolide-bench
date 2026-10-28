import { Marked } from 'marked';

const escapeHtml = (text: string) =>
  text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

const UNSAFE_URL = /^[\s\u0000-\u001f]*(javascript|vbscript|data):/i;

// Pages are written by users: raw HTML is shown as text, and links cannot
// run script.
const markdown = new Marked({
  gfm: true,
  renderer: {
    html: ({ text }) => escapeHtml(text),
  },
  walkTokens(token) {
    if ((token.type === 'link' || token.type === 'image') && UNSAFE_URL.test(token.href)) {
      token.href = '#';
    }
  },
});

export function renderMarkdown(source: string): string {
  return markdown.parse(source, { async: false });
}

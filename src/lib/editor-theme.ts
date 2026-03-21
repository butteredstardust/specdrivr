import { createTheme } from '@uiw/codemirror-themes';
import { tags as t } from '@lezer/highlight';

export const specdrivrTheme = createTheme({
  theme: 'dark',
  settings: {
    background: '#0a0a0b',
    foreground: '#f4f4f5',
    caret: '#ffb300',
    selection: '#7c5cfc33',
    selectionMatch: '#7c5cfc44',
    lineHighlight: '#18181b',
    gutterBackground: '#0a0a0b',
    gutterForeground: '#52525b',
  },
  styles: [
    { tag: t.heading1, fontSize: '1.4em', fontWeight: 'bold', color: '#7c5cfc' },
    { tag: t.heading2, fontSize: '1.2em', fontWeight: 'bold', color: '#7c5cfc' },
    { tag: t.heading3, fontSize: '1.1em', fontWeight: 'bold', color: '#7c5cfc' },
    { tag: t.strong, fontWeight: 'bold' },
    { tag: t.emphasis, fontStyle: 'italic' },
    { tag: t.link, color: '#ffb300', textDecoration: 'underline' },
    { tag: t.url, color: '#ffb300' },
    { tag: t.keyword, color: '#7c5cfc' },
    { tag: t.comment, color: '#52525b' },
    { tag: t.meta, color: '#a1a1aa' },
    { tag: t.string, color: '#39ff14' },
    { tag: t.number, color: '#7c5cfc' },
    { tag: t.list, color: '#ffb300' },
    { tag: t.quote, color: '#a1a1aa', fontStyle: 'italic' },
  ],
});

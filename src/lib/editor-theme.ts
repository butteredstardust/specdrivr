import { createTheme } from '@uiw/codemirror-themes';
import { tags as t } from '@lezer/highlight';

export const specdrivrTheme = createTheme({
  theme: 'dark',
  settings: {
    background: '#0c0d13',
    foreground: '#f4f8fb',
    caret: '#ffb300',
    selection: '#2c7ed44d',
    selectionMatch: '#a7ffff33',
    lineHighlight: '#191c28',
    gutterBackground: '#0c0d13',
    gutterForeground: '#6f7c91',
  },
  styles: [
    { tag: t.heading1, fontSize: '1.4em', fontWeight: 'bold', color: '#5cafff' },
    { tag: t.heading2, fontSize: '1.2em', fontWeight: 'bold', color: '#5cafff' },
    { tag: t.heading3, fontSize: '1.1em', fontWeight: 'bold', color: '#5cafff' },
    { tag: t.strong, fontWeight: 'bold' },
    { tag: t.emphasis, fontStyle: 'italic' },
    { tag: t.link, color: '#ffb300', textDecoration: 'underline' },
    { tag: t.url, color: '#ffb300' },
    { tag: t.keyword, color: '#5cafff' },
    { tag: t.comment, color: '#6f7c91' },
    { tag: t.meta, color: '#a7b2c3' },
    { tag: t.string, color: '#39ff14' },
    { tag: t.number, color: '#5cafff' },
    { tag: t.list, color: '#ffb300' },
    { tag: t.quote, color: '#a7b2c3', fontStyle: 'italic' },
  ],
});

import { createTheme } from '@uiw/codemirror-themes';
import { tags as t } from '@lezer/highlight';

/**
 * CodeMirror themes for the spec editor.
 *
 * `createTheme` wants literal colours — it builds a stylesheet rather than
 * reading custom properties — so these are the only place outside globals.css
 * that repeats a token value. They are transcribed from the `:root` and `.dark`
 * blocks there and must be updated alongside them.
 *
 * The previous single theme was the retro palette (`#39ff14` phosphor green,
 * `#ffb300` amber) and was hardcoded to dark, so the editor stayed a dark box
 * in a light-themed app. D1 replaced that aesthetic; there are two themes now,
 * picked by the active app theme.
 */
type Palette = {
  base: string;
  inset: string;
  primary: string;
  secondary: string;
  muted: string;
  accent: string;
  /** accent at 30% — CodeMirror takes 8-digit hex for the selection layers. */
  accentAlpha: string;
  success: string;
  danger: string;
};

const DARK: Palette = {
  base: '#0b0d11',
  inset: '#1a1e26',
  primary: '#f2f4f7',
  secondary: '#a6b0be',
  muted: '#808b9b',
  accent: '#4d8dfa',
  accentAlpha: '#4d8dfa4d',
  success: '#47cd89',
  danger: '#f97066',
};

const LIGHT: Palette = {
  base: '#ffffff',
  inset: '#eceff3',
  primary: '#14161a',
  secondary: '#4a5260',
  muted: '#616977',
  accent: '#1f5fe0',
  accentAlpha: '#1f5fe033',
  success: '#067647',
  danger: '#b42318',
};

function build(mode: 'light' | 'dark', c: Palette) {
  return createTheme({
    theme: mode,
    settings: {
      background: c.base,
      foreground: c.primary,
      caret: c.accent,
      selection: c.accentAlpha,
      selectionMatch: c.accentAlpha,
      lineHighlight: c.inset,
      gutterBackground: c.base,
      gutterForeground: c.muted,
    },
    styles: [
      // Markdown headings keep their size ramp but drop the accent colouring —
      // weight and scale already separate them from body text.
      { tag: t.heading1, fontSize: '1.4em', fontWeight: 'bold', color: c.primary },
      { tag: t.heading2, fontSize: '1.2em', fontWeight: 'bold', color: c.primary },
      { tag: t.heading3, fontSize: '1.1em', fontWeight: 'bold', color: c.primary },
      { tag: t.strong, fontWeight: 'bold', color: c.primary },
      { tag: t.emphasis, fontStyle: 'italic' },
      { tag: t.link, color: c.accent, textDecoration: 'underline' },
      { tag: t.url, color: c.accent },
      { tag: t.keyword, color: c.accent },
      { tag: t.number, color: c.accent },
      { tag: t.string, color: c.success },
      { tag: t.invalid, color: c.danger },
      { tag: t.comment, color: c.muted, fontStyle: 'italic' },
      { tag: t.meta, color: c.muted },
      { tag: t.list, color: c.secondary },
      { tag: t.quote, color: c.muted, fontStyle: 'italic' },
    ],
  });
}

export const editorThemeDark = build('dark', DARK);
export const editorThemeLight = build('light', LIGHT);

export function editorTheme(resolvedTheme: string | undefined) {
  return resolvedTheme === 'light' ? editorThemeLight : editorThemeDark;
}

import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitize HTML string before injecting into the DOM.
 * Use for ANSI-converted terminal output.
 */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['span', 'b', 'i', 'strong', 'em', 'br'],
    ALLOWED_ATTR: ['style', 'class'],
  });
}

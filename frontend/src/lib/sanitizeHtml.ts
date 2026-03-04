import DOMPurify from 'dompurify';

/** Allowed tags for rich text descriptions (bold, italic, underline, paragraphs). */
const ALLOWED_TAGS = ['b', 'i', 'u', 'strong', 'em', 'p', 'br'];

/**
 * Sanitize HTML for safe display of project descriptions.
 * Use before rendering with dangerouslySetInnerHTML.
 */
export function sanitizeDescriptionHtml(html: string): string {
  if (!html || typeof html !== 'string') return '';
  return DOMPurify.sanitize(html, { ALLOWED_TAGS });
}

/**
 * Strip all HTML for plain-text preview (e.g. card line-clamp).
 */
export function stripHtml(html: string): string {
  if (!html || typeof html !== 'string') return '';
  return DOMPurify.sanitize(html, { ALLOWED_TAGS: [] }).trim();
}

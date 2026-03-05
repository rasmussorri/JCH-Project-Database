import DOMPurify from 'dompurify';

/** Allowed tags for rich text descriptions (bold, italic, underline, paragraphs, lists). */
const ALLOWED_TAGS = ['b', 'i', 'u', 'strong', 'em', 'p', 'br', 'ul', 'ol', 'li'];

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
 * Block-level tags are replaced with a space so adjacent words don't merge.
 */
export function stripHtml(html: string): string {
  if (!html || typeof html !== 'string') return '';
  const spaced = html.replace(/<\/?(p|h[1-6]|li|ul|ol|div|br|blockquote|pre)[^>]*>/gi, ' ');
  return DOMPurify.sanitize(spaced, { ALLOWED_TAGS: [] }).replace(/\s+/g, ' ').trim();
}

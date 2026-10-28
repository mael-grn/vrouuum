/**
 * Converts a text string into an SEO & URL-friendly slug.
 * Handles accented characters, spaces, and special symbols.
 * Example: "Aston Martin" -> "aston-martin", "Ferrari" -> "ferrari"
 */
export function slugify(text: string): string {
  if (!text) return '';
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Finds an item in an array by comparing its slugified name or its numeric ID.
 */
export function findBySlugOrId<T extends { id: number; name: string }>(
  items: T[],
  slugOrId?: string | null
): T | undefined {
  if (!slugOrId) return undefined;
  const normalized = slugify(slugOrId);
  return items.find((item) => slugify(item.name) === normalized || String(item.id) === slugOrId);
}

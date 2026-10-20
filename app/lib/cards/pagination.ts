/** Shared, bounded pagination for card payments and security history. */
export function cardPage<T>(rows: readonly T[], requestedPage: number, pageSize = 20) {
  const size = Number.isFinite(pageSize) ? Math.max(1, Math.floor(pageSize)) : 20;
  const pages = Math.max(1, Math.ceil(rows.length / size));
  const page = Math.min(pages - 1, Math.max(0, Number.isFinite(requestedPage) ? Math.floor(requestedPage) : 0));
  const start = page * size;
  return { page, pages, start, end: Math.min(rows.length, start + size), rows: rows.slice(start, start + size), hasPrevious: page > 0, hasNext: page + 1 < pages };
}

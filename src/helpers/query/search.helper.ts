import { ilike, or, type SQL } from 'drizzle-orm';

type SearchableColumn = Parameters<typeof ilike>[0];

export const buildSearchCondition = (
  search: string | undefined,
  columns: SearchableColumn[],
): SQL | undefined => {
  const keyword = search?.trim();
  if (!keyword || columns.length === 0) {
    return undefined;
  }

  const likeValue = `%${keyword}%`;
  const conditions = columns.map((column) => ilike(column, likeValue));

  return or(...conditions);
};

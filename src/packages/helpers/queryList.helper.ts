import { and, eq, ilike, or, type SQL, type SQLWrapper } from 'drizzle-orm';

type SearchableColumn = {
  column: SQLWrapper;
};

type FilterableColumn<TValue> = {
  column: SQLWrapper;
  transform?: (value: TValue) => TFilterComparable;
};

type TFilterComparable = string | number | boolean | Date;

export type BuildListWhereClauseParams<
  TSearchField extends string,
  TFilterField extends string,
  TFilterValue,
> = {
  search?: string;
  searchableColumns?: Partial<Record<TSearchField, SearchableColumn>>;
  filters?: Partial<Record<TFilterField, TFilterValue | null | undefined>>;
  filterColumns?: Partial<Record<TFilterField, FilterableColumn<TFilterValue>>>;
};

/**
 * Build where-clause for list API:
 * - `search`: OR across configured searchable columns (ILIKE)
 * - `filters`: AND exact-match conditions (EQ), skipping undefined/null
 */
export function buildListWhereClause<
  TSearchField extends string,
  TFilterField extends string,
  TFilterValue,
>({
  search,
  searchableColumns,
  filters,
  filterColumns,
}: BuildListWhereClauseParams<TSearchField, TFilterField, TFilterValue>): SQL | undefined {
  const conditions: SQL[] = [];

  if (search?.trim()) {
    const pattern = `%${search.trim()}%`;
    const searchConditions = (Object.values(searchableColumns ?? {}) as SearchableColumn[])
      .map((item) => (item ? ilike(item.column as never, pattern) : undefined))
      .filter((condition): condition is SQL => condition !== undefined);

    if (searchConditions.length > 0) {
      const searchCondition = or(...searchConditions);
      if (searchCondition) {
        conditions.push(searchCondition);
      }
    }
  }

  for (const [field, value] of Object.entries(filters ?? {})) {
    if (value === undefined || value === null) continue;

    const item = filterColumns?.[field as TFilterField];
    if (item) {
      const normalizedValue = item.transform
        ? item.transform(value as TFilterValue)
        : (value as TFilterValue);
      conditions.push(eq(item.column as never, normalizedValue));
    }
  }

  if (conditions.length === 0) return undefined;
  if (conditions.length === 1) return conditions[0];

  return and(...conditions);
}

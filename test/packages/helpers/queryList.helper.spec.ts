import { buildListWhereClause } from '@packages/helpers';
import { and, eq, ilike, or } from 'drizzle-orm';

jest.mock('drizzle-orm', () => ({
  and: jest.fn(),
  eq: jest.fn(),
  ilike: jest.fn(),
  or: jest.fn(),
}));

describe('queryList helper ...', () => {
  const emailColumn = 'email' as never;
  const nameColumn = 'name' as never;

  beforeEach(() => {
    jest.clearAllMocks();
    (ilike as jest.Mock).mockReturnValue('search_condition');
    (or as jest.Mock).mockReturnValue('or_condition');
  });

  describe('buildListWhereClause ...', () => {
    describe('search scenarios ...', () => {
      it.each([
        { search: '', description: 'empty string' },
        { search: '   ', description: 'whitespace only' },
        { search: undefined, description: 'undefined' },
      ])('should return undefined when search is $description', ({ search }) => {
        const result = buildListWhereClause({
          search,
          searchableColumns: {
            email: { column: emailColumn },
          },
        });

        expect(result).toEqual(undefined);
        expect(ilike).not.toHaveBeenCalled();
        expect(or).not.toHaveBeenCalled();
      });

      it.each([
        { search: 'alice', description: 'non-empty string' },
        { search: '  bob  ', description: 'string with surrounding whitespace' },
      ])('should build search condition for $description', ({ search }) => {
        const result = buildListWhereClause({
          search,
          searchableColumns: {
            email: { column: emailColumn },
          },
        });

        expect(ilike).toHaveBeenCalledTimes(1);
        expect(or).toHaveBeenCalledTimes(1);
        expect(result).not.toEqual(undefined);
      });

      it.each([
        {
          search: 'test',
          columns: { email: { column: emailColumn } },
          expectedIlikeCalls: 1,
          description: 'single column',
        },
        {
          search: 'test',
          columns: {
            email: { column: emailColumn },
            name: { column: nameColumn },
          },
          expectedIlikeCalls: 2,
          description: 'multiple columns',
        },
      ])(
        'should call ilike $expectedIlikeCalls time(s) for $description',
        ({ search, columns, expectedIlikeCalls }) => {
          const result = buildListWhereClause({
            search,
            searchableColumns: columns,
          });

          expect(ilike).toHaveBeenCalledTimes(expectedIlikeCalls);
          expect(or).toHaveBeenCalledTimes(1);
          expect(result).not.toEqual(undefined);
        },
      );
    });

    describe('searchableColumns scenarios ...', () => {
      it('should return undefined when searchableColumns is undefined', () => {
        const result = buildListWhereClause({
          search: 'test',
        });

        expect(result).toEqual(undefined);
        expect(ilike).not.toHaveBeenCalled();
        expect(or).not.toHaveBeenCalled();
      });

      it('should return undefined when searchableColumns is empty', () => {
        const result = buildListWhereClause({
          search: 'test',
          searchableColumns: {},
        });

        expect(result).toEqual(undefined);
        expect(ilike).not.toHaveBeenCalled();
        expect(or).not.toHaveBeenCalled();
      });

      it('should skip undefined searchableColumn entries and return undefined', () => {
        const result = buildListWhereClause({
          search: 'test',
          searchableColumns: { email: undefined },
        });

        expect(ilike).not.toHaveBeenCalled();
        expect(result).toEqual(undefined);
      });
    });

    describe('filter scenarios ...', () => {
      const statusColumn = 'status' as never;

      beforeEach(() => {
        (eq as jest.Mock).mockReturnValue('eq_condition');
      });

      it.each([
        { value: null, description: 'null' },
        { value: undefined, description: 'undefined' },
      ])('should skip filter when value is $description', ({ value }) => {
        const result = buildListWhereClause({
          filters: { status: value },
          filterColumns: { status: { column: statusColumn } },
        });

        expect(eq).not.toHaveBeenCalled();
        expect(result).toEqual(undefined);
      });

      it('should skip filter when filterColumns has no matching column', () => {
        const result = buildListWhereClause({
          filters: { status: 'active' },
          filterColumns: {},
        });

        expect(eq).not.toHaveBeenCalled();
        expect(result).toEqual(undefined);
      });

      it('should call eq with raw value when no transform is defined', () => {
        const result = buildListWhereClause({
          filters: { status: 'active' },
          filterColumns: { status: { column: statusColumn } },
        });

        expect(eq).toHaveBeenCalledWith(statusColumn, 'active');
        expect(result).toEqual('eq_condition');
      });

      it('should call eq with transformed value when transform is defined', () => {
        const transform = jest.fn().mockReturnValue('ACTIVE');

        const result = buildListWhereClause({
          filters: { status: 'active' },
          filterColumns: { status: { column: statusColumn, transform } },
        });

        expect(transform).toHaveBeenCalledWith('active');
        expect(eq).toHaveBeenCalledWith(statusColumn, 'ACTIVE');
        expect(result).toEqual('eq_condition');
      });
    });

    describe('and scenarios (multiple conditions) ...', () => {
      const statusColumn = 'status' as never;
      const roleColumn = 'role' as never;

      beforeEach(() => {
        (eq as jest.Mock).mockReturnValue('eq_condition');
        (and as jest.Mock).mockReturnValue('and_condition');
      });

      it('should call and when both search and filter conditions are present', () => {
        const result = buildListWhereClause({
          search: 'alice',
          searchableColumns: { email: { column: emailColumn } },
          filters: { status: 'active' },
          filterColumns: { status: { column: statusColumn } },
        });

        expect(or).toHaveBeenCalledTimes(1);
        expect(eq).toHaveBeenCalledTimes(1);
        expect(and).toHaveBeenCalledWith('or_condition', 'eq_condition');
        expect(result).toEqual('and_condition');
      });

      it('should call and when multiple filter conditions are present', () => {
        (eq as jest.Mock)
          .mockReturnValueOnce('eq_status_condition')
          .mockReturnValueOnce('eq_role_condition');

        const result = buildListWhereClause({
          filters: { status: 'active', role: 'admin' },
          filterColumns: {
            status: { column: statusColumn },
            role: { column: roleColumn },
          },
        });

        expect(eq).toHaveBeenCalledTimes(2);
        expect(and).toHaveBeenCalledWith('eq_status_condition', 'eq_role_condition');
        expect(result).toEqual('and_condition');
      });
    });
  });
});

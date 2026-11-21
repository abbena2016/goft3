import { describe, it, expect } from 'vitest';
import { generatePostgresDDL, generateSqliteDDL, generateTableColumnNames, TABLE_ORDER, TABLES } from '../services/tableSchema';

describe('unified table schema', () => {
    it('defines all application tables', () => {
        expect(TABLE_ORDER.length).toBeGreaterThanOrEqual(19);
        for (const t of TABLE_ORDER) {
            expect(TABLES[t]).toBeDefined();
        }
    });

    it('generates SQLite DDL for every table', () => {
        const ddl = generateSqliteDDL();
        for (const t of TABLE_ORDER) {
            expect(ddl[t]).toBeDefined();
            expect(ddl[t]).toContain(`CREATE TABLE IF NOT EXISTS ${t}`);
            expect(ddl[t]).toContain('PRIMARY KEY AUTOINCREMENT');
        }
    });

    it('generates Postgres DDL with identity PKs', () => {
        const sql = generatePostgresDDL();
        expect(sql).toContain('CREATE TABLE public.T_USER');
        expect(sql).toContain('CONSTRAINT T_USER_pkey PRIMARY KEY');
        expect(sql).toContain('GENERATED ALWAYS AS IDENTITY');
    });

    it('table column names match the SQLite export expectations', () => {
        const columns = generateTableColumnNames();
        expect(columns.T_OPERATION).toContain('N_OPERATION');
        expect(columns.T_OPERATION).toContain('status');
        expect(columns.T_PIECE).toContain('SAI_ENG');
        expect(columns.T_PIECE).toContain('SAI_PAI');
    });
});

// @ts-expect-error - sql-wasm-inline provides inline WebAssembly module
import initSqlJs from 'sql.js/dist/sql-wasm-inline.js';
import { Database } from '../types';
import { TABLE_ORDER, generateSqliteDDL, generateTableColumnNames } from '../services/tableSchema';

const TABLE_SCHEMAS = generateSqliteDDL();

const TABLE_COLUMNS = generateTableColumnNames();

function getTableColumns(tableName: string): string[] {
    return TABLE_COLUMNS[tableName] || [];
}

export async function exportDatabaseToSqlite(dbData: Database, _fileName = 'gft3.db'): Promise<{ blob: Blob; totalRecords: number }> {
    // تهيئة محرك SQLite مع WebAssembly مدمج داخلياً
    const SQL = await initSqlJs();

    const sqliteDb = new SQL.Database();

    // 1. تفعيل القيود وإنشاء كافة الجداول
    sqliteDb.run("PRAGMA foreign_keys = ON;");
    for (const table of TABLE_ORDER) {
        const schema = TABLE_SCHEMAS[table];
        if (schema) {
            sqliteDb.run(schema);
        }
    }

    let totalRecords = 0;

    // 2. إدراج جميع السجلات لكل جدول
    for (const table of TABLE_ORDER) {
        const rows = (dbData as any)[table] as any[];
        if (Array.isArray(rows) && rows.length > 0) {
            const firstRow = rows[0];
            const schemaColumns = new Set(getTableColumns(table));
            let columns = Object.keys(firstRow);
            if (schemaColumns.size > 0) {
                columns = columns.filter(c => schemaColumns.has(c));
            }
            const placeholders = columns.map(() => '?').join(', ');
            const columnNames = columns.map(c => `"${c}"`).join(', ');
            const insertSql = `INSERT OR REPLACE INTO "${table}" (${columnNames}) VALUES (${placeholders});`;

            for (const row of rows) {
                const values = columns.map(col => {
                    const val = row[col];
                    if (typeof val === 'boolean') return val ? 1 : 0;
                    if (val === undefined || val === null) return null;
                    if (typeof val === 'object') return JSON.stringify(val);
                    return val;
                });
                sqliteDb.run(insertSql, values);
                totalRecords++;
            }
        }
    }

    // 3. تصدير قاعدة البيانات بصيغة باينري
    const binaryArray = sqliteDb.export();
    const blob = new Blob([binaryArray], { type: 'application/x-sqlite3' });

    sqliteDb.close();

    return { blob, totalRecords };
}

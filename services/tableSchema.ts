// ============================================================================
// Single source of truth for the GOFT3 database schema.
//
// Both the Supabase/PostgreSQL DDL (services/dbSchema.ts) and the SQLite DDL
// (utils/sqliteExport.ts) are generated from THIS definition, so tables and
// columns can never drift between the two back-ends again.
// ============================================================================

export type DialectType =
    | 'text'
    | 'integer'
    | 'real'
    | 'boolean'
    | 'bigint';

export interface ColumnDef {
    name: string;
    type: DialectType;
    nullable?: boolean;          // default true
    unique?: boolean;
    default?: string | number | boolean;
    check?: string;              // raw SQL check expression (PostgreSQL only)
}

export interface ForeignKeyDef {
    column: string;
    refTable: string;
    refColumn: string;
    onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT';
}

export interface TableDef {
    name: string;
    columns: ColumnDef[];
    primaryKey: string;
    foreignKeys?: ForeignKeyDef[];
}

export const TABLE_ORDER: string[] = [
    'T_USER',
    'T_DIRECTION',
    'T_PROGRAMME',
    'T_SPROGRAMME',
    'T_CATEGORIE',
    'T_SCATEGORIE',
    'T_RUBRIQUE',
    'T_BENEFICIAIRE',
    'T_COMPTE_BANCAIRE',
    'T_BORDEREAU',
    'T_OPERATION',
    'T_RUBRIQUE_OP',
    'T_SCATEGORIE_OP',
    'T_LOT_OPERATION',
    'T_PIECE',
    'T_LOT_PIECE',
    'T_ODS',
    'T_CP',
    'T_ENGAGEMENT',
    'T_PAIEMENT',
];

export const TABLES: Record<string, TableDef> = {
    T_USER: {
        name: 'T_USER',
        primaryKey: 'ID_USER',
        columns: [
            { name: 'ID_USER', type: 'integer' },
            { name: 'USERNAME', type: 'text', nullable: false, unique: true },
            { name: 'PASSWORD', type: 'text', nullable: false },
            { name: 'ROLE', type: 'text', nullable: false, check: `"ROLE" = ANY (ARRAY['admin'::text, 'user'::text, 'viewer'::text])` },
            { name: 'ALLOWED_PAGES', type: 'text' },
            { name: 'ALLOWED_OPERATIONS', type: 'text' },
        ],
    },
    T_BENEFICIAIRE: {
        name: 'T_BENEFICIAIRE',
        primaryKey: 'ID_BENEFICIAIRE',
        columns: [
            { name: 'ID_BENEFICIAIRE', type: 'integer' },
            { name: 'BENEFICIAIRE', type: 'text', nullable: false },
            { name: 'ACTIVITE', type: 'text' },
            { name: 'ADRESSE', type: 'text', nullable: false },
            { name: 'RC', type: 'text' },
            { name: 'CODE_FISCALE', type: 'text' },
        ],
    },
    T_COMPTE_BANCAIRE: {
        name: 'T_COMPTE_BANCAIRE',
        primaryKey: 'ID_COMPTE',
        columns: [
            { name: 'ID_COMPTE', type: 'integer' },
            { name: 'ID_BENEFICIAIRE', type: 'integer', nullable: false },
            { name: 'RIB', type: 'text', nullable: false },
            { name: 'BANQUE', type: 'text', nullable: false },
        ],
        foreignKeys: [
            { column: 'ID_BENEFICIAIRE', refTable: 'T_BENEFICIAIRE', refColumn: 'ID_BENEFICIAIRE', onDelete: 'CASCADE' },
        ],
    },
    T_CATEGORIE: {
        name: 'T_CATEGORIE',
        primaryKey: 'ID_CATEGORIE',
        columns: [
            { name: 'ID_CATEGORIE', type: 'integer' },
            { name: 'C_CATEGORIE', type: 'text', nullable: false },
            { name: 'INT_CATEGORIE', type: 'text', nullable: false },
        ],
    },
    T_SCATEGORIE: {
        name: 'T_SCATEGORIE',
        primaryKey: 'ID_SCATEGORIE',
        columns: [
            { name: 'ID_SCATEGORIE', type: 'integer' },
            { name: 'ID_CATEGORIE', type: 'integer', nullable: false },
            { name: 'C_SCATEGORIE', type: 'text', nullable: false },
            { name: 'INT_SCATEGORIE', type: 'text', nullable: false },
        ],
        foreignKeys: [
            { column: 'ID_CATEGORIE', refTable: 'T_CATEGORIE', refColumn: 'ID_CATEGORIE', onDelete: 'CASCADE' },
        ],
    },
    T_OPERATION: {
        name: 'T_OPERATION',
        primaryKey: 'ID_OPERATION',
        columns: [
            { name: 'ID_OPERATION', type: 'integer' },
            { name: 'N_OPERATION', type: 'text', nullable: false },
            { name: 'N_OPERATION_ANCIEN', type: 'text' },
            { name: 'INT_OPERATION', type: 'text', nullable: false },
            { name: 'ID_CATEGORIE', type: 'integer', nullable: false },
            { name: 'status', type: 'text', nullable: false, check: `status = ANY (ARRAY['جارية'::text, 'مغلقة'::text])` },
            { name: 'CREATED_BY', type: 'text' },
            { name: 'ID_SCATEGORIE', type: 'integer' },
            { name: 'TYPE_OP', type: 'text' },
        ],
        foreignKeys: [
            { column: 'ID_CATEGORIE', refTable: 'T_CATEGORIE', refColumn: 'ID_CATEGORIE' },
            { column: 'ID_SCATEGORIE', refTable: 'T_SCATEGORIE', refColumn: 'ID_SCATEGORIE' },
        ],
    },
    T_RUBRIQUE: {
        name: 'T_RUBRIQUE',
        primaryKey: 'ID_RUBRIQUE',
        columns: [
            { name: 'ID_RUBRIQUE', type: 'integer' },
            { name: 'RUBRIQUE', type: 'text', nullable: false },
        ],
    },
    T_PIECE: {
        name: 'T_PIECE',
        primaryKey: 'ID_PIECE',
        columns: [
            { name: 'ID_PIECE', type: 'integer' },
            { name: 'NAT_PIECE', type: 'text', nullable: false },
            { name: 'ID_PIECE_INIT', type: 'integer' },
            { name: 'ID_OPERATION', type: 'integer', nullable: false },
            { name: 'PIECE', type: 'text', nullable: false },
            { name: 'ID_BENEFICIAIRE', type: 'integer' },
            { name: 'ID_COMPTE', type: 'integer' },
            { name: 'MONTANT_PIECE', type: 'real', nullable: false },
            { name: 'ID_SCATEGORIE', type: 'integer', nullable: false },
            { name: 'ID_RUBRIQUE', type: 'integer' },
            { name: 'DELAI_EX_JOURS', type: 'text' },
            { name: 'SAI_ENG', type: 'boolean', nullable: false, default: false },
            { name: 'SAI_PAI', type: 'boolean', nullable: false, default: false },
            { name: 'N_VISA_CM', type: 'text' },
            { name: 'DATE_VISA_CM', type: 'text' },
            { name: 'CAUTION', type: 'text' },
            { name: 'TYPE_CAUTION', type: 'text' },
        ],
        foreignKeys: [
            { column: 'ID_PIECE_INIT', refTable: 'T_PIECE', refColumn: 'ID_PIECE', onDelete: 'SET NULL' },
            { column: 'ID_COMPTE', refTable: 'T_COMPTE_BANCAIRE', refColumn: 'ID_COMPTE', onDelete: 'SET NULL' },
            { column: 'ID_RUBRIQUE', refTable: 'T_RUBRIQUE', refColumn: 'ID_RUBRIQUE' },
            { column: 'ID_SCATEGORIE', refTable: 'T_SCATEGORIE', refColumn: 'ID_SCATEGORIE' },
            { column: 'ID_OPERATION', refTable: 'T_OPERATION', refColumn: 'ID_OPERATION', onDelete: 'CASCADE' },
            { column: 'ID_BENEFICIAIRE', refTable: 'T_BENEFICIAIRE', refColumn: 'ID_BENEFICIAIRE', onDelete: 'SET NULL' },
        ],
    },
    T_BORDEREAU: {
        name: 'T_BORDEREAU',
        primaryKey: 'ID_BORDEREAU',
        columns: [
            { name: 'ID_BORDEREAU', type: 'bigint' },
            { name: 'N_BORDEREAU', type: 'text' },
            { name: 'ANNEE', type: 'text', nullable: false, default: 'NULL' },
            { name: 'DATE_BORDEREAU', type: 'text' },
            { name: 'DESTINATAIRE', type: 'text' },
            { name: 'DOCUMENTS_JOINTS', type: 'text' },
            { name: 'COPIES_NOTE', type: 'text' },
        ],
    },
    T_ENGAGEMENT: {
        name: 'T_ENGAGEMENT',
        primaryKey: 'ID_ENGAGEMENT',
        columns: [
            { name: 'ID_ENGAGEMENT', type: 'integer' },
            { name: 'ID_OPERATION', type: 'integer', nullable: false },
            { name: 'ID_PIECE', type: 'integer', nullable: false },
            { name: 'N_ENG', type: 'text', nullable: false },
            { name: 'ANNEE', type: 'text', nullable: false },
            { name: 'NATURE_ENG', type: 'text', nullable: false },
            { name: 'OBJET_ENG', type: 'text', nullable: false },
            { name: 'MONTANT_ENG', type: 'real', nullable: false },
            { name: 'AE_ENG', type: 'real', nullable: false },
            { name: 'TOTAL_ENG_ANTERIEURE', type: 'real', nullable: false },
            { name: 'SOLDE_ANTERIEURE', type: 'real', nullable: false },
            { name: 'SOLDE_RELIQUAT', type: 'real', nullable: false },
            { name: 'DATE_ENG', type: 'text' },
            { name: 'N_VISA_CB', type: 'text' },
            { name: 'DATE_VISA_CB', type: 'text' },
            { name: 'ID_BORDEREAU', type: 'bigint' },
            { name: 'BORD_DOCS', type: 'text' },
            { name: 'BORD_COPIES', type: 'text' },
            { name: 'BORD_OBJET', type: 'text' },
        ],
        foreignKeys: [
            { column: 'ID_BORDEREAU', refTable: 'T_BORDEREAU', refColumn: 'ID_BORDEREAU', onDelete: 'SET NULL' },
            { column: 'ID_OPERATION', refTable: 'T_OPERATION', refColumn: 'ID_OPERATION', onDelete: 'CASCADE' },
            { column: 'ID_PIECE', refTable: 'T_PIECE', refColumn: 'ID_PIECE', onDelete: 'CASCADE' },
        ],
    },
    T_PAIEMENT: {
        name: 'T_PAIEMENT',
        primaryKey: 'ID_PAIEMENT',
        columns: [
            { name: 'ID_PAIEMENT', type: 'integer' },
            { name: 'ID_OPERATION', type: 'integer', nullable: false },
            { name: 'ID_ENG', type: 'integer', nullable: false },
            { name: 'ID_PIECE', type: 'integer', nullable: false },
            { name: 'N_PAI', type: 'text', nullable: false },
            { name: 'ANNEE', type: 'text', nullable: false },
            { name: 'DATE_PAI', type: 'text', nullable: false },
            { name: 'OBJET_PAI', type: 'text', nullable: false },
            { name: 'MONTANT_PAI', type: 'real', nullable: false },
            { name: 'TOTAL_PAI', type: 'real', nullable: false },
            { name: 'N_MANDAT', type: 'text' },
            { name: 'DATE_MANDAT', type: 'text' },
            { name: 'DATE_ADMIS', type: 'text' },
            { name: 'MONTANT_TRAVAUX_REALISES', type: 'real' },
            { name: 'AVANCE_FORFAITAIRE', type: 'real' },
            { name: 'AVANCE_APPROVISIONNEMENT', type: 'real' },
            { name: 'RETENUE_GARANTIE', type: 'real' },
            { name: 'PENALITE_RETARD', type: 'real' },
            { name: 'AUTRE_DEDUCTION', type: 'real' },
            { name: 'REMBOURSEMENT_AVANCE_FORFAITAIRE', type: 'real' },
            { name: 'REMBOURSEMENT_AVANCE_APPROVISIONNEMENT', type: 'real' },
        ],
        foreignKeys: [
            { column: 'ID_PIECE', refTable: 'T_PIECE', refColumn: 'ID_PIECE', onDelete: 'CASCADE' },
            { column: 'ID_ENG', refTable: 'T_ENGAGEMENT', refColumn: 'ID_ENGAGEMENT', onDelete: 'CASCADE' },
            { column: 'ID_OPERATION', refTable: 'T_OPERATION', refColumn: 'ID_OPERATION', onDelete: 'CASCADE' },
        ],
    },
    T_CP: {
        name: 'T_CP',
        primaryKey: 'ID_CP',
        columns: [
            { name: 'ID_CP', type: 'integer' },
            { name: 'ID_OPERATION', type: 'integer', nullable: false },
            { name: 'ANNEE', type: 'text', nullable: false },
            { name: 'MONTANT_INITIALE_CP', type: 'real', nullable: false },
            { name: 'MONTANT_FINALE_CP', type: 'real', nullable: false },
        ],
        foreignKeys: [
            { column: 'ID_OPERATION', refTable: 'T_OPERATION', refColumn: 'ID_OPERATION', onDelete: 'CASCADE' },
        ],
    },
    T_LOT_OPERATION: {
        name: 'T_LOT_OPERATION',
        primaryKey: 'ID_LOT',
        columns: [
            { name: 'ID_LOT', type: 'integer' },
            { name: 'ID_OPERATION', type: 'integer', nullable: false },
            { name: 'N_LOT', type: 'text', nullable: false },
            { name: 'INTITULE_LOT', type: 'text', nullable: false },
            { name: 'MONTANT_INITIALE_LOT', type: 'real', nullable: false },
            { name: 'MONTANT_FINALE_LOT', type: 'real', nullable: false },
            { name: 'ATTRIBUER', type: 'boolean', nullable: false, default: false },
        ],
        foreignKeys: [
            { column: 'ID_OPERATION', refTable: 'T_OPERATION', refColumn: 'ID_OPERATION', onDelete: 'CASCADE' },
        ],
    },
    T_LOT_PIECE: {
        name: 'T_LOT_PIECE',
        primaryKey: 'ID_LOT_PIECE',
        columns: [
            { name: 'ID_LOT_PIECE', type: 'integer' },
            { name: 'ID_LOT', type: 'integer', nullable: false },
            { name: 'ID_PIECE', type: 'integer', nullable: false },
            { name: 'DELAI_EX_JOURS', type: 'text' },
        ],
        foreignKeys: [
            { column: 'ID_LOT', refTable: 'T_LOT_OPERATION', refColumn: 'ID_LOT', onDelete: 'CASCADE' },
            { column: 'ID_PIECE', refTable: 'T_PIECE', refColumn: 'ID_PIECE', onDelete: 'CASCADE' },
        ],
    },
    T_RUBRIQUE_OP: {
        name: 'T_RUBRIQUE_OP',
        primaryKey: 'ID_RUBRIQUE_OP',
        columns: [
            { name: 'ID_RUBRIQUE_OP', type: 'integer' },
            { name: 'ID_OPERATION', type: 'integer', nullable: false },
            { name: 'ID_RUBRIQUE', type: 'integer', nullable: false },
            { name: 'MONTANT_INITIALE', type: 'real', nullable: false },
            { name: 'MONTANT_FINALE', type: 'real' },
        ],
        foreignKeys: [
            { column: 'ID_OPERATION', refTable: 'T_OPERATION', refColumn: 'ID_OPERATION', onDelete: 'CASCADE' },
            { column: 'ID_RUBRIQUE', refTable: 'T_RUBRIQUE', refColumn: 'ID_RUBRIQUE' },
        ],
    },
    T_SCATEGORIE_OP: {
        name: 'T_SCATEGORIE_OP',
        primaryKey: 'ID_SCATEGORIE_OP',
        columns: [
            { name: 'ID_SCATEGORIE_OP', type: 'integer' },
            { name: 'ID_OPERATION', type: 'integer', nullable: false },
            { name: 'ID_SCATEGORIE', type: 'integer', nullable: false },
            { name: 'MONTANT_INITIALE', type: 'real', nullable: false },
            { name: 'MONTANT_FINALE', type: 'real' },
        ],
        foreignKeys: [
            { column: 'ID_OPERATION', refTable: 'T_OPERATION', refColumn: 'ID_OPERATION', onDelete: 'CASCADE' },
            { column: 'ID_SCATEGORIE', refTable: 'T_SCATEGORIE', refColumn: 'ID_SCATEGORIE' },
        ],
    },
    T_ODS: {
        name: 'T_ODS',
        primaryKey: 'ID_ODS',
        columns: [
            { name: 'ID_ODS', type: 'integer' },
            { name: 'OBJET_ODS', type: 'text', nullable: false },
            { name: 'NATURE_ODS', type: 'text', nullable: false },
            { name: 'DATE_ODS', type: 'text', nullable: false },
            { name: 'ID_PIECE', type: 'integer', nullable: false },
            { name: 'ID_LOT', type: 'integer' },
        ],
        foreignKeys: [
            { column: 'ID_LOT', refTable: 'T_LOT_OPERATION', refColumn: 'ID_LOT', onDelete: 'SET NULL' },
            { column: 'ID_PIECE', refTable: 'T_PIECE', refColumn: 'ID_PIECE', onDelete: 'CASCADE' },
        ],
    },
    T_DIRECTION: {
        name: 'T_DIRECTION',
        primaryKey: 'ID_DIRECTION',
        columns: [
            { name: 'ID_DIRECTION', type: 'integer' },
            { name: 'PORTEFEUILLE', type: 'text', nullable: false },
            { name: 'INT_PORTEFEUILLE', type: 'text', nullable: false },
            { name: 'ORDONATEUR', type: 'text', nullable: false },
            { name: 'DIRECTION', type: 'text', nullable: false },
            { name: 'ACTION', type: 'text', nullable: false },
            { name: 'INT_ACTION', type: 'text', nullable: false },
            { name: 'SACTION', type: 'text' },
            { name: 'INT_SACTION', type: 'text' },
        ],
    },
    T_PROGRAMME: {
        name: 'T_PROGRAMME',
        primaryKey: 'ID_PROGRAMME',
        columns: [
            { name: 'ID_PROGRAMME', type: 'integer' },
            { name: 'PROGRAMME', type: 'text', nullable: false },
            { name: 'INT_PROGRAMME', type: 'text', nullable: false },
        ],
    },
    T_SPROGRAMME: {
        name: 'T_SPROGRAMME',
        primaryKey: 'ID_SPROGRAMME',
        columns: [
            { name: 'ID_SPROGRAMME', type: 'integer' },
            { name: 'ID_PROGRAMME', type: 'integer', nullable: false },
            { name: 'SPROGRAMME', type: 'text', nullable: false },
            { name: 'INT_SPROGRAMME', type: 'text', nullable: false },
        ],
        foreignKeys: [
            { column: 'ID_PROGRAMME', refTable: 'T_PROGRAMME', refColumn: 'ID_PROGRAMME', onDelete: 'CASCADE' },
        ],
    },
};

// ---------------------------------------------------------------------------
// PostgreSQL / Supabase DDL generator
// ---------------------------------------------------------------------------

const pgType = (t: DialectType): string => {
    switch (t) {
        case 'integer': return 'integer';
        case 'bigint': return 'bigint';
        case 'real': return 'double precision';
        case 'boolean': return 'boolean';
        default: return 'text';
    }
};

const pgColumn = (col: ColumnDef): string => {
    const parts = [col.name, pgType(col.type)];
    if (col.unique) parts.push('UNIQUE');
    if (col.nullable === false) parts.push('NOT NULL');
    if (col.default !== undefined) {
        if (typeof col.default === 'boolean') {
            parts.push(`DEFAULT ${col.default ? 'true' : 'false'}`);
        } else if (typeof col.default === 'number') {
            parts.push(`DEFAULT ${col.default}`);
        } else {
            parts.push(`DEFAULT '${col.default}'::text`);
        }
    }
    if (col.check) parts.push(`CHECK (${col.check})`);
    return parts.join(' ');
};

export const generatePostgresDDL = (): string => {
    const blocks: string[] = [];
    for (const tableName of TABLE_ORDER) {
        const table = TABLES[tableName];
        const colLines = table.columns.map(c => {
            if (c.name === table.primaryKey) {
                // Identity / auto-increment primary key
                return `  ${c.name} ${pgType(c.type)} GENERATED ALWAYS AS IDENTITY NOT NULL`;
            }
            return `  ${pgColumn(c)}`;
        });

        // Primary key constraint
        colLines.push(`  CONSTRAINT ${table.name}_pkey PRIMARY KEY (${table.primaryKey})`);

        // Foreign keys
        for (const fk of table.foreignKeys || []) {
            colLines.push(
                `  CONSTRAINT ${table.name}_${fk.column}_fkey FOREIGN KEY (${fk.column}) REFERENCES public.${fk.refTable}(${fk.refColumn})`
            );
        }

        blocks.push(`CREATE TABLE public.${table.name} (\n${colLines.join(',\n')}\n);`);
    }
    return blocks.join('\n\n');
};

// ---------------------------------------------------------------------------
// SQLite DDL generator
// ---------------------------------------------------------------------------

const sqliteType = (t: DialectType): string => {
    switch (t) {
        case 'integer':
        case 'bigint':
            return 'INTEGER';
        case 'real':
            return 'REAL';
        case 'boolean':
            return 'INTEGER';
        default:
            return 'TEXT';
    }
};

const sqliteColumn = (col: ColumnDef): string => {
    let decl = `${col.name} ${sqliteType(col.type)}`;
    if (col.nullable === false) decl += ' NOT NULL';
    if (col.unique) decl += ' UNIQUE';
    if (col.default !== undefined) {
        if (typeof col.default === 'boolean') {
            decl += ` DEFAULT ${col.default ? 1 : 0}`;
        } else if (typeof col.default === 'number') {
            decl += ` DEFAULT ${col.default}`;
        } else {
            decl += ` DEFAULT '${col.default}'`;
        }
    }
    return decl;
};

export const generateSqliteDDL = (): Record<string, string> => {
    const out: Record<string, string> = {};
    for (const tableName of TABLE_ORDER) {
        const table = TABLES[tableName];
        const lines: string[] = [];

        // Primary key: the first column is the auto-increment integer PK
        const pkColumn = table.columns.find(c => c.name === table.primaryKey)!;
        lines.push(`  ${pkColumn.name} INTEGER PRIMARY KEY AUTOINCREMENT`);

        for (const col of table.columns) {
            if (col.name === table.primaryKey) continue;
            lines.push(`  ${sqliteColumn(col)}`);
        }

        for (const fk of table.foreignKeys || []) {
            const onDelete = fk.onDelete ? ` ON DELETE ${fk.onDelete}` : '';
            lines.push(`  FOREIGN KEY (${fk.column}) REFERENCES ${fk.refTable}(${fk.refColumn})${onDelete}`);
        }

        out[tableName] = `CREATE TABLE IF NOT EXISTS ${table.name} (\n${lines.join(',\n')}\n);`;
    }
    return out;
};

export const generateTableColumnNames = (): Record<string, string[]> => {
    const out: Record<string, string[]> = {};
    for (const tableName of TABLE_ORDER) {
        out[tableName] = TABLES[tableName].columns.map(c => c.name);
    }
    return out;
};

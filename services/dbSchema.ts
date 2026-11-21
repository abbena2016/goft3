// هذا الملف يقوم بتوليد كود SQL لإنشاء الجداول في Supabase (PostgreSQL).
// الجداول والأعمدة مستخرجة من مصدر الحقيقة الوحيد: services/tableSchema.ts
// يرجى نسخ المحتوى أدناه وتشغيله في "SQL Editor" في لوحة تحكم Supabase.
import { generatePostgresDDL } from './tableSchema';

export const createTablesSQL = generatePostgresDDL();

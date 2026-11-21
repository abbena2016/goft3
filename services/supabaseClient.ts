import { createClient } from '@supabase/supabase-js';
import { isNetworkError } from '../context/dataConstants';

const STORED_URL_KEY = 'goft3_supabase_url';
const STORED_KEY_KEY = 'goft3_supabase_key';
// Helper to check URL validity
const isValidUrl = (urlString: string) => {
    try {
        return Boolean(new URL(urlString));
    } catch (e) {
        return false;
    }
};

/**
 * Decodes the payload of a JWT without verifying its signature.
 * Used to inspect the `role` claim of a Supabase key so we can reject
 * `service_role` keys that would escalate privileges past Row Level Security.
 */
export const decodeJwtPayload = (token: string): Record<string, unknown> | null => {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
        const json = decodeURIComponent(escape(atob(padded)));
        return JSON.parse(json) as Record<string, unknown>;
    } catch (e) {
        return null;
    }
};

/**
 * Returns an error message if the key is unsafe to store client-side.
 * A `service_role` key bypasses Row Level Security and must never be kept
 * in localStorage (anyone with it gets full database access).
 */
export const validateSupabaseKey = (key: string): string | null => {
    const trimmed = key.trim();
    if (!trimmed) return 'لا يمكن أن يكون المفتاح فارغاً';
    const payload = decodeJwtPayload(trimmed);
    if (payload && typeof payload.role === 'string') {
        if (payload.role === 'service_role') {
            return 'ممنوع استخدام مفتاح service_role في التطبيق لأنّه يتجاوز القيود الأمنية. استخدم مفتاح anon.';
        }
        return null;
    }
    return 'يبدو أن المفتاح غير صالح (JWT غير مفهوم). تأكد من لصق مفتاح Supabase الصحيح.';
};

// Get config from localStorage
const storedUrl = localStorage.getItem(STORED_URL_KEY);
const storedKey = localStorage.getItem(STORED_KEY_KEY);

export const isConfigured = !!storedUrl && isValidUrl(storedUrl) && !!storedKey;

// Reject unsafe service_role keys at load time, even if previously stored.
const configError = isConfigured ? validateSupabaseKey(storedKey!) : null;

// Export the client if configured, otherwise null. 
// This prevents the "Invalid URL" error during module initialization.
export const supabase = isConfigured && !configError && isValidUrl(storedUrl!)
    ? createClient(storedUrl!, storedKey!)
    : null;

export const saveConfiguration = (url: string, key: string): string | null => {
    const trimmedUrl = url.trim();
    const trimmedKey = key.trim();
    if (!isValidUrl(trimmedUrl)) return 'رابط Supabase غير صالح';
    const err = validateSupabaseKey(trimmedKey);
    if (err) return err;
    localStorage.setItem(STORED_URL_KEY, trimmedUrl);
    localStorage.setItem(STORED_KEY_KEY, trimmedKey);
    window.location.reload();
    return null;
};

export const resetConfiguration = () => {
    localStorage.removeItem(STORED_URL_KEY);
    localStorage.removeItem(STORED_KEY_KEY);
    window.location.reload();
};

/**
 * Performs a lightweight, real request against the Supabase database to verify
 * that the cloud database is actually reachable - not just that the Internet is
 * up. Any server response (including an error) proves the database responds;
 * only a transport-level failure means it is unreachable.
 */
export const checkSupabaseConnection = async (timeoutMs = 8000): Promise<boolean> => {
    if (!supabase) return false;
    try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        const { error } = await supabase
            .from('T_USER')
            .select('ID_USER', { head: true, count: 'exact' })
            .abortSignal(controller.signal);
        clearTimeout(timer);
        return !error || !isNetworkError(error);
    } catch {
        return false;
    }
};

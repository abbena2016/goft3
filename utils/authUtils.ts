import { hash, compare } from 'bcrypt-ts/browser';
import { User } from '../types';

const SALT_ROUNDS = 10;

// Default bootstrap admin (only created on first run). The password is always
// stored as a bcrypt hash — never as plaintext — so a leaked localStorage backup
// cannot be used to log in. The default account is flagged to force a password
// change on first sign-in (see MUST_CHANGE_PASSWORD).
export const DEFAULT_ADMIN_USERNAME = 'admin';
export const DEFAULT_ADMIN_PASSWORD_HASH = '$2b$10$Si2m66JTc2d2i.yRvu2BuuIvyNayWeFFGRbEmO6GVxADXgleTKpK.';

/**
 * Checks whether a user is the creator of a record whose `CREATED_BY`
 * column is textual. The column may hold either the creator's username
 * or their numeric ID (as text), so both are matched.
 */
export const isOperationCreator = (createdBy: string | null | undefined, user: User): boolean => {
    if (!createdBy) return false;
    return createdBy === user.USERNAME || String(createdBy) === String(user.ID_USER);
};

/**
 * Computes legacy SHA-256 hash for backward compatibility.
 */
export async function legacySha256(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Modern secure password hashing using pure TypeScript Bcrypt designed for browser environments.
 */
export async function hashPassword(password: string): Promise<string> {
    return hash(password, SALT_ROUNDS);
}

/**
 * Verifies a password against the stored hash.
 * Supports seamless migration from legacy SHA-256 or plaintext passwords to Bcrypt.
 */
export async function verifyPassword(
    password: string,
    storedHash: string | null | undefined
): Promise<{ valid: boolean; needsRehash: boolean }> {
    if (!storedHash) {
        return { valid: false, needsRehash: false };
    }

    const trimmedHash = storedHash.trim();

    // Check if the hash is a modern Bcrypt hash ($2a$, $2b$, or $2y$)
    const isBcrypt = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(trimmedHash);

    if (isBcrypt) {
        try {
            const isValid = await compare(password, trimmedHash);
            return { valid: isValid, needsRehash: false };
        } catch (e) {
            console.error("Error verifying bcrypt hash:", e);
            return { valid: false, needsRehash: false };
        }
    }

    // Check against legacy SHA-256 hash
    try {
        const legacyHash = await legacySha256(password);
        if (legacyHash === trimmedHash || legacyHash.toLowerCase() === trimmedHash.toLowerCase()) {
            return { valid: true, needsRehash: true };
        }
    } catch (e) {
        console.error("Error calculating legacy SHA-256:", e);
    }

    // Check if stored password happens to be plaintext (e.g. from initial manual DB seeds)
    if (password === trimmedHash) {
        return { valid: true, needsRehash: true };
    }

    return { valid: false, needsRehash: false };
}

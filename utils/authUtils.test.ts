import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword, legacySha256 } from './authUtils';

describe('authUtils', () => {
    it('hashes a password and verifies it', async () => {
        const password = 'securePassword123';
        const hash = await hashPassword(password);
        expect(hash).toBeTruthy();
        const result = await verifyPassword(password, hash);
        expect(result.valid).toBe(true);
        expect(result.needsRehash).toBe(false);
    });

    it('rejects wrong password', async () => {
        const password = 'securePassword123';
        const hash = await hashPassword(password);
        const result = await verifyPassword('wrong', hash);
        expect(result.valid).toBe(false);
    });

    it('returns invalid for null/undefined stored hash', async () => {
        const result = await verifyPassword('anything', null);
        expect(result.valid).toBe(false);
        expect(result.needsRehash).toBe(false);
    });

    it('migrates legacy SHA-256 hash with needsRehash=true', async () => {
        const legacy = await legacySha256('legacyPass');
        const result = await verifyPassword('legacyPass', legacy);
        expect(result.valid).toBe(true);
        expect(result.needsRehash).toBe(true);
    });

    it('migrates plaintext password with needsRehash=true', async () => {
        const result = await verifyPassword('plaintext', 'plaintext');
        expect(result.valid).toBe(true);
        expect(result.needsRehash).toBe(true);
    });
});

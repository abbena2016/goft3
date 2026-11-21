import { describe, it, expect } from 'vitest';

// Reproduces the exact published version.json (malformed: the download URL is a
// bare string, not a key:value pair).
const MALFORMED_MANIFEST = `{
  "version": "1.1.1",
  "https://github.com/abdelben2025/goft3/releases/download/1.1.1/GOFT3_1.1.1_x64-setup.exe"
}`;

const WELLFORMED_MANIFEST = `{
  "version": "1.1.1",
  "downloadUrl": "https://github.com/abdelben2025/goft3/releases/download/v1.1.1/GOFT3_1.1.1_x64-setup.exe"
}`;

const parseManifest = (rawText: string): { version?: string; downloadUrl?: string } => {
    let rawData: any = null;
    try {
        rawData = JSON.parse(rawText);
    } catch {
        rawData = null;
    }

    let version: string | undefined;
    let downloadUrl: string | undefined;

    if (rawData && typeof rawData === 'object') {
        version = rawData.version;
        downloadUrl = rawData.downloadUrl;
        if (!downloadUrl) {
            const urlKey = Object.keys(rawData).find(k => /^https?:\/\//i.test(k));
            if (urlKey) downloadUrl = urlKey;
        }
    }

    if (!version) {
        const vMatch = rawText.match(/"version"\s*:\s*"([^"]+)"/);
        if (vMatch) version = vMatch[1];
    }
    if (!downloadUrl) {
        const urlMatch = rawText.match(/https?:\/\/[^\s"',}\]]+/);
        if (urlMatch) downloadUrl = urlMatch[0];
    }

    return { version, downloadUrl };
};

describe('update manifest parsing', () => {
    it('handles the malformed manifest (bare URL string)', () => {
        const { version, downloadUrl } = parseManifest(MALFORMED_MANIFEST);
        expect(version).toBe('1.1.1');
        expect(downloadUrl).toContain('GOFT3_1.1.1_x64-setup.exe');
    });

    it('handles a well-formed manifest', () => {
        const { version, downloadUrl } = parseManifest(WELLFORMED_MANIFEST);
        expect(version).toBe('1.1.1');
        expect(downloadUrl).toContain('GOFT3_1.1.1_x64-setup.exe');
    });
});

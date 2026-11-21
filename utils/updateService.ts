
import { APP_VERSION } from '../types';

const VERSION_CHECK_URL = 'https://raw.githubusercontent.com/abdelben2025/goft3/main/version.json';
const RELEASES_BASE = 'https://github.com/abdelben2025/goft3/releases/download';

export interface UpdateInfo {
    hasUpdate: boolean;
    latestVersion: string;
    downloadUrl: string;
}

// Builds the expected release asset URL for the current platform.
// The GitHub release for a version `1.1.1` ships a Windows installer named
// `GOFT3_1.1.1_x64-setup.exe`. We fall back to this deterministic URL when the
// remote version.json does not provide a `downloadUrl`.
const buildDefaultDownloadUrl = (version: string): string => {
    const normalized = version.startsWith('v') ? version : 'v' + version;
    return `${RELEASES_BASE}/${normalized}/GOFT3_${version}_x64-setup.exe`;
};

// version.json is sometimes published with the download URL as a bare JSON key
// instead of a `downloadUrl` property (the file is hand-maintained). Parse it
// tolerantly so we can recover the installer link in either format.
const parseVersionPayload = (data: any): { version?: string; downloadUrl?: string } => {
    let version = data?.version;
    let downloadUrl: string | undefined = data?.downloadUrl;

    // Fallback: if any key looks like a URL, use it as the download link.
    if (!downloadUrl && data && typeof data === 'object') {
        const urlKey = Object.keys(data).find(k => /^https?:\/\//i.test(k));
        if (urlKey) downloadUrl = urlKey;
    }

    return { version, downloadUrl };
};

export const checkForUpdates = async (): Promise<UpdateInfo | null> => {
    // 1. Check for offline status immediately
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
        console.log("App is offline: Skipping update check.");
        return null;
    }

    try {
        const controller = new AbortController();
        // 5 second timeout to prevent hanging on slow connections
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(VERSION_CHECK_URL + '?t=' + Date.now(), {
            cache: 'no-store',
            mode: 'cors',
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            // Log as warning, not error, to avoid cluttering console
            console.warn(`Update check server unavailable (${response.status})`);
            return null;
        }

        const rawText = await response.text();

        // Parse the manifest. The published version.json is occasionally malformed
        // (e.g. the download URL appears as a bare string instead of a key:value
        // pair), which makes JSON.parse throw. We therefore try JSON first and
        // fall back to a tolerant text/regex extraction so the check never fails
        // just because the remote file is slightly broken.
        let rawData: any = null;
        try {
            rawData = JSON.parse(rawText);
        } catch {
            rawData = null;
        }

        let latestVersion: string | undefined;
        let downloadUrl: string | undefined;

        if (rawData && typeof rawData === 'object') {
            const parsed = parseVersionPayload(rawData);
            latestVersion = parsed.version;
            downloadUrl = parsed.downloadUrl;
        }

        // Tolerant text fallback: pull the version number and the first https URL.
        if (!latestVersion) {
            const vMatch = rawText.match(/"version"\s*:\s*"([^"]+)"/);
            if (vMatch) latestVersion = vMatch[1];
        }
        if (!downloadUrl) {
            const urlMatch = rawText.match(/https?:\/\/[^\s"',}\]]+/);
            if (urlMatch) downloadUrl = urlMatch[0];
        }

        // Function to compare version strings (simple semver-like comparison)
        const isNewer = (vLatest: string, vCurrent: string) => {
            const latestParts = vLatest.split('.').map(Number);
            const currentParts = vCurrent.split('.').map(Number);

            for (let i = 0; i < Math.max(latestParts.length, currentParts.length); i++) {
                const latest = latestParts[i] || 0;
                const current = currentParts[i] || 0;
                if (latest > current) return true;
                if (latest < current) return false;
            }
            return false;
        };

        if (latestVersion && isNewer(latestVersion, APP_VERSION)) {
            const resolvedDownloadUrl = downloadUrl || buildDefaultDownloadUrl(latestVersion);
            return {
                hasUpdate: true,
                latestVersion,
                downloadUrl: resolvedDownloadUrl
            };
        }

        return {
            hasUpdate: false,
            latestVersion: APP_VERSION,
            downloadUrl: ''
        };
    } catch (error) {
        // Graceful error handling for network issues
        console.warn("Update check skipped (Network/Fetch Error).", error);
        return null;
    }
};

export const performUpdate = (url: string) => {
    // Prefer the OS default browser over an in-app popup so the installer can be
    // downloaded reliably. Falls back to opening a new tab if unavailable.
    const w = window as any;
    if (w.electron?.ipcRenderer?.send || navigator.userAgent.includes('Tauri')) {
        try {
            window.open(url, '_blank', 'noopener,noreferrer');
            return;
        } catch {
            // fall through
        }
    }
    window.open(url, '_blank');
};

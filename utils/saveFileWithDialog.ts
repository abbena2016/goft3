// Saves a Blob to disk showing a native save dialog when the platform supports it
// (File System Access API in Chromium/WebView2/Electron). Falls back to a normal
// browser download otherwise.

interface SaveFilePickerOptions {
    suggestedName?: string;
    types?: {
        description?: string;
        accept: Record<string, string[]>;
    }[];
}

declare global {
    interface Window {
        showSaveFilePicker?: (options?: SaveFilePickerOptions) => Promise<{
            createWritable: () => Promise<{
                write: (data: Blob) => Promise<void>;
                close: () => Promise<void>;
            }>;
        }>;
    }
}

export async function saveFileWithDialog(blob: Blob, suggestedName: string): Promise<void> {
    const picker = window.showSaveFilePicker;

    if (typeof picker === 'function') {
        try {
            const handle = await picker({ suggestedName });
            const writable = await handle.createWritable();
            await writable.write(blob);
            await writable.close();
            return;
        } catch (e: any) {
            // Ignore user cancellation
            if (e && e.name === 'AbortError') return;
            // Otherwise fall through to the browser download fallback
            console.warn('Save dialog failed, falling back to download', e);
        }
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = suggestedName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

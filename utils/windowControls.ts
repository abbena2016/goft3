import { getCurrentWindow } from '@tauri-apps/api/window';
import { PhysicalSize } from '@tauri-apps/api/dpi';

const isTauriRuntime = (): boolean => {
    if (typeof window === 'undefined') return false;
    const w = window as any;
    return !!w.__TAURI_INTERNALS__ || !!w.__TAURI__ || navigator.userAgent.includes('Tauri');
};

export const isTauri = isTauriRuntime;

export const minimizeWindow = async (): Promise<void> => {
    if (!isTauriRuntime()) return;
    try {
        await getCurrentWindow().minimize();
    } catch (e) {
        console.warn('minimize failed', e);
    }
};

export const toggleMaximizeWindow = async (): Promise<void> => {
    if (!isTauriRuntime()) return;
    try {
        await getCurrentWindow().toggleMaximize();
    } catch (e) {
        console.warn('toggleMaximize failed', e);
    }
};

export const isMaximized = async (): Promise<boolean> => {
    if (!isTauriRuntime()) return false;
    try {
        return await getCurrentWindow().isMaximized();
    } catch {
        return false;
    }
};

export const setWindowSize = async (width: number, height: number): Promise<void> => {
    if (!isTauriRuntime()) return;
    try {
        const win = getCurrentWindow();
        await win.setSize(new PhysicalSize(width, height));
        await win.center();
    } catch (e) {
        console.warn('setSize failed', e);
    }
};

export const showWindow = async (): Promise<void> => {
    if (!isTauriRuntime()) return;
    try {
        await getCurrentWindow().show();
    } catch (e) {
        console.warn('show failed', e);
    }
};

export const closeWindow = async (): Promise<void> => {
    const w = window as any;
    // 1. Electron IPC
    if (w.electron?.ipcRenderer?.send) {
        w.electron.ipcRenderer.send('app:quit');
        return;
    }
    // 2. Tauri : destroy puis close (fonctionne même sans décorations)
    if (isTauriRuntime()) {
        try {
            await getCurrentWindow().destroy();
            return;
        } catch {
            // fallthrough
        }
        try {
            await getCurrentWindow().close();
            return;
        } catch {
            // fallthrough
        }
    }
    // 3. Navigateur
    window.close();
};

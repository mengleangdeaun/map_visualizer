import { create } from 'zustand';

export type PwaToastType = 'success' | 'error' | 'info' | 'warning';

export interface PwaToastConfig {
    id: string;
    message: string;
    description?: string;
    type: PwaToastType;
    duration?: number;
}

interface PwaToastState {
    activeToast: PwaToastConfig | null;
    show: (message: string, type: PwaToastType, options?: Omit<PwaToastConfig, 'id' | 'message' | 'type'>) => void;
    dismiss: () => void;
}

export const usePwaToastStore = create<PwaToastState>((set) => ({
    activeToast: null,
    show: (message, type, options = {}) => {
        const id = Math.random().toString(36).substring(2, 9);
        set({
            activeToast: {
                id,
                message,
                type,
                duration: options.duration ?? 3500,
                description: options.description,
            },
        });
    },
    dismiss: () => set({ activeToast: null }),
}));

// Clean, global developer helper object similar to sonner's toast
export const pwaToast = {
    success: (message: string, options?: Omit<PwaToastConfig, 'id' | 'message' | 'type'>) => {
        usePwaToastStore.getState().show(message, 'success', options);
    },
    error: (message: string, options?: Omit<PwaToastConfig, 'id' | 'message' | 'type'>) => {
        usePwaToastStore.getState().show(message, 'error', options);
    },
    info: (message: string, options?: Omit<PwaToastConfig, 'id' | 'message' | 'type'>) => {
        usePwaToastStore.getState().show(message, 'info', options);
    },
    warning: (message: string, options?: Omit<PwaToastConfig, 'id' | 'message' | 'type'>) => {
        usePwaToastStore.getState().show(message, 'warning', options);
    },
    dismiss: () => {
        usePwaToastStore.getState().dismiss();
    },
};

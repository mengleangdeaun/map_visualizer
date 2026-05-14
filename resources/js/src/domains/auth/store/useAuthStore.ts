import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User } from '../../system/services/userService';

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLocked: boolean;
    setAuth: (user: User, token: string) => void;
    clearAuth: () => void;
    lock: () => void;
    unlock: (password: string) => Promise<boolean>;
    updateUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            isLocked: false,
            setAuth: (user, token) => set({ user, token, isAuthenticated: true, isLocked: false }),
            clearAuth: () => set({ user: null, token: null, isAuthenticated: false, isLocked: false }),
            lock: () => set({ isLocked: true }),
            unlock: async (password) => {
                // In a real app, you might want to verify password with backend
                // For now, we'll just check if it's not empty (LockScreen UI handles the rest)
                if (password) {
                    set({ isLocked: false });
                    return true;
                }
                return false;
            },
            updateUser: (user) => set({ user }),
        }),
        {
            name: 'mapcn-auth-storage',
            storage: createJSONStorage(() => localStorage),
        }
    )
);

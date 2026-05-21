import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface NavigationState {
    activeNavTask: any | null;
    activeNavRoute: any | null;
    activeNavLeg: 'pickup' | 'dropoff';
}

interface NavigationStore extends NavigationState {
    setActiveNavTask: (task: any | null) => void;
    setActiveNavRoute: (route: any | null) => void;
    setActiveNavLeg: (leg: 'pickup' | 'dropoff') => void;
    clearNavigation: () => void;
}

export const useNavigationStore = create<NavigationStore>()(
    persist(
        (set) => ({
            activeNavTask: null,
            activeNavRoute: null,
            activeNavLeg: 'pickup',
            setActiveNavTask: (task) => set({ activeNavTask: task }),
            setActiveNavRoute: (route) => set({ activeNavRoute: route }),
            setActiveNavLeg: (leg) => set({ activeNavLeg: leg }),
            clearNavigation: () => set({ activeNavTask: null, activeNavRoute: null, activeNavLeg: 'pickup' }),
        }),
        {
            name: 'driver-navigation-storage', // key used in localStorage
        }
    )
);

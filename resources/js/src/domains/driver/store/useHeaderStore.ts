import { create } from 'zustand';
import React from 'react';

interface HeaderConfig {
    title?: string;
    showBackButton?: boolean;
    backTarget?: string;
    rightAction?: React.ReactNode;
}

interface HeaderState {
    config: HeaderConfig;
    setHeader: (config: HeaderConfig) => void;
    resetHeader: () => void;
}

export const useHeaderStore = create<HeaderState>((set) => ({
    config: {},
    setHeader: (config) => set({ config }),
    resetHeader: () => set({ config: {} })
}));

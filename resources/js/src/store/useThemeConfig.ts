import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import i18next from 'i18next';
import themeConfig from '../theme.config';

interface ThemeConfigState {
    theme: string;
    menu: string;
    layout: string;
    rtlClass: string;
    animation: string;
    navbar: string;
    locale: string;
    sidebar: boolean;
    semidark: boolean;
    isDarkMode: boolean;
    languageList: { code: string; name: string }[];
    
    // Actions
    toggleTheme: (theme?: string) => void;
    toggleMenu: (menu?: string) => void;
    toggleLayout: (layout?: string) => void;
    toggleRTL: (rtl?: string) => void;
    toggleAnimation: (animation?: string) => void;
    toggleNavbar: (navbar?: string) => void;
    toggleSemidark: (semidark?: boolean | string) => void;
    toggleLocale: (locale?: string) => void;
    toggleSidebar: () => void;
    setPageTitle: (title: string) => void;
}

const useThemeConfig = create<ThemeConfigState>()(
    persist(
        (set, get) => ({
            theme: themeConfig.theme,
            menu: themeConfig.menu,
            layout: themeConfig.layout,
            rtlClass: themeConfig.rtlClass,
            animation: themeConfig.animation,
            navbar: themeConfig.navbar,
            locale: themeConfig.locale,
            sidebar: false,
            semidark: themeConfig.semidark,
            isDarkMode: false,
            languageList: [
                { code: 'kh', name: 'Khmer' },
                { code: 'en', name: 'English' },
                { code: 'zh', name: 'Chinese' },
            ],

            toggleTheme: (theme) => {
                const currentTheme = theme || get().theme;
                let isDarkMode = false;
                if (currentTheme === 'light') {
                    isDarkMode = false;
                } else if (currentTheme === 'dark') {
                    isDarkMode = true;
                } else if (currentTheme === 'system') {
                    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                        isDarkMode = true;
                    } else {
                        isDarkMode = false;
                    }
                }

                if (isDarkMode) {
                    document.documentElement.classList.add('dark');
                } else {
                    document.documentElement.classList.remove('dark');
                }

                set({ theme: currentTheme, isDarkMode });
            },

            toggleMenu: (menu) => {
                const currentMenu = menu || get().menu;
                set({ menu: currentMenu, sidebar: false });
            },

            toggleLayout: (layout) => {
                set({ layout: layout || get().layout });
            },

            toggleRTL: (rtl) => {
                const currentRtl = rtl || get().rtlClass;
                set({ rtlClass: currentRtl });
                document.querySelector('html')?.setAttribute('dir', currentRtl || 'ltr');
            },

            toggleAnimation: (animation) => {
                set({ animation: (animation || get().animation)?.trim() });
            },

            toggleNavbar: (navbar) => {
                set({ navbar: navbar || get().navbar });
            },

            toggleSemidark: (semidark) => {
                const val = semidark === true || semidark === 'true' ? true : false;
                set({ semidark: val });
            },

            toggleLocale: (locale) => {
                const currentLocale = locale || get().locale;
                i18next.changeLanguage(currentLocale);
                set({ locale: currentLocale });
            },

            toggleSidebar: () => {
                set((state) => ({ sidebar: !state.sidebar }));
            },

            setPageTitle: (title) => {
                document.title = `${title} | SCCG `;
            },
        }),
        {
            name: 'theme-config',
            partialize: (state) => ({
                theme: state.theme,
                menu: state.menu,
                layout: state.layout,
                rtlClass: state.rtlClass,
                animation: state.animation,
                navbar: state.navbar,
                locale: state.locale,
                semidark: state.semidark,
            }),
        }
    )
);

export default useThemeConfig;

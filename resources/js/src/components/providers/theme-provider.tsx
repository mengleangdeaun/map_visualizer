import useThemeConfig from '../../store/useThemeConfig';

export const useTheme = () => {
    const themeConfig = useThemeConfig();
    return {
        theme: themeConfig.theme,
        setTheme: themeConfig.toggleTheme,
    };
};

import { PropsWithChildren, useEffect } from 'react';
import useThemeConfig from './store/useThemeConfig';

function App({ children }: PropsWithChildren) {
    const themeConfig = useThemeConfig();

    useEffect(() => {
        // Apply side effects on mount
        themeConfig.toggleTheme(themeConfig.theme);
        themeConfig.toggleRTL(themeConfig.rtlClass);
        themeConfig.toggleLocale(themeConfig.locale);
    }, []);

    return (
        <div
            className={`${(themeConfig.sidebar && 'toggle-sidebar') || ''} ${themeConfig.menu} ${themeConfig.layout} ${
                themeConfig.rtlClass
            } main-section antialiased relative font-sans text-sm font-normal`}
        >
            {children}
        </div>
    );
}

export default App;

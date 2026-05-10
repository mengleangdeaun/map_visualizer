import PerfectScrollbar from 'react-perfect-scrollbar';
import { useTranslation } from 'react-i18next';
import useThemeConfig from '../../store/useThemeConfig';
import { Link, useLocation } from '@tanstack/react-router';
import AnimateHeight from 'react-animate-height';
import { useState, useEffect } from 'react';
import { adminNav } from '@/domains/admin/nav';
import { systemNav } from '@/domains/system/nav';
import { MenuItem } from '@/types/nav';
import { ChevronRight } from 'lucide-react';

const Sidebar = () => {
    const [currentMenu, setCurrentMenu] = useState<string>('');
    const themeConfig = useThemeConfig();
    const semidark = themeConfig.semidark;
    const location = useLocation();
    const { t } = useTranslation('sidebar');

    const toggleMenu = (value: string) => {
        setCurrentMenu((oldValue) => (oldValue === value ? '' : value));
    };

    useEffect(() => {
        const activePath = location.pathname;
        
        // Combine all nav items to find the parent of the active path
        const allNavItems = [...adminNav, ...systemNav];
        
        const findActiveParent = (items: MenuItem[]): string | null => {
            for (const item of items) {
                if (item.children) {
                    const hasActiveChild = item.children.some(child => 
                        child.path === activePath || (child.path !== '/' && activePath.startsWith(child.path ?? ''))
                    );
                    if (hasActiveChild) return item.id;
                }
                if (item.path === activePath) return item.id;
            }
            return null;
        };

        const activeParentId = findActiveParent(allNavItems);
        if (activeParentId) {
            setCurrentMenu(activeParentId);
        }
    }, [location.pathname]);

    useEffect(() => {
        if (window.innerWidth < 1024 && themeConfig.sidebar) {
            themeConfig.toggleSidebar();
        }
    }, [location]);

    const renderNavItems = (items: MenuItem[]) => {
        return items.map((item) => {
            const Icon = item.icon;
            const hasChildren = item.children && item.children.length > 0;

            if (hasChildren) {
                return (
                    <li key={item.id} className="menu nav-item pt-2">
                        <button 
                            type="button" 
                            className={`${currentMenu === item.id ? 'active' : ''} nav-link group w-full`} 
                            onClick={() => toggleMenu(item.id)}
                        >
                            <div className="flex items-center">
                                {Icon && <Icon className="group-hover:!text-primary shrink-0 size-5" />}
                                <span className="ltr:pl-3 rtl:pr-3">{t(item.title)}</span>
                            </div>

                            <div className={currentMenu === item.id ? 'rotate-90' : 'rtl:rotate-180'}>
                                <ChevronRight className="size-4" />
                            </div>
                        </button>

                        <AnimateHeight duration={300} height={currentMenu === item.id ? 'auto' : 0}>
                            <ul className="sub-menu text-gray-500">
                                {item.children?.map((child) => (
                                    <li key={child.id}>
                                        <Link 
                                            activeProps={{ className: 'active' }} 
                                            activeOptions={{ exact: child.path === '/' }}
                                            to={child.path as any}
                                        >
                                            {t(child.title)}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </AnimateHeight>
                    </li>
                );
            }

            return (
                <li key={item.id} className="menu nav-item pt-2">
                    <Link 
                        to={item.path as any} 
                        activeProps={{ className: 'active' }}
                        className="group"
                    >
                        <div className="flex items-center">
                            {Icon && <Icon className="group-hover:!text-primary shrink-0 size-5" />}
                            <span className="ltr:pl-3 rtl:pr-3">{t(item.title)}</span>
                        </div>
                    </Link>
                </li>
            );
        });
    };

    return (
        <div className={semidark ? 'dark' : ''}>
            <nav className={`sidebar fixed min-h-screen h-full top-0 bottom-0 w-[260px] border border-r z-50 transition-all duration-300 ${semidark ? 'text-muted-foreground' : ''}`}>
                <div className="bg-background h-full">
                    <div className="flex justify-between items-center px-4 py-3">
                        <Link to="/" className="main-logo flex items-center shrink-0">
                            <img className="w-12 ml-[5px] flex-none" src="/assets/images/logo.svg" alt="logo" />
                        </Link>

                        <button
                            type="button"
                            className="collapse-icon w-8 h-8 rounded-full flex items-center hover:bg-accent transition duration-300 rtl:rotate-180"
                            onClick={() => themeConfig.toggleSidebar()}
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 m-auto">
                                <path d="M13 19L7 12L13 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                <path opacity="0.5" d="M16.9998 19L10.9998 12L16.9998 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                    </div>
                    
                    <PerfectScrollbar className="h-[calc(100vh-80px)] relative">
                        <ul className="relative font-semibold space-y-0.5 p-4 py-0">
                            {/* Admin Section */}
                            <h2 className="px-4 py-2 text-[11px] font-bold text-muted-foreground/60 tracking-wider border-b border-border/50">
                                <span>{t('admin_domain')}</span>
                            </h2>
                            {renderNavItems(adminNav)}

                            {/* System Section */}
                            <h2 className="px-4 py-2 mt-6 text-[11px] font-bold text-muted-foreground/60 tracking-wider border-b border-border/50">
                                <span>{t('system_domain')}</span>
                            </h2>
                            {renderNavItems(systemNav)}
                        </ul>
                    </PerfectScrollbar>
                </div>
            </nav>
        </div>
    );
};

export default Sidebar;

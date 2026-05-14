import { useEffect, useState } from 'react';
import useThemeConfig from '../../store/useThemeConfig';
import { Link, useLocation, useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import i18next from 'i18next';
import { useAuthStore } from '../../domains/auth/store/useAuthStore';
import { authService } from '../../domains/auth/services/authService';
import { toast } from 'sonner';
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuLabel, 
    DropdownMenuSeparator, 
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
    DropdownMenuGroup
} from '@/components/ui/dropdown-menu';
import SettingsContent from './SettingsContent';
import { 
    User, 
    Mail, 
    Lock, 
    LogOut, 
    Bell, 
    MessageSquare, 
    Settings, 
    ChevronDown, 
    Search, 
    X, 
    Sun, 
    Moon, 
    Laptop,
    Globe
} from 'lucide-react';

const Header = () => {
    const { user, clearAuth, lock } = useAuthStore();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await authService.logout();
        } catch (error) {
            // Silently fail if session already expired
        }
        clearAuth();
        navigate({ to: '/auth/login' });
        toast.success(t('logged_out_successfully', { ns: 'auth' }));
    };

    const handleLock = () => {
        lock();
        navigate({ to: '/auth/lockscreen' });
    };

    const themeConfig = useThemeConfig();
    const isRtl = themeConfig.rtlClass === 'rtl';

    function createMarkup(messages: any) {
        return { __html: messages };
    }
    const [search, setSearch] = useState(false);

    const setLocale = (flag: string) => {
        setFlag(flag);
        if (flag.toLowerCase() === 'ae') {
            themeConfig.toggleRTL('rtl');
        } else {
            themeConfig.toggleRTL('ltr');
        }
    };
    const [flag, setFlag] = useState(themeConfig.locale);

    const { t } = useTranslation();

    return (
        <header className={`z-40 ${themeConfig.semidark && themeConfig.menu === 'horizontal' ? 'dark' : ''}`}>
            <div>
                <div className="relative bg-card flex w-full items-center px-5 py-2.5">
                    <div className="horizontal-logo flex lg:hidden justify-between items-center ltr:mr-2 rtl:ml-2">
                        <Link activeProps={{ className: 'active' }} to="/" className="main-logo flex items-center shrink-0">
                            <img className="w-12 ltr:-ml-1 rtl:-mr-1 inline" src="/assets/images/logo.svg" alt="logo" />
                        </Link>
                        <button
                            type="button"
                            className="collapse-icon flex-none text-muted-foreground hover:text-primary flex lg:hidden ltr:ml-2 rtl:mr-2 p-2 rounded-full bg-accent/40 hover:bg-accent"
                            onClick={() => {
                                themeConfig.toggleSidebar();
                            }}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M20 7L4 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                <path opacity="0.5" d="M20 12L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                <path d="M20 17L4 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                        </button>
                    </div>

                    <div className="sm:flex-1 ltr:sm:ml-0 ltr:ml-auto sm:rtl:mr-0 rtl:mr-auto flex items-center space-x-1.5 lg:space-x-2 rtl:space-x-reverse text-muted-foreground">
                        <div className="sm:ltr:mr-auto sm:rtl:ml-auto">
                            <form
                                className={`${search && '!block'} sm:relative absolute inset-x-0 sm:top-0 top-1/2 sm:translate-y-0 -translate-y-1/2 sm:mx-0 mx-4 z-10 sm:block hidden`}
                                onSubmit={() => setSearch(false)}
                            >
                                <div className="relative">
                                    <input
                                        type="text"
                                        className="form-input ltr:pl-9 rtl:pr-9 ltr:sm:pr-4 rtl:sm:pl-4 ltr:pr-9 rtl:pl-9 peer sm:bg-transparent bg-secondary placeholder:tracking-widest border-none"
                                        placeholder="Search..."
                                    />
                                    <button type="button" className="absolute w-9 h-9 inset-0 ltr:right-auto rtl:left-auto appearance-none peer-focus:text-primary">
                                        <svg className="mx-auto" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <circle cx="11.5" cy="11.5" r="9.5" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
                                            <path d="M18.5 18.5L22 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                        </svg>
                                    </button>
                                    <button type="button" className="hover:opacity-80 sm:hidden block absolute top-1/2 -translate-y-1/2 ltr:right-2 rtl:left-2" onClick={() => setSearch(false)}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <circle opacity="0.5" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
                                            <path d="M14.5 9.50002L9.5 14.5M9.49998 9.5L14.5 14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                        </svg>
                                    </button>
                                </div>
                            </form>
                            <button
                                type="button"
                                onClick={() => setSearch(!search)}
                                className="search_btn sm:hidden p-2 rounded-full bg-accent/40 hover:bg-accent"
                            >
                                <svg className="w-4.5 h-4.5 mx-auto dark:text-[#d0d2d6]" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="11.5" cy="11.5" r="9.5" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
                                    <path d="M18.5 18.5L22 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                </svg>
                            </button>
                        </div>
                        <div>
                            {themeConfig.theme === 'light' ? (
                                <button
                                    className={`${
                                        themeConfig.theme === 'light' &&
                                        'flex items-center p-2 rounded-full bg-accent/40 hover:text-primary hover:bg-accent'
                                    }`}
                                    onClick={() => {
                                        themeConfig.toggleTheme('dark');
                                    }}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.5" />
                                        <path d="M12 2V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                        <path d="M12 20V22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                        <path d="M4 12L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                        <path d="M22 12L20 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                        <path opacity="0.5" d="M19.7778 4.22266L17.5558 6.25424" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                        <path opacity="0.5" d="M4.22217 4.22266L6.44418 6.25424" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                        <path opacity="0.5" d="M6.44434 17.5557L4.22211 19.7779" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                        <path opacity="0.5" d="M19.7778 19.7773L17.5558 17.5551" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                    </svg>
                                </button>
                            ) : (
                                ''
                            )}
                            {themeConfig.theme === 'dark' && (
                                <button
                                    className={`${
                                        themeConfig.theme === 'dark' &&
                                        'flex items-center p-2 rounded-full bg-accent/40 hover:text-primary hover:bg-accent'
                                    }`}
                                    onClick={() => {
                                        themeConfig.toggleTheme('system');
                                    }}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path
                                            d="M21.0672 11.8568L20.4253 11.469L21.0672 11.8568ZM12.1432 2.93276L11.7553 2.29085V2.29085L12.1432 2.93276ZM21.25 12C21.25 17.1086 17.1086 21.25 12 21.25V22.75C17.9371 22.75 22.75 17.9371 22.75 12H21.25ZM12 21.25C6.89137 21.25 2.75 17.1086 2.75 12H1.25C1.25 17.9371 6.06294 22.75 12 22.75V21.25ZM2.75 12C2.75 6.89137 6.89137 2.75 12 2.75V1.25C6.06294 1.25 1.25 6.06294 1.25 12H2.75ZM15.5 14.25C12.3244 14.25 9.75 11.6756 9.75 8.5H8.25C8.25 12.5041 11.4959 15.75 15.5 15.75V14.25ZM20.4253 11.469C19.4172 13.1373 17.5882 14.25 15.5 14.25V15.75C18.1349 15.75 20.4407 14.3439 21.7092 12.2447L20.4253 11.469ZM9.75 8.5C9.75 6.41182 10.8627 4.5828 12.531 3.57467L11.7553 2.29085C9.65609 3.5593 8.25 5.86509 8.25 8.5H9.75ZM12 2.75C11.9115 2.75 11.8077 2.71008 11.7324 2.63168C11.6686 2.56527 11.6538 2.50244 11.6503 2.47703C11.6461 2.44587 11.6482 2.35557 11.7553 2.29085L12.531 3.57467C13.0342 3.27065 13.196 2.71398 13.1368 2.27627C13.0754 1.82126 12.7166 1.25 12 1.25V2.75ZM21.7092 12.2447C21.6444 12.3518 21.5541 12.3539 21.523 12.3497C21.4976 12.3462 21.4347 12.3314 21.3683 12.2676C21.2899 12.1923 21.25 12.0885 21.25 12H22.75C22.75 11.2834 22.1787 10.9246 21.7237 10.8632C21.286 10.804 20.7293 10.9658 20.4253 11.469L21.7092 12.2447Z"
                                            fill="currentColor"
                                        />
                                    </svg>
                                </button>
                            )}
                            {themeConfig.theme === 'system' && (
                                <button
                                    className={`${
                                        themeConfig.theme === 'system' &&
                                        'flex items-center p-2 rounded-full bg-accent/40 hover:text-primary hover:bg-accent'
                                    }`}
                                    onClick={() => {
                                        themeConfig.toggleTheme('light');
                                    }}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path
                                            d="M3 9C3 6.17157 3 4.75736 3.87868 3.87868C4.75736 3 6.17157 3 9 3H15C17.8284 3 19.2426 3 20.1213 3.87868C21 4.75736 21 6.17157 21 9V14C21 15.8856 21 16.8284 20.4142 17.4142C19.8284 18 18.8856 18 17 18H7C5.11438 18 4.17157 18 3.58579 17.4142C3 16.8284 3 15.8856 3 14V9Z"
                                            stroke="currentColor"
                                            strokeWidth="1.5"
                                        />
                                        <path opacity="0.5" d="M22 21H2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                        <path opacity="0.5" d="M15 15H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                    </svg>
                                </button>
                            )}
                        </div>
                        <div className="shrink-0">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button
                                        type="button"
                                        className="block p-2 rounded-full bg-accent/40 hover:text-primary hover:bg-accent transition-colors"
                                    >
                                        <img className="w-5 h-5 object-cover rounded-full" src={`/assets/images/flags/${flag.toUpperCase()}.svg`} alt="flag" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align={isRtl ? "start" : "end"} className="w-[200px] p-2">
                                    <DropdownMenuLabel className="flex items-center gap-2">
                                        <Globe className="size-4" /> {t('Select Language')}
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <div className="flex flex-col gap-1">
                                        {themeConfig.languageList.map((item: any) => (
                                            <DropdownMenuItem
                                                key={item.code}
                                                className={`flex items-center gap-3 cursor-pointer ${i18next.language === item.code ? 'bg-primary/10 text-primary focus:bg-primary/20 focus:text-primary' : ''}`}
                                                onClick={() => {
                                                    i18next.changeLanguage(item.code);
                                                    setLocale(item.code);
                                                }}
                                            >
                                                <img src={`/assets/images/flags/${item.code.toUpperCase()}.svg`} alt="flag" className="w-5 h-5 object-cover rounded-full" />
                                                <span className="font-medium">{item.name}</span>
                                            </DropdownMenuItem>
                                        ))}
                                    </div>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        <div className="shrink-0">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button
                                        type="button"
                                        className="block p-2 rounded-full bg-accent/40 hover:text-primary hover:bg-accent transition-colors"
                                    >
                                        <MessageSquare className="size-5" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align={isRtl ? "start" : "end"} className="w-[200px] p-4 text-center">
                                    <div className="flex flex-col items-center gap-2 py-2">
                                        <MessageSquare className="size-8 opacity-20 text-primary" />
                                        <p className="text-sm font-medium">Coming Soon</p>
                                        <p className="text-[10px] text-muted-foreground">Messaging system is currently in development.</p>
                                    </div>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        <div className="shrink-0">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button
                                        type="button"
                                        className="relative block p-2 rounded-full bg-accent/40 hover:text-primary hover:bg-accent transition-colors"
                                    >
                                        <Bell className="size-5" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align={isRtl ? "start" : "end"} className="w-[200px] p-4 text-center">
                                    <div className="flex flex-col items-center gap-2 py-2">
                                        <Bell className="size-8 opacity-20 text-primary" />
                                        <p className="text-sm font-medium">Coming Soon</p>
                                        <p className="text-[10px] text-muted-foreground">Notifications are currently in development.</p>
                                    </div>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        <div className="shrink-0 flex">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button
                                        type="button"
                                        className="relative group block rounded-full focus:outline-none"
                                    >
                                        <img className="w-9 h-9 rounded-full object-cover saturate-50 group-hover:saturate-100 transition-all border-2 border-transparent group-hover:border-primary/30" src="/assets/images/user-profile.jpeg" alt="userProfile" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align={isRtl ? "start" : "end"} className="w-[240px] p-1">
                                    <div className="flex items-center px-4 py-4 gap-3 border-b mb-1">
                                        <img className="rounded-md w-10 h-10 object-cover" src={user?.profile_full_url || "/assets/images/user-profile.jpeg"} alt="userProfile" />
                                        <div className="truncate">
                                            <h4 className="text-sm font-bold flex items-center gap-2">
                                                {user?.name}
                                                <span className="text-[10px] bg-success/10 text-success px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">{user?.role}</span>
                                            </h4>
                                            <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
                                        </div>
                                    </div>
                                    
                                    <DropdownMenuGroup>
                                        <DropdownMenuItem asChild>
                                            <Link to="/users/profile" className="flex items-center gap-2 cursor-pointer py-2">
                                                <User className="size-4 opacity-70" />
                                                <span>Profile</span>
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <Link to="/apps/mailbox" className="flex items-center gap-2 cursor-pointer py-2">
                                                <Mail className="size-4 opacity-70" />
                                                <span>Inbox</span>
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={handleLock}>
                                            <div className="flex items-center gap-2 cursor-pointer py-2 w-full">
                                                <Lock className="size-4 opacity-70" />
                                                <span>Lock Screen</span>
                                            </div>
                                        </DropdownMenuItem>
                                    </DropdownMenuGroup>

                                    <DropdownMenuSeparator />

                                    <DropdownMenuSub>
                                        <DropdownMenuSubTrigger className="flex items-center gap-2 cursor-pointer py-2">
                                            <Settings className="size-4 opacity-70" />
                                            <span>Theme Settings</span>
                                        </DropdownMenuSubTrigger>
                                        <DropdownMenuSubContent className="p-0">
                                            <SettingsContent />
                                        </DropdownMenuSubContent>
                                    </DropdownMenuSub>

                                    <DropdownMenuSeparator />

                                    <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:bg-destructive focus:text-destructive-foreground">
                                        <div className="flex items-center gap-2 cursor-pointer py-2 w-full">
                                            <LogOut className="size-4 opacity-70" />
                                            <span>Sign Out</span>
                                        </div>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </div>

                {/* horizontal menu */}
            </div>
        </header>
    );
};

export default Header;

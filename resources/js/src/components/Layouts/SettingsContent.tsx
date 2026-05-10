import React from 'react';
import useThemeConfig from '../../store/useThemeConfig';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sun, Moon, Laptop, Layout, AlignLeft, AlignRight, Maximize, Minimize, Settings2 } from 'lucide-react';

const SettingsContent = () => {
    const themeConfig = useThemeConfig();

    return (
        <div className="p-4 space-y-6 w-[320px]">
            <div className="flex items-center gap-2 mb-2">
                <Settings2 className="size-4 text-primary" />
                <h4 className="font-bold text-sm uppercase tracking-wider">Appearance</h4>
            </div>

            {/* Color Scheme */}
            <div className="space-y-3">
                <div className="flex flex-col gap-1">
                    <h5 className="text-xs font-semibold">Color Scheme</h5>
                    <p className="text-[10px] text-muted-foreground">Light, dark or system theme.</p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                    <Button 
                        variant={themeConfig.theme === 'light' ? 'default' : 'outline'} 
                        size="sm" 
                        className="h-8 text-[10px] gap-1"
                        onClick={() => themeConfig.toggleTheme('light')}
                    >
                        <Sun className="size-3" /> Light
                    </Button>
                    <Button 
                        variant={themeConfig.theme === 'dark' ? 'default' : 'outline'} 
                        size="sm" 
                        className="h-8 text-[10px] gap-1"
                        onClick={() => themeConfig.toggleTheme('dark')}
                    >
                        <Moon className="size-3" /> Dark
                    </Button>
                    <Button 
                        variant={themeConfig.theme === 'system' ? 'default' : 'outline'} 
                        size="sm" 
                        className="h-8 text-[10px] gap-1"
                        onClick={() => themeConfig.toggleTheme('system')}
                    >
                        <Laptop className="size-3" /> System
                    </Button>
                </div>
            </div>

            {/* Navigation Position */}
            <div className="space-y-3">
                <div className="flex flex-col gap-1">
                    <h5 className="text-xs font-semibold">Navigation</h5>
                    <p className="text-[10px] text-muted-foreground">Sidebar or top menu position.</p>
                </div>
                <div className="grid grid-cols-1 gap-2">
                    <div className="flex gap-2">
                        <Button 
                            variant={themeConfig.menu === 'vertical' ? 'default' : 'outline'} 
                            size="sm" 
                            className="h-8 flex-1 text-[10px]"
                            onClick={() => themeConfig.toggleMenu('vertical')}
                        >
                            Vertical
                        </Button>
                        <Button 
                            variant={themeConfig.menu === 'horizontal' ? 'default' : 'outline'} 
                            size="sm" 
                            className="h-8 flex-1 text-[10px]"
                            onClick={() => themeConfig.toggleMenu('horizontal')}
                        >
                            Horizontal
                        </Button>
                    </div>
                    <Button 
                        variant={themeConfig.menu === 'collapsible-vertical' ? 'default' : 'outline'} 
                        size="sm" 
                        className="h-8 w-full text-[10px]"
                        onClick={() => themeConfig.toggleMenu('collapsible-vertical')}
                    >
                        Collapsible Vertical
                    </Button>
                </div>
                <div className="flex items-center space-x-2 pt-1">
                    <Checkbox 
                        id="semidark" 
                        checked={themeConfig.semidark}
                        onCheckedChange={(checked) => themeConfig.toggleSemidark(checked === true)}
                    />
                    <label htmlFor="semidark" className="text-[11px] font-medium leading-none cursor-pointer">
                        Semi Dark Mode
                    </label>
                </div>
            </div>

            {/* Layout & Direction */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <h5 className="text-xs font-semibold">Layout</h5>
                    <div className="flex gap-1">
                        <Button 
                            variant={themeConfig.layout === 'boxed-layout' ? 'default' : 'outline'} 
                            size="sm" 
                            className="h-7 flex-1 text-[10px] px-1"
                            onClick={() => themeConfig.toggleLayout('boxed-layout')}
                        >
                            <Minimize className="size-3 mr-1" /> Box
                        </Button>
                        <Button 
                            variant={themeConfig.layout === 'full' ? 'default' : 'outline'} 
                            size="sm" 
                            className="h-7 flex-1 text-[10px] px-1"
                            onClick={() => themeConfig.toggleLayout('full')}
                        >
                            <Maximize className="size-3 mr-1" /> Full
                        </Button>
                    </div>
                </div>
                <div className="space-y-2">
                    <h5 className="text-xs font-semibold">Direction</h5>
                    <div className="flex gap-1">
                        <Button 
                            variant={themeConfig.rtlClass === 'ltr' ? 'default' : 'outline'} 
                            size="sm" 
                            className="h-7 flex-1 text-[10px] px-1"
                            onClick={() => themeConfig.toggleRTL('ltr')}
                        >
                            <AlignLeft className="size-3 mr-1" /> LTR
                        </Button>
                        <Button 
                            variant={themeConfig.rtlClass === 'rtl' ? 'default' : 'outline'} 
                            size="sm" 
                            className="h-7 flex-1 text-[10px] px-1"
                            onClick={() => themeConfig.toggleRTL('rtl')}
                        >
                            <AlignRight className="size-3 mr-1" /> RTL
                        </Button>
                    </div>
                </div>
            </div>

            {/* Navbar & Animation */}
            <div className="space-y-4 pt-2 border-t border-border">
                <div className="space-y-2">
                    <h5 className="text-xs font-semibold">Navbar Type</h5>
                    <Select value={themeConfig.navbar} onValueChange={(value) => themeConfig.toggleNavbar(value)}>
                        <SelectTrigger className="h-8 text-[10px]">
                            <SelectValue placeholder="Select navbar type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="navbar-sticky">Sticky</SelectItem>
                            <SelectItem value="navbar-floating">Floating</SelectItem>
                            <SelectItem value="navbar-static">Static</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <h5 className="text-xs font-semibold">Transitions</h5>
                    <Select value={themeConfig.animation} onValueChange={(value) => themeConfig.toggleAnimation(value)}>
                        <SelectTrigger className="h-8 text-[10px]">
                            <SelectValue placeholder="Select animation" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value=" ">None</SelectItem>
                            <SelectItem value="animate__fadeIn">Fade</SelectItem>
                            <SelectItem value="animate__fadeInDown">Fade Down</SelectItem>
                            <SelectItem value="animate__fadeInUp">Fade Up</SelectItem>
                            <SelectItem value="animate__fadeInLeft">Fade Left</SelectItem>
                            <SelectItem value="animate__fadeInRight">Fade Right</SelectItem>
                            <SelectItem value="animate__slideInDown">Slide Down</SelectItem>
                            <SelectItem value="animate__slideInLeft">Slide Left</SelectItem>
                            <SelectItem value="animate__slideInRight">Slide Right</SelectItem>
                            <SelectItem value="animate__zoomIn">Zoom In</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>
    );
};

export default SettingsContent;

import React, { useEffect, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Map } from '@/components/ui/map';
import { Truck, MapPin, Shield, Zap, ArrowRight, Activity, Globe, Navigation, Layers, BarChart3, Clock, CheckCircle2 } from 'lucide-react';

const LandingPage = () => {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground selection:bg-primary/30 overflow-hidden font-sans">
            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] mix-blend-screen opacity-50 animate-in fade-in duration-1000" />
                <div className="absolute top-[20%] right-[-10%] w-[30%] h-[50%] bg-info/20 rounded-full blur-[120px] mix-blend-screen opacity-40 animate-in fade-in duration-1000 delay-300" />
                <div className="absolute bottom-[-10%] left-[20%] w-[50%] h-[40%] bg-primary/10 rounded-full blur-[150px] mix-blend-screen opacity-50 animate-in fade-in duration-1000 delay-500" />
            </div>

            {/* Navigation Bar */}
            <header className={`fixed top-0 w-full z-50 transition-all duration-300 border-b ${scrolled ? 'bg-background/70 backdrop-blur-xl border-border/50 shadow-sm py-3' : 'bg-transparent border-transparent py-5'}`}>
                <div className="container mx-auto px-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl font-black tracking-tighter text-primary">SCCG</span>
                    </div>
                    <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-muted-foreground">
                        <a href="#features" className="hover:text-foreground transition-colors hover:scale-105 transform">Features</a>
                        <a href="#solutions" className="hover:text-foreground transition-colors hover:scale-105 transform">Solutions</a>
                        <a href="#about" className="hover:text-foreground transition-colors hover:scale-105 transform">Enterprise</a>
                    </nav>
                    <div className="flex items-center gap-3">
                        <Link to="/auth/login" className="hidden sm:block">
                            <Button variant="ghost" className="font-bold text-xs uppercase tracking-widest hover:bg-primary/10">Sign In</Button>
                        </Link>
                        <Link to="/driver" className="hidden sm:block">
                            <Button variant="outline" className="font-bold text-xs uppercase tracking-widest border-primary/20 hover:bg-primary/5">Driver App</Button>
                        </Link>
                        <Link to="/admin">
                            <Button className="font-bold text-xs uppercase tracking-widest px-6 shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-300 hover:-translate-y-0.5 relative overflow-hidden group">
                                <span className="relative z-10">Dashboard</span>
                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                            </Button>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <main className="flex-1 pt-32 relative z-10">
                <section className="container mx-auto px-6 pt-20 pb-32 text-center">

                    
                    <h1 className="text-5xl md:text-7xl lg:text-[5.5rem] font-black tracking-tighter mb-8 max-w-5xl mx-auto leading-[0.95] animate-in fade-in slide-in-from-bottom-8 duration-1000" style={{ animationFillMode: 'both', animationDelay: '100ms' }}>
                        Command the Fleet.<br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary/80 to-info">Master the Map.</span>
                    </h1>
                    
                    <p className="text-muted-foreground text-lg md:text-xl font-medium max-w-2xl mx-auto mb-10 animate-in fade-in slide-in-from-bottom-10 duration-1000" style={{ animationFillMode: 'both', animationDelay: '200ms' }}>
                        Unleash real-time geospatial intelligence. SCCG provides enterprise-grade tracking, telematics, and predictive routing for the modern logistics empire.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-12 duration-1000" style={{ animationFillMode: 'both', animationDelay: '300ms' }}>
                        <Link to="/admin" className="w-full sm:w-auto">
                            <Button size="lg" className="w-full sm:w-auto font-bold text-sm uppercase tracking-wide px-8 h-14 gap-3 transition-all hover:-translate-y-1 group rounded-xl">
                                Launch Platform
                                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </Link>
                        <Button size="lg" variant="outline" className="w-full sm:w-auto font-semibold text-sm uppercase tracking-wide px-8 h-14 bg-background/50 backdrop-blur-sm border-border/50 hover:bg-muted/50 rounded-xl">
                            Request Demo
                        </Button>
                    </div>

                    {/* Bento Box Dashboard Mockup */}
                    <div className="mt-24 relative max-w-6xl mx-auto animate-in fade-in zoom-in-95 duration-1000" style={{ animationFillMode: 'both', animationDelay: '500ms' }}>
                        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10 h-full pointer-events-none" />
                        
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 bg-background/40 backdrop-blur-2xl border border-white/10 dark:border-white/5 rounded-3xl shadow-2xl overflow-hidden relative">
                            {/* Main Map Area */}
                            <div className="md:col-span-8 bg-card border border-border/50 rounded-2xl h-[400px] relative overflow-hidden group">
                                <div className="absolute inset-0 z-0">
                                    <Map theme="dark" language="en" viewport={{ center: [104.9282, 11.5564], zoom: 11.5, pitch: 45, bearing: -15 }} />
                                    {/* Overlay to prevent accidental scrolling on landing page */}
                                    <div className="absolute inset-0 bg-background/20 backdrop-blur-[1px] pointer-events-auto"></div>
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none z-10"></div>
                                
                                {/* UI Overlays */}
                                <div className="absolute top-4 left-4 flex gap-2">
                                    <div className="bg-background/80 backdrop-blur-md px-3 py-1.5 rounded-lg border shadow-sm flex items-center gap-2 text-xs font-bold">
                                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                        Live Tracking
                                    </div>
                                    <div className="bg-background/80 backdrop-blur-md px-3 py-1.5 rounded-lg border shadow-sm flex items-center gap-2 text-xs font-bold">
                                        <Navigation size={14} className="text-primary" />
                                        12 Active Routes
                                    </div>
                                </div>

                                {/* Animated Markers */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
                                    <div className="absolute w-24 h-24 bg-primary/20 rounded-full animate-ping opacity-75"></div>
                                    <div className="relative bg-background p-2 rounded-full shadow-xl border-2 border-primary z-10 transform group-hover:scale-110 transition-transform">
                                        <Truck size={20} className="text-primary" />
                                    </div>
                                </div>
                                <div className="absolute top-1/3 left-1/4 flex items-center justify-center">
                                    <div className="absolute w-12 h-12 bg-info/20 rounded-full animate-ping opacity-75" style={{ animationDelay: '1s' }}></div>
                                    <div className="relative bg-background p-1.5 rounded-full shadow-lg border-2 border-info z-10">
                                        <Truck size={14} className="text-info" />
                                    </div>
                                </div>
                            </div>

                            {/* Sidebar Stats */}
                            <div className="md:col-span-4 flex flex-col gap-4">
                                <div className="bg-card border border-border/50 rounded-2xl p-5 flex-1 relative overflow-hidden group hover:border-primary/50 transition-colors">
                                    <div className="absolute right-0 top-0 w-32 h-32 bg-primary/5 rounded-bl-full -z-10 group-hover:bg-primary/10 transition-colors"></div>
                                    <div className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <Activity size={16} className="text-primary" /> System Status
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-medium">Fleet Efficiency</span>
                                            <span className="text-sm font-bold text-green-500">98.4%</span>
                                        </div>
                                        <div className="w-full bg-secondary rounded-full h-1.5">
                                            <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '98.4%' }}></div>
                                        </div>
                                        <div className="flex justify-between items-center pt-2">
                                            <span className="text-sm font-medium">Network Latency</span>
                                            <span className="text-sm font-bold">42ms</span>
                                        </div>
                                        <div className="w-full bg-secondary rounded-full h-1.5">
                                            <div className="bg-primary h-1.5 rounded-full" style={{ width: '15%' }}></div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="bg-card border border-border/50 rounded-2xl p-5 flex-1 relative overflow-hidden group hover:border-info/50 transition-colors">
                                    <div className="absolute right-0 top-0 w-32 h-32 bg-info/5 rounded-bl-full -z-10 group-hover:bg-info/10 transition-colors"></div>
                                    <div className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2">
                                        <Globe size={16} className="text-info" /> Active Deliveries
                                    </div>
                                    <div className="text-3xl font-black">24</div>
                                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                        <span className="text-green-500 flex items-center"><ArrowRight size={12} className="-rotate-45" /> +3</span> this week
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section id="features" className="container mx-auto px-6 py-32 relative z-10">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-black tracking-tighter mb-4">Engineered for Scale.</h2>
                        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Everything you need to orchestrate complex supply chains, packed into a blazing fast interface.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
                        {/* Large Feature */}
                        <div className="md:col-span-2 bg-gradient-to-br from-card to-card/50 border border-border/50 rounded-3xl p-8 md:p-10 hover:border-primary/30 transition-colors group relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
                                <MapPin size={120} />
                            </div>
                            <div className="h-14 w-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-6 shadow-inner">
                                <MapPin className="size-7" />
                            </div>
                            <h3 className="text-2xl font-black tracking-tight mb-3">Sub-Second Geospatial Queries</h3>
                            <p className="text-muted-foreground leading-relaxed max-w-md">
                                Powered by advanced PostGIS architecture, our geospatial engine processes millions of location data points to deliver instant proximity alerts and routing optimizations.
                            </p>
                        </div>

                        {/* Standard Feature */}
                        <div className="bg-gradient-to-br from-card to-card/50 border border-border/50 rounded-3xl p-8 hover:border-primary/30 transition-colors group relative overflow-hidden">
                            <div className="h-14 w-14 rounded-2xl bg-info/10 border border-info/20 flex items-center justify-center text-info mb-6 shadow-inner">
                                <Layers className="size-7" />
                            </div>
                            <h3 className="text-xl font-black tracking-tight mb-3">Laravel Octane</h3>
                            <p className="text-muted-foreground">
                                High-performance application server utilizing <a href="https://frankenphp.dev/" target="_blank" className="text-info hover:underline">FrankenPHP</a> to keep your application in memory, drastically reducing response times.
                            </p>
                        </div>

                        {/* Standard Feature */}
                        <div className="bg-gradient-to-br from-card to-card/50 border border-border/50 rounded-3xl p-8 hover:border-primary/30 transition-colors group relative overflow-hidden">
                            <div className="h-14 w-14 rounded-2xl bg-warning/10 border border-warning/20 flex items-center justify-center text-warning mb-6 shadow-inner">
                                <Zap className="size-7" />
                            </div>
                            <h3 className="text-xl font-black tracking-tight mb-3">Reverb WebSockets</h3>
                            <p className="text-muted-foreground">
                                Real-time, scalable WebSocket server built directly into Laravel. See vehicles move on the map exactly as they do in the real world.
                            </p>
                        </div>

                        {/* Large Feature */}
                        <div className="md:col-span-2 bg-gradient-to-br from-card to-card/50 border border-border/50 rounded-3xl p-8 hover:border-primary/30 transition-colors group relative overflow-hidden">
                            <div className="h-14 w-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 mb-6 shadow-inner">
                                <BarChart3 className="size-7" />
                            </div>
                            <h3 className="text-2xl font-black tracking-tight mb-3">TanStack Ecosystem</h3>
                            <p className="text-muted-foreground leading-relaxed max-w-md">
                                Built natively on TanStack Router, TanStack Query, TanStack Table, TanStack Form, and TanStack Virtual for lightning-fast, predictable state management and strict type-safe navigation.
                            </p>
                        </div>

                        {/* Full Width Feature */}
                        <div className="md:col-span-3 bg-gradient-to-br from-card to-card/50 border border-border/50 rounded-3xl p-8 md:p-10 hover:border-primary/30 transition-colors group relative overflow-hidden">
                            <div className="flex flex-col md:flex-row gap-8 items-center">
                                <div className="flex-1">
                                    <div className="h-14 w-14 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-500 mb-6 shadow-inner">
                                        <Shield className="size-7" />
                                    </div>
                                    <h3 className="text-2xl font-black tracking-tight mb-3">Military-Grade Security</h3>
                                    <p className="text-muted-foreground leading-relaxed">
                                        End-to-end encryption for tracking payloads, robust multi-tenant data isolation, and comprehensive audit logging ensure your operational data remains strictly confidential.
                                    </p>
                                </div>
                                <div className="flex-1 w-full bg-background/50 rounded-xl border p-4 space-y-3">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <CheckCircle2 size={16} className="text-green-500" />
                                            <div className="h-2 bg-secondary rounded-full w-full opacity-50"></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="border-t border-border/50 py-12 bg-card/30 relative z-10 backdrop-blur-sm">
                <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2 group cursor-default">
                        <span className="font-black tracking-tighter text-lg">SC<span className="text-primary">CG</span></span>
                    </div>
                    <div className="flex gap-6 text-sm font-medium text-muted-foreground">
                        <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
                        <a href="#" className="hover:text-foreground transition-colors">Terms</a>
                        <a href="#" className="hover:text-foreground transition-colors">System Status</a>
                    </div>
                    <div className="text-xs text-muted-foreground font-medium text-center md:text-right space-y-1">
                        <p>Powered by the <span className="font-bold text-foreground">TanStack</span> Ecosystem & Laravel <span className="font-bold text-foreground">Octane</span></p>
                        <p>© {new Date().getFullYear()} SCCG. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;

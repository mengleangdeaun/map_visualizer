import React from 'react';
import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Truck, MapPin, Shield, Zap, ArrowRight } from 'lucide-react';

const LandingPage = () => {
    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground selection:bg-primary/30">
            {/* Navigation Bar */}
            <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b">
                <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="bg-primary p-1.5 rounded-lg">
                            <Truck className="text-primary-foreground size-5" />
                        </div>
                        <span className="text-xl font-black tracking-tighter">MAP<span className="text-primary">CN</span></span>
                    </div>
                    <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
                        <a href="#features" className="hover:text-primary transition-colors">Features</a>
                        <a href="#solutions" className="hover:text-primary transition-colors">Solutions</a>
                        <a href="#about" className="hover:text-primary transition-colors">About</a>
                    </nav>
                    <div className="flex items-center gap-4">
                        <Link to="/auth/login">
                            <Button variant="ghost" className="font-bold text-xs uppercase tracking-widest">Sign In</Button>
                        </Link>
                        <Link to="/driver">
                            <Button variant="outline" className="font-bold text-xs uppercase tracking-widest px-6">Driver App</Button>
                        </Link>
                        <Link to="/admin">
                            <Button className="font-bold text-xs uppercase tracking-widest px-6 shadow-lg shadow-primary/20">Go to Dashboard</Button>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <main className="flex-1 pt-32">
                <section className="container mx-auto px-6 py-20 text-center">
                    <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                        <Zap size={14} />
                        Next-Gen Logistics Monitoring
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-8 max-w-4xl mx-auto leading-[0.9] animate-in fade-in slide-in-from-bottom-8 duration-1000">
                        Real-Time Visibility for the <span className="text-primary">Modern Fleet.</span>
                    </h1>
                    <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto mb-12 animate-in fade-in slide-in-from-bottom-12 duration-1000">
                        We provide enterprise-grade tracking, fleet management, and real-time monitoring solutions optimized for performance and scalability.
                    </p>
                    <div className="flex flex-col md:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-16 duration-1000">
                        <Link to="/admin">
                            <Button size="lg" className="font-black text-xs uppercase tracking-widest px-10 h-14 gap-2 shadow-xl shadow-primary/20">
                                Launch Monitoring Dashboard
                                <ArrowRight size={16} />
                            </Button>
                        </Link>
                        <Button size="lg" variant="outline" className="font-black text-xs uppercase tracking-widest px-10 h-14">
                            Request a Demo
                        </Button>
                    </div>

                    {/* Dashboard Preview (Abstract) */}
                    <div className="mt-24 relative max-w-6xl mx-auto animate-in fade-in zoom-in-95 duration-1000">
                        <div className="absolute inset-0 bg-primary/20 blur-[120px] rounded-full opacity-20" />
                        <div className="relative bg-card border rounded-2xl shadow-2xl overflow-hidden aspect-[16/9] flex items-center justify-center group">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
                            <div className="text-center space-y-4">
                                <div className="bg-background/80 backdrop-blur-sm border rounded-xl p-4 shadow-xl inline-block transition-transform group-hover:scale-105 duration-500">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500">
                                            <Activity className="size-6" />
                                        </div>
                                        <div className="text-left">
                                            <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Network Status</div>
                                            <div className="text-xl font-black">All Systems Optimal</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Grid */}
                <section id="features" className="container mx-auto px-6 py-32 border-t">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        <div className="space-y-4">
                            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-6">
                                <MapPin className="size-6" />
                            </div>
                            <h3 className="text-xl font-black tracking-tight">Geospatial Intelligence</h3>
                            <p className="text-muted-foreground">High-performance map visualizer with PostGIS integration for complex proximity searches.</p>
                        </div>
                        <div className="space-y-4">
                            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-6">
                                <Truck className="size-6" />
                            </div>
                            <h3 className="text-xl font-black tracking-tight">Real-Time Fleet Sync</h3>
                            <p className="text-muted-foreground">Powered by Laravel Reverb for sub-100ms latency in location broadcasting and updates.</p>
                        </div>
                        <div className="space-y-4">
                            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-6">
                                <Shield className="size-6" />
                            </div>
                            <h3 className="text-xl font-black tracking-tight">Enterprise Security</h3>
                            <p className="text-muted-foreground">End-to-end encryption for tracking links and robust multi-tenant data isolation.</p>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="border-t py-12 bg-muted/20">
                <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2 opacity-50 grayscale hover:opacity-100 hover:grayscale-0 transition-all cursor-default">
                        <Truck size={20} />
                        <span className="font-black tracking-tighter">SCCG</span>
                    </div>
                    <p className="text-xs text-muted-foreground font-medium">
                        © 2026 Map Visualizer Ecosystem. All rights reserved. Built with TanStack & Laravel Octane.
                    </p>
                </div>
            </footer>
        </div>
    );
};

const Activity = ({ className, size = 24 }: { className?: string, size?: number }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="3" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
    >
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
    </svg>
);

export default LandingPage;

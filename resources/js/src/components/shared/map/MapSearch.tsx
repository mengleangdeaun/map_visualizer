import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

interface SearchResult {
    name: string;
    city?: string;
    state?: string;
    country: string;
    coordinates: [number, number]; // [lng, lat]
    type: string;
}

interface MapSearchProps {
    onSelect: (result: SearchResult) => void;
    className?: string;
    placeholder?: string;
}

export const MapSearch = ({ onSelect, className, placeholder = "Search places in Cambodia..." }: MapSearchProps) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const timeoutRef = useRef<number | null>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const searchPlaces = async (text: string) => {
        if (text.length < 2) {
            setResults([]);
            return;
        }

        setIsLoading(true);
        try {
            console.log('Searching for:', text);
            // Using Nominatim for better Khmer language support and strict country filtering
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(text)}&format=json&accept-language=km&countrycodes=kh&addressdetails=1&limit=10`,
                {
                    headers: {
                        'Accept-Language': 'km'
                    }
                }
            );
            
            if (!response.ok) {
                throw new Error(`Search API returned ${response.status}`);
            }

            const data = await response.json();
            
            if (!data || data.length === 0) {
                setResults([]);
                return;
            }

            const formattedResults: SearchResult[] = data.map((item: any) => ({
                name: item.display_name.split(',')[0],
                city: item.address?.city || item.address?.town || item.address?.village || item.address?.suburb,
                state: item.address?.state || item.address?.region,
                country: item.address?.country,
                coordinates: [parseFloat(item.lon), parseFloat(item.lat)],
                type: item.type
            }));

            setResults(formattedResults);
            setIsOpen(true);
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setQuery(value);

        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = window.setTimeout(() => {
            searchPlaces(value);
        }, 300);
    };

    const handleSelect = (result: SearchResult) => {
        setQuery(result.name);
        setIsOpen(false);
        onSelect(result);
    };

    return (
        <div ref={containerRef} className={cn("relative w-full z-[1000]", className)}>
            <div className="relative group">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 z-10 group-focus-within:text-emerald-500 transition-colors">
                    {isLoading ? <Loader2 className="size-5 animate-spin" /> : <Search className="size-5" strokeWidth={2} />}
                </div>
                <Input
                    type="text"
                    value={query}
                    onChange={handleInputChange}
                    onFocus={() => query.length >= 2 && setIsOpen(true)}
                    placeholder={placeholder}
                    className="pl-12 pr-10 h-12 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border-none rounded-2xl focus-visible:ring-2 focus-visible:ring-emerald-500/20 text-sm font-medium shadow-xl hover:shadow-2xl transition-all ring-1 ring-slate-200 dark:ring-slate-800"
                />
                {query && (
                    <button 
                        onClick={() => { setQuery(''); setResults([]); }}
                        className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <X className="size-4" />
                    </button>
                )}
            </div>

            {isOpen && results.length > 0 && (
                <div className="absolute top-full mt-2 w-full bg-background/95 dark:bg-card backdrop-blur-xl border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 ring-1 ring-slate-200 dark:ring-slate-800">
                    <div className="py-2">
                        {results.map((result, index) => (
                            <button
                                key={index}
                                onClick={() => handleSelect(result)}
                                className="w-full px-4 py-3 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left group border-b border-slate-50 dark:border-slate-800 last:border-0"
                            >
                                <div className="mt-0.5 size-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center shrink-0 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-200">
                                    <MapPin className="size-4" />
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate leading-tight">{result.name}</span>
                                    <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                        {[result.city, result.state, result.country].filter(Boolean).join(', ')}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

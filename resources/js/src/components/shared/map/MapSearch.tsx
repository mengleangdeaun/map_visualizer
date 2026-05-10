import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, X, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

export interface SearchResult {
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
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Debounce query
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedQuery(query);
        }, 300);

        return () => clearTimeout(handler);
    }, [query]);

    // TanStack Query for searching
    const { data: results = [], isFetching: isLoading } = useQuery({
        queryKey: ['places-search', debouncedQuery],
        queryFn: async () => {
            if (debouncedQuery.length < 2) return [];

            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(debouncedQuery)}&format=json&accept-language=km&countrycodes=kh&addressdetails=1&limit=10`,
                {
                    headers: {
                        'Accept-Language': 'km'
                    }
                }
            );
            
            if (!response.ok) throw new Error('Search failed');

            const data = await response.json();
            
            return data.map((item: any) => ({
                name: item.display_name.split(',')[0],
                city: item.address?.city || item.address?.town || item.address?.village || item.address?.suburb,
                state: item.address?.state || item.address?.region,
                country: item.address?.country,
                coordinates: [parseFloat(item.lon), parseFloat(item.lat)],
                type: item.type
            }));
        },
        enabled: debouncedQuery.length >= 2,
        staleTime: 1000 * 60 * 5, // Cache results for 5 minutes
    });

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Open results when we have data and input is focused
    useEffect(() => {
        if (results.length > 0 && query.length >= 2) {
            setIsOpen(true);
        }
    }, [results, query]);

    const handleSelect = (result: SearchResult) => {
        setQuery(result.name);
        setIsOpen(false);
        onSelect(result);
    };

    return (
        <div ref={containerRef} className={cn("relative w-full z-[1000]", className)}>
            <div className="relative group">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 z-10 group-focus-within:text-primary transition-colors">
                    {isLoading ? <Loader2 className="size-5 animate-spin" /> : <Search className="size-5" strokeWidth={2} />}
                </div>
                <Input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => query.length >= 2 && results.length > 0 && setIsOpen(true)}
                    placeholder={placeholder}
                    className="pl-12 pr-10 h-12 bg-background/50  dark:bg-background/90 backdrop-blur-xl border-none rounded-lg focus-visible:ring-2 focus-visible:ring-primary/50 text-sm font-medium shadow-xl hover:shadow-2xl transition-all ring-1 ring-slate-200 dark:ring-slate-800"
                />
                {query && (
                    <button 
                        onClick={() => { setQuery(''); setIsOpen(false); }}
                        className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <X className="size-4" />
                    </button>
                )}
            </div>

            {isOpen && results.length > 0 && (
                <div className="absolute top-full mt-2 w-full bg-background/80 dark:bg-card/95 backdrop-blur-xl border rounded-lg shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 ring-1 ring-slate-200 dark:ring-slate-800 z-[1100]">
                    <ScrollArea className="h-[350px] w-full" type="always">
                        <div className="flex flex-col">
                            {results.map((result: SearchResult, index: number) => (
                                <button
                                    key={`${index}-${result.name}`}
                                    onClick={() => handleSelect(result)}
                                    className="w-full px-4 py-3 flex items-start gap-3 hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors text-left group/item border-b border-border/50 last:border-0"
                                >
                                    <div className="mt-0.5 size-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center shrink-0 group-hover/item:bg-primary group-hover/item:text-primary-foreground transition-all duration-200">
                                        <MapPin className="size-4" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-semibold text-foreground group-hover/item:text-primary transition-colors">
                                            {result.name}
                                        </span>
                                        <span className="text-[11px] text-muted-foreground line-clamp-1">
                                            {[result.city, result.state, result.country].filter(Boolean).join(', ')}
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </ScrollArea>
                </div>
            )}
        </div>
    );
};

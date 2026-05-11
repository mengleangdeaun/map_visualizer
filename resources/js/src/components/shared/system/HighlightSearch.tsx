import React from 'react';
import { cn } from '@/lib/utils';

interface HighlightSearchProps {
    text: string;
    query: string;
    className?: string;
    highlightClassName?: string;
}

export const HighlightSearch = ({ 
    text, 
    query, 
    className,
    highlightClassName 
}: HighlightSearchProps) => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
        return <span className={className}>{text}</span>;
    }

    // Escape special characters in query for regex
    const escapedQuery = trimmedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedQuery})`, 'gi');
    const parts = text.split(regex);

    return (
        <span className={className}>
            {parts.map((part, i) => {
                const isMatch = part.toLowerCase() === trimmedQuery.toLowerCase();
                
                return isMatch ? (
                    <mark 
                        key={i} 
                        className={cn(
                            "bg-primary/20 text-primary font-bold rounded-sm px-0.5 transition-colors",
                            highlightClassName
                        )}
                    >
                        {part}
                    </mark>
                ) : (
                    <span key={i}>{part}</span>
                );
            })}
        </span>
    );
};

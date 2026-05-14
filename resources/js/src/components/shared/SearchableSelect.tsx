import React, { useState, useMemo, useEffect } from 'react';
import { 
    Popover, 
    PopoverContent, 
    PopoverTrigger 
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check, Search, X, ChevronDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchableSelectProps<T> {
    options: T[];
    value: string | null | undefined;
    onChange: (value: string | null) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    emptyMessage?: string;
    getOptionValue: (option: T) => string;
    getOptionLabel: (option: T) => string;
    getOptionSearchTerms?: (option: T) => string[];
    renderOption?: (option: T) => React.ReactNode;
    renderTrigger?: (selectedOption: T) => React.ReactNode;
    isLoading?: boolean;
    disabled?: boolean;
    className?: string;
    triggerClassName?: string;
}

export function SearchableSelect<T>({
    options,
    value,
    onChange,
    placeholder = "Select option...",
    searchPlaceholder = "Search...",
    emptyMessage = "No results found.",
    getOptionValue,
    getOptionLabel,
    getOptionSearchTerms,
    renderOption,
    renderTrigger,
    isLoading = false,
    disabled = false,
    className,
    triggerClassName,
}: SearchableSelectProps<T>) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");

    const selectedOption = useMemo(() => 
        options.find(opt => getOptionValue(opt) === value),
    [options, value, getOptionValue]);

    const filteredOptions = useMemo(() => {
        if (!search) return options;
        const lowerSearch = search.toLowerCase();
        return options.filter(opt => {
            const label = getOptionLabel(opt).toLowerCase();
            const extraTerms = getOptionSearchTerms ? getOptionSearchTerms(opt).map(t => t.toLowerCase()) : [];
            return label.includes(lowerSearch) || extraTerms.some(t => t.includes(lowerSearch));
        });
    }, [options, search, getOptionLabel, getOptionSearchTerms]);

    // Reset search when opening
    useEffect(() => {
        if (open) setSearch("");
    }, [open]);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    disabled={disabled || isLoading}
                    className={cn(
                        "w-full justify-between bg-background font-normal text-left h-auto min-h-[2.5rem] px-3 py-2 border-border/50 hover:border-primary/30 transition-all",
                        triggerClassName
                    )}
                >
                    <div className="flex-1 truncate pr-2">
                        {isLoading ? (
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Loader2 className="size-3 animate-spin" />
                                <span className="text-xs">Loading...</span>
                            </div>
                        ) : selectedOption ? (
                            renderTrigger ? renderTrigger(selectedOption) : (
                                <span className="text-sm font-medium">{getOptionLabel(selectedOption)}</span>
                            )
                        ) : (
                            <span className="text-sm text-muted-foreground">{placeholder}</span>
                        )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                        {value && !disabled && (
                            <X 
                                className="size-3.5 text-muted-foreground/50 hover:text-destructive transition-colors cursor-pointer mr-1 !pointer-events-auto" 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    onChange(null);
                                }}
                            />
                        )}
                        <ChevronDown className={cn("size-4 text-muted-foreground/50 transition-transform duration-200", open && "rotate-180")} />
                    </div>
                </Button>
            </PopoverTrigger>
            <PopoverContent 
                className="p-0 gap-0 bg-card border-border/50 shadow-2xl backdrop-blur-xl overflow-hidden" 
                align="start"
                style={{ width: 'var(--radix-popover-trigger-width)' }}
            >
                <div className="flex items-center border-b px-3 bg-transparent">
                    <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                    <Input
                        placeholder={searchPlaceholder}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="h-11 w-full border-0 !bg-transparent shadow-none focus-visible:ring-0 text-sm placeholder:text-muted-foreground/50"
                        autoFocus
                    />
                </div>
                <ScrollArea className="max-h-[min(400px,50vh)]">
                    <div className="p-1 space-y-0.5">
                        {filteredOptions.length === 0 ? (
                            <div className="py-6 text-center text-sm text-muted-foreground">
                                {emptyMessage}
                            </div>
                        ) : (
                            filteredOptions.map((option) => {
                                const optionValue = getOptionValue(option);
                                const isSelected = optionValue === value;
                                return (
                                    <div
                                        key={optionValue}
                                        onClick={() => {
                                            onChange(optionValue);
                                            setOpen(false);
                                        }}
                                        className={cn(
                                            "flex items-center justify-between px-2 py-2 rounded-md cursor-pointer transition-all group",
                                            isSelected 
                                                ? "bg-primary/10 text-primary" 
                                                : "hover:bg-accent/50 text-foreground/80 hover:text-foreground"
                                        )}
                                    >
                                        <div className="flex-1 min-w-0 pr-2">
                                            {renderOption ? renderOption(option) : (
                                                <span className="text-sm font-medium">{getOptionLabel(option)}</span>
                                            )}
                                        </div>
                                        {isSelected && <Check className="size-4 shrink-0 text-primary" />}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}

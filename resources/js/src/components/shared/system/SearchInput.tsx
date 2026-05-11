import React from 'react';
import { Search, X, Loader2} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    onClear?: () => void;
    isLoading?: boolean;
}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
    ({ className, value, onChange, onClear, isLoading, ...props }, ref) => {
        const handleClear = (e: React.MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            if (onClear) {
                onClear();
            } else if (onChange) {
                // If onClear isn't provided, try to simulate an empty change
                const event = {
                    target: { value: '' },
                } as React.ChangeEvent<HTMLInputElement>;
                onChange(event);
            }
        };

        return (
            <div className={cn("relative group", className)}>
                <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center">
                    {isLoading ? (
                        <Loader2 className="size-4 text-primary animate-spin" />
                    ) : (
                        <Search className="size-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                    )}
                </div>
                <Input
                    ref={ref}
                    value={value}
                    onChange={onChange}
                    className="pl-10 pr-10 bg-background border-border/50 focus-visible:ring-primary/20 shadow-sm"
                    {...props}
                />
                {value && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={handleClear}
                        className="absolute right-1 top-1/2 -translate-y-1/2 size-7 text-muted-foreground/50 hover:text-foreground hover:bg-transparent"
                    >
                        <X className="size-3" />
                    </Button>
                )}
            </div>
        );
    }
);

SearchInput.displayName = 'SearchInput';

import React from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Edit2, Trash2, Info, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

export type TableActionVariant = 'edit' | 'delete' | 'info' | 'view';
export type TableActionShape = 'circle' | 'square' | 'rounded';
export type TableActionSize = 'sm' | 'md' | 'lg';

interface TableActionButtonProps extends Omit<ButtonProps, 'size' | 'variant'> {
    variant: TableActionVariant;
    shape?: TableActionShape;
    size?: TableActionSize;
    tooltip?: string;
    icon?: React.ReactNode;
}

const TableActionButton = React.forwardRef<HTMLButtonElement, TableActionButtonProps>(
    ({ variant, shape = 'rounded', size = 'sm', tooltip, icon, className, ...props }, ref) => {
        const { t } = useTranslation('system');

        const variantConfig = {
            edit: {
                icon: <Edit2 className="size-3.5" />,
                label: t('edit'),
                color: 'hover:bg-primary/10 hover:text-primary text-muted-foreground',
            },
            delete: {
                icon: <Trash2 className="size-3.5" />,
                label: t('delete'),
                color: 'hover:bg-destructive/10 hover:text-destructive text-muted-foreground',
            },
            info: {
                icon: <Info className="size-3.5" />,
                label: t('info'),
                color: 'hover:bg-indigo-500/10 hover:text-indigo-600 text-muted-foreground',
            },
            view: {
                icon: <Eye className="size-3.5" />,
                label: t('view'),
                color: 'hover:bg-emerald-500/10 hover:text-emerald-600 text-muted-foreground',
            },
        };

        const sizeClasses = {
            sm: 'h-8 w-8',
            md: 'h-10 w-10',
            lg: 'h-12 w-12',
        };

        const shapeClasses = {
            circle: 'rounded-full',
            square: 'rounded-none',
            rounded: 'rounded-lg',
        };

        const config = variantConfig[variant];
        const content = icon || config.icon;
        const label = tooltip || config.label;

        return (
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        ref={ref}
                        variant="ghost"
                        className={cn(
                            'p-0 transition-all duration-200 active:scale-95',
                            sizeClasses[size],
                            shapeClasses[shape],
                            config.color,
                            className
                        )}
                        {...props}
                    >
                        {content}
                    </Button>
                </TooltipTrigger>
                <TooltipContent 
                    side="top" 
                    className="bg-foreground text-background text-[10px] font-bold px-2 py-1 shadow-xl uppercase tracking-wider"
                >
                    <p>{label}</p>
                </TooltipContent>
            </Tooltip>
        );
    }
);

TableActionButton.displayName = 'TableActionButton';

interface TableActionButtonsProps {
    children: React.ReactNode;
    className?: string;
}

export const TableActionButtons = ({ children, className }: TableActionButtonsProps) => {
    return (
        <div className={cn('flex items-center justify-end gap-1', className)}>
            {children}
        </div>
    );
};

export { TableActionButton };

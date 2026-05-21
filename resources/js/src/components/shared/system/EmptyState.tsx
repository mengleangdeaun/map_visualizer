import React from 'react';
import { Search, FolderOpen, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Iconsvg } from '@/components/shared/svg/IconState';

interface EmptyStateProps {
    type?: 'no-data' | 'no-results';
    title?: string;
    description?: string;
    onAction?: () => void;
    actionLabel?: string;
    className?: string;
}

const NoResultsIcon = () => (
        <Iconsvg name="box" />
);

const NoDataIcon = () => (
    <Iconsvg name="database" />
);

export const EmptyState = ({ 
    type = 'no-data', 
    title, 
    description, 
    onAction, 
    actionLabel,
    className 
}: EmptyStateProps) => {
    const { t } = useTranslation('system');

    const config = {
        'no-data': {
            icon: NoDataIcon,
            title: title || t('no_data_found'),
            description: description || t('it_looks_like_there_is_no_data_here_yet'),
            actionIcon: null,
        },
        'no-results': {
            icon: NoResultsIcon,
            title: title || t('no_results_found'),
            description: description || t('we_couldnt_find_anything_matching_your_search'),
            actionIcon: RefreshCcw,
        }
    };

    const activeConfig = config[type];
    const Icon = activeConfig.icon;

    return (
        <div className={cn(
            "flex flex-col items-center justify-center py-16 px-4 text-center animate-in fade-in zoom-in duration-500",
            className
        )}>
            <div className="mb-6 h-24 w-24">
                <Icon />
            </div>

            <h3 className="text-xl font-bold tracking-tight text-foreground/90 mb-2">
                {activeConfig.title}
            </h3>
            
            <p className="text-sm text-muted-foreground max-w-[300px] leading-relaxed mb-8">
                {activeConfig.description}
            </p>

            {onAction && (
                <Button 
                    variant="outline" 
                    onClick={onAction}
                    className="h-9 px-5 bg-background border-border transition-all font-bold text-xs "
                >
                    {activeConfig.actionIcon && <activeConfig.actionIcon className="mr-2 size-3" />}
                    {actionLabel || (type === 'no-results' ? t('clear_search') : t('add_new'))}
                </Button>
            )}
        </div>
    );
};

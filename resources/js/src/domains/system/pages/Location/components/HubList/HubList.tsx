import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { SearchInput } from '@/components/shared/system/SearchInput';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Location } from '@/domains/fleet/services/locationService';
import { MapPin, Search, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';

interface HubListProps {
    locations: Location[];
    selectedId: string | null;
    onSelect: (location: Location) => void;
    isLoading?: boolean;
}

const typeColors = {
    main_sort: 'bg-blue-500',
    regional_hub: 'bg-purple-500',
    local_node: 'bg-orange-500',
};

export const HubList = ({ 
    locations, 
    selectedId, 
    onSelect,
    isLoading 
}: HubListProps) => {
    const { t } = useTranslation('system');
    const [searchTerm, setSearchTerm] = useState('');

    const filteredLocations = locations.filter(l => 
        l.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        l.code?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Card className="flex flex-col h-full shadow-none bg-transparent">
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="size-4 text-primary" />
                    {t('saved_locations')}
                </CardTitle>
                <CardDescription>
                    {t('manage_map_markers')}
                </CardDescription>
                <div className="mt-3">
                    <SearchInput
                        placeholder={t('search_hubs')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onClear={() => setSearchTerm('')}
                    />
                </div>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 px-4 pb-2">
                <ScrollArea className="h-full">
                    <div className="flex flex-col gap-2">
                        {filteredLocations.length === 0 ? (
                            <div className="py-12 text-center space-y-2">
                                <div className="size-10 rounded-full bg-muted mx-auto flex items-center justify-center text-muted-foreground opacity-50">
                                    <Filter className="size-5" />
                                </div>
                                <p className="text-xs text-muted-foreground font-medium">{t('no_markers_found')}</p>
                            </div>
                        ) : (
                            filteredLocations.map((location) => (
                                <div
                                    key={location.id}
                                    onClick={() => onSelect(location)}
                                    className={cn(
                                        'group flex flex-col gap-2 p-3 rounded-xl border border-border transition-all cursor-pointer animate-in fade-in slide-in-from-right-4 duration-300',
                                        selectedId === location.id 
                                            ? 'bg-primary/5 border-primary/30' 
                                            : 'bg-card dark:bg-card/90 hover:bg-accent/50 border-border/50'
                                    )}
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <div className={cn(
                                                'size-2 rounded-full shrink-0',
                                                typeColors[location.type as keyof typeof typeColors] || 'bg-primary'
                                            )} />
                                            <span className="text-xs font-bold truncate leading-tight">
                                                {location.name}
                                            </span>
                                        </div>
                                        <Badge variant="outline" className="text-[10px] h-3.5 px-1 font-semibold uppercase shrink-0 border-none bg-muted/50">
                                            {t(`type_${location.type}`)}
                                        </Badge>
                                    </div>
                                    <div className="flex flex-col gap-0.5 mt-0.5">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-mono text-muted-foreground opacity-70">
                                                {location.code || '-'}
                                            </span>
                                            <span className="text-[9px] font-medium text-muted-foreground/60">
                                                {Number(location.longitude).toFixed(3)}, {Number(location.latitude).toFixed(3)}
                                            </span>
                                        </div>
                                        <div className="text-[10px] font-bold text-primary/70 pt-1 border-t border-primary/5">
                                            {location.company?.name}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
};

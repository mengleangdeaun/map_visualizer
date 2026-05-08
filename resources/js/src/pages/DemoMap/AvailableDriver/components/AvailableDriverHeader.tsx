import React from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';

interface AvailableDriverHeaderProps {
    driverCount: number;
    status: string;
}

export const AvailableDriverHeader = ({ driverCount, status }: AvailableDriverHeaderProps) => {
    return (
        <PageHeader 
            title="Available Drivers" 
            subtitle={status}
        >
            <div className="flex items-center gap-2 bg-background border rounded-lg px-3 py-1.5 shadow-sm">
                <Users className="size-4 text-primary" />
                <span className="text-sm font-bold">{driverCount}</span>
                <span className="text-xs text-muted-foreground uppercase font-medium">Drivers Online</span>
            </div>
        </PageHeader>
    );
};

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Car, Bike, Zap } from 'lucide-react';

interface VehicleSelectorProps {
    vehicleType: 'car' | 'bike' | 'tuk_tuk';
    setVehicleType: (v: 'car' | 'bike' | 'tuk_tuk') => void;
}

export const VehicleSelector: React.FC<VehicleSelectorProps> = ({ vehicleType, setVehicleType }) => {
    return (
        <div className="space-y-4">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Vehicle Type</label>
            <Tabs value={vehicleType} onValueChange={(v: any) => setVehicleType(v)} className="w-full">
                <TabsList className="grid w-full grid-cols-3 h-10">
                    <TabsTrigger value="car" className="gap-2 text-xs">
                        <Car className="size-3.5" /> Car
                    </TabsTrigger>
                    <TabsTrigger value="bike" className="gap-2 text-xs">
                        <Bike className="size-3.5" /> Bike
                    </TabsTrigger>
                    <TabsTrigger value="tuk_tuk" className="gap-2 text-xs font-bold">
                        <Zap className="size-3.5" /> Romork
                    </TabsTrigger>
                </TabsList>
            </Tabs>
        </div>
    );
};

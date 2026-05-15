import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Truck, Power } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ShiftControlProps {
    isOnline: boolean;
    onToggle: () => void;
}

export const ShiftControl = ({ isOnline, onToggle }: ShiftControlProps) => {
    return (
        <Card className={cn(
            "p-6 flex flex-col items-center gap-6 transition-all duration-500 border-none shadow-2xl relative overflow-hidden",
            isOnline ? "bg-primary text-primary-foreground" : "bg-card text-foreground"
        )}>
            {isOnline && (
                <div className="absolute inset-0 bg-white/10 animate-pulse pointer-events-none" />
            )}
            
            <div className={cn(
                "h-24 w-24 rounded-full flex items-center justify-center transition-all duration-500 shadow-inner",
                isOnline ? "bg-white/20 scale-110" : "bg-muted shadow-lg"
            )}>
                <Truck size={48} className={cn(isOnline && "animate-bounce")} />
            </div>

            <div className="text-center space-y-2">
                <h2 className="text-2xl font-black tracking-tighter">
                    {isOnline ? 'Shift Active' : 'Ready to Start?'}
                </h2>
                <p className={cn(
                    "text-xs font-medium max-w-[200px]",
                    isOnline ? "text-primary-foreground/70" : "text-muted-foreground"
                )}>
                    {isOnline 
                        ? 'Your location is being broadcasted to dispatch in real-time.' 
                        : 'Start your shift to begin receiving delivery tasks.'}
                </p>
            </div>

            <Button 
                size="lg" 
                onClick={onToggle}
                variant={isOnline ? "secondary" : "default"}
                className="w-full h-16 rounded-2xl text-base font-black uppercase tracking-widest gap-3 shadow-xl"
            >
                <Power size={20} />
                {isOnline ? 'End Shift' : 'Start Shift'}
            </Button>
        </Card>
    );
};

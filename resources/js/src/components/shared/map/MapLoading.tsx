import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface MapLoadingProps {
    message?: string;
    className?: string;
}

export const MapLoading = ({ 
    message = "Updating map data...", 
    className 
}: MapLoadingProps) => {
    return (
        <div className={cn(
            "absolute inset-0 flex items-center justify-center z-[9999] transition-all duration-300",
            "bg-background/20 backdrop-blur-md animate-in fade-in-0",
            className
        )}>
            <div className="bg-background/90 border shadow-2xl rounded-2xl px-8 py-6 flex flex-col items-center gap-4 animate-in zoom-in-95 duration-300">
                <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping scale-150 duration-2000" />
                    <div className="relative size-12 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                        <Loader2 className="size-6 animate-spin text-primary" />
                    </div>
                </div>
                
                <div className="space-y-1 text-center">
                    <p className="text-sm font-bold text-foreground">{message}</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-black opacity-60">Please wait</p>
                </div>
            </div>
        </div>
    );
};

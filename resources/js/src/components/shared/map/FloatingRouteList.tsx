import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Route as RouteIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Route {
    duration: number;
    distance: number;
}

interface FloatingRouteListProps {
    routes: Route[];
    selectedIndex: number;
    onSelect: (index: number) => void;
    formatDuration: (seconds: number) => string;
    formatDistance: (meters: number) => string;
}

export const FloatingRouteList = ({
    routes,
    selectedIndex,
    onSelect,
    formatDuration,
    formatDistance,
}: FloatingRouteListProps) => {
    return (
        <div className="absolute top-4 left-4 flex flex-col gap-2 z-10 w-64">
            {routes.map((route, index) => {
                const isActive = index === selectedIndex;
                const isFastest = index === 0;
                return (
                    <Button
                        key={index}
                        variant={isActive ? "secondary" : "outline"}
                        size="sm"
                        onClick={() => onSelect(index)}
                        className={cn(
                            "group justify-start  gap-3 h-auto py-3.5 px-4 border shadow-sm transition-all duration-200",
                            isActive 
                                ? "bg-background/50 backdrop-blur-lg shadow-sm hover:bg-background/60" 
                                : "bg-background/50 backdrop-blur-lg hover:bg-background/95"
                        )}
                    >
                        <div className="flex flex-col items-start gap-1">
                            <div className="flex items-center gap-2">
                                <Clock className={cn("size-3.5", isActive ? "text-primary" : "text-muted-foreground")} />
                                <span className="font-bold text-xs tracking-tight">
                                    {formatDuration(route.duration)}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-semibold">
                                <RouteIcon className="size-3" />
                                {formatDistance(route.distance)}
                            </div>
                        </div>
                        
                        {isFastest && (
                            <div className="ltr:ml-auto rtl:mr-auto">
                                <Badge variant={isActive ? "default" : "outline"} className="text-[9px] px-2 py-0 font-bold uppercase tracking-wider h-5">
                                    Fastest
                                </Badge>
                            </div>
                        )}
                        
                        {isActive && !isFastest && (
                            <div className="ltr:ml-auto rtl:mr-auto size-2 rounded-full bg-primary" />
                        )}
                    </Button>
                );
            })}
        </div>
    );
};

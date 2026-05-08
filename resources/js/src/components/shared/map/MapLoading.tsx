import { Loader2 } from "lucide-react";

interface MapLoadingProps {
    message?: string;
}

export const MapLoading = ({ message = "Calculating routes..." }: MapLoadingProps) => {
    return (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-20 backdrop-blur-xs rounded-xl">
            <div className="flex flex-col items-center gap-2">
                <Loader2 className="size-8 animate-spin text-primary" />
                <p className="text-sm font-medium">{message}</p>
            </div>
        </div>
    );
};

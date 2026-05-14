import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Plus, RotateCw, Filter, MoreVertical, ShieldCheck } from "lucide-react";
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, Map as MapIcon } from "lucide-react";

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    
    // Primary Action (Add/Create)
    primaryAction?: {
        label: string;
        onClick: () => void;
        icon?: ReactNode;
        disabled?: boolean;
    };
    
    // Secondary Action (Add/Create)
    secondaryAction?: {
        label: string;
        onClick: () => void;
        icon?: ReactNode;
        disabled?: boolean;
    };
    
    // Secondary Actions
    refreshAction?: {
        onClick: () => void;
        isFetching?: boolean;
    };
    
    filterAction?: {
        onClick: () => void;
        isActive?: boolean;
    };
    
    dropdownAction?: {
        icon?: ReactNode;
        items: ReactNode;
    };
    
    viewAction?: {
        view: 'table' | 'map';
        onChange: (view: 'table' | 'map') => void;
    };
    
    children?: ReactNode;
    className?: string;
}

export const PageHeader = ({ 
    title, 
    subtitle, 
    primaryAction,
    secondaryAction,
    refreshAction,
    filterAction,
    dropdownAction,
    viewAction,
    children, 
    className 
}: PageHeaderProps) => {
    return (
        <div className={cn("flex flex-col mb-4 sm:flex-row justify-between items-start sm:items-center gap-4", className)}>
            <div>
                <h1 className="text-2xl font-bold text-primary tracking-tight">{title}</h1>
                {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
            </div>
            
            <div className="flex items-center gap-3">
                {/* Secondary Actions First */}
                {refreshAction && (
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={refreshAction.onClick}
                        disabled={refreshAction.isFetching}
                        className="h-8 w-8 bg-background border-border hover:bg-primary/5 hover:text-primary transition-all shadow-sm"
                    >
                        <RotateCw className={cn("size-4 transition-all", refreshAction.isFetching && "animate-spin text-primary")} />
                    </Button>
                )}
                
                {filterAction && (
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={filterAction.onClick}
                        className={cn(
                            "h-8 w-8 bg-background border-border hover:bg-primary/5 hover:text-primary transition-all shadow-sm",
                            filterAction.isActive && "bg-primary/10 text-primary border-primary/20"
                        )}
                    >
                        <Filter className="size-4" />
                    </Button>
                )}
                
                {dropdownAction && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 bg-background border-border hover:bg-primary/5 hover:text-primary transition-all shadow-sm"
                            >
                                {dropdownAction.icon || <MoreVertical className="size-4" />}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 bg-card border-border/50 shadow-xl">
                            {dropdownAction.items}
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}

                {viewAction && (
                    <Tabs 
                        value={viewAction.view} 
                        onValueChange={(v) => viewAction.onChange(v as 'table' | 'map')}
                        className="h-8"
                    >
                        <TabsList className="bg-background border border-border p-0.5 shadow-sm">
                            <TabsTrigger 
                                value="table" 
                                className="text-[11px] font-semibold uppercase data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                            >
                                <Table className="size-3 mr-1.5" />
                                Table
                            </TabsTrigger>
                            <TabsTrigger 
                                value="map" 
                                className="text-[11px] font-semibold uppercase data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                            >
                                <MapIcon className="size-3 mr-1.5" />
                                Map
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                )}
                
                {/* Custom Children */}
                {children}
                
                {/* Primary Action Last */}
                {secondaryAction && (
                    <Button
                        size="lg"
                        variant="outline"
                        className="bg-background hover:bg-primary/5 hover:text-primary border-primary/20 transition-all"
                        onClick={secondaryAction.onClick}
                        disabled={secondaryAction.disabled}
                    >
                        {secondaryAction.icon || <ShieldCheck className="mr-2 h-4 w-4" />}
                        {secondaryAction.label}
                    </Button>
                )}

                {primaryAction && (
                    <Button
                        size="lg"
                        className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all"
                        onClick={primaryAction.onClick}
                        disabled={primaryAction.disabled}
                    >
                        {primaryAction.icon || <Plus className="mr-2 h-4 w-4" />}
                        {primaryAction.label}
                    </Button>
                )}
            </div>
        </div>
    );
};

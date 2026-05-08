import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    children?: ReactNode;
    className?: string;
}

export const PageHeader = ({ title, subtitle, children, className }: PageHeaderProps) => {
    return (
        <div className={cn("flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4", className)}>
            <div>
                <h1 className="text-2xl font-bold text-primary tracking-tight">{title}</h1>
                {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
            </div>
            {children && (
                <div className="flex items-center gap-2">
                    {children}
                </div>
            )}
        </div>
    );
};

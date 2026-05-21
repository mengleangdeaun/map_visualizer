import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

const REASON_OPTIONS = [
    { value: 'customer_unreachable', label: 'Customer Unreachable' },
    { value: 'address_not_found',    label: 'Address Not Found' },
    { value: 'refused_payment',      label: 'Refused Payment' },
    { value: 'refused_delivery',     label: 'Refused Delivery' },
    { value: 'damaged_package',      label: 'Damaged Package' },
    { value: 'lost_package',         label: 'Lost Package' },
    { value: 'rescheduled',          label: 'Reschedule Request' },
    { value: 'other',                label: 'Other' },
];

interface StopExceptionModalProps {
    isOpen: boolean;
    isPending: boolean;
    reasonCode: string;
    notes: string;
    onReasonChange: (value: string) => void;
    onNotesChange: (value: string) => void;
    onClose: () => void;
    onSubmit: () => void;
}

export const StopExceptionModal: React.FC<StopExceptionModalProps> = ({
    isOpen,
    isPending,
    reasonCode,
    notes,
    onReasonChange,
    onNotesChange,
    onClose,
    onSubmit,
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-end justify-center p-4">
            <div className="max-w-md w-full bg-background border border-border/50 rounded-3xl p-6 space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-200">
                <div className="flex items-center gap-2 text-destructive border-b border-border/50 pb-3">
                    <AlertTriangle size={20} />
                    <h3 className="font-bold text-lg text-foreground">Report Delivery Issue</h3>
                </div>

                {/* Reason Selector */}
                <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase">
                        Issue Reason
                    </label>
                    <select
                        value={reasonCode}
                        onChange={(e) => onReasonChange(e.target.value)}
                        className="w-full h-10 rounded-xl bg-muted/50 border border-border/50 px-3 text-sm focus:outline-none"
                    >
                        {REASON_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>

                {/* Notes */}
                <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Notes</label>
                    <textarea
                        value={notes}
                        onChange={(e) => onNotesChange(e.target.value)}
                        placeholder="Enter specific exception details..."
                        className="w-full h-24 rounded-xl bg-muted/50 border border-border/50 p-3 text-sm focus:outline-none resize-none"
                    />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                    <Button
                        onClick={onClose}
                        variant="outline"
                        className="flex-1 h-10 rounded-xl font-bold"
                        disabled={isPending}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={onSubmit}
                        variant="destructive"
                        className="flex-1 h-10 rounded-xl font-bold"
                        disabled={isPending}
                    >
                        {isPending ? 'Logging...' : 'Log Exception'}
                    </Button>
                </div>
            </div>
        </div>
    );
};

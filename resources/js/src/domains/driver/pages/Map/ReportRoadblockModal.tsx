import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ReportRoadblockModalProps {
    isOpen: boolean;
    onClose: () => void;
    clickedCoords: { lng: number; lat: number } | null;
    onSubmit: (description: string, type: 'blockage' | 'accident' | 'flood' | 'traffic') => void;
    isPending: boolean;
}

export const ReportRoadblockModal: React.FC<ReportRoadblockModalProps> = ({
    isOpen,
    onClose,
    clickedCoords,
    onSubmit,
    isPending
}) => {
    const { t } = useTranslation(['delivery', 'driver']);
    const [reportDescription, setReportDescription] = useState('');
    const [reportType, setReportType] = useState<'blockage' | 'accident' | 'flood' | 'traffic'>('blockage');

    if (!isOpen || !clickedCoords) return null;

    const handlePublish = () => {
        if (!reportDescription.trim()) return;
        onSubmit(reportDescription, reportType);
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-end justify-center p-4">
            <div className="max-w-md w-full bg-background border border-border/50 rounded-3xl p-6 space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-200">
                <div className="flex items-center gap-2 text-destructive border-b border-border/50 pb-3">
                    <AlertTriangle size={20} />
                    <h3 className="font-bold text-lg text-foreground">
                        {t('delivery:report_issue') || 'Report Road Hazard / Blockage'}
                    </h3>
                </div>

                {/* Coordinate snapshot */}
                <div className="text-[10px] font-bold text-muted-foreground uppercase bg-muted/20 p-2.5 rounded-lg flex justify-between">
                    <span>Lat: {clickedCoords.lat.toFixed(6)}</span>
                    <span>Lng: {clickedCoords.lng.toFixed(6)}</span>
                </div>

                {/* Hazard type selection */}
                <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase">
                        Hazard Alert Type
                    </label>
                    <select
                        value={reportType}
                        onChange={(e) => setReportType(e.target.value as any)}
                        className="w-full h-11 rounded-xl bg-muted/50 border border-border/50 px-3 text-sm focus:outline-none"
                    >
                        <option value="blockage">Road Blocked / Construction</option>
                        <option value="accident">Traffic Accident</option>
                        <option value="flood">Severe Flooding</option>
                        <option value="traffic">Heavy Traffic Jam</option>
                    </select>
                </div>

                {/* Alert description */}
                <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase">
                        Alert Description
                    </label>
                    <textarea
                        value={reportDescription}
                        onChange={(e) => setReportDescription(e.target.value)}
                        placeholder="E.g., st 255 road blocked due to tree fall..."
                        className="w-full h-24 rounded-xl bg-muted/50 border border-border/50 p-3 text-sm focus:outline-none resize-none"
                    />
                </div>

                {/* Action buttons */}
                <div className="flex gap-3 pt-2">
                    <Button
                        onClick={onClose}
                        variant="outline"
                        className="flex-1 h-11 rounded-2xl font-bold"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handlePublish}
                        disabled={!reportDescription.trim() || isPending}
                        className="flex-1 h-11 rounded-2xl font-bold bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {isPending ? "Submitting..." : "Publish Warning"}
                    </Button>
                </div>
            </div>
        </div>
    );
};

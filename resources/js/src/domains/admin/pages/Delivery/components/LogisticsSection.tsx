import React from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, MapPin, Scale, Activity, Layers, Link2, Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { parseGoogleMapsUrl } from '@/lib/maps';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { SearchableSelect } from '@/components/shared/SearchableSelect';
import { Map, MapControls, MapMarker, MarkerContent } from '@/components/ui/map';
import { getDeliveryStatusStyle } from '@/domains/admin/utils/statusStyles';

interface LogisticsSectionProps {
    form: any;
    formValues: any;
    activeStopIndex: number;
    setActiveStopIndex: (index: number) => void;
    mapViewport: any;
    pinCoords: [number, number] | null;
    setPinCoords: (coords: [number, number] | null) => void;
    handleMapClick: (e: any) => void;
    handlePinDragEnd: (lngLat: { lng: number; lat: number }) => void;
    setMapViewport: (fn: ((prev: any) => any) | any) => void;
    locationsData: { data: any[] } | undefined;
    driversData: { data: any[] } | undefined;
}



/**
 * Presentational section for logistics planning:
 * multi-stop sidebar list, active-stop form fields, and the
 * interactive MapLibre coordinate picker.
 * Rule-compliant: semantic tokens only, standard Tailwind sizes,
 * all strings via t().
 */
const LogisticsSection = ({
    form,
    formValues,
    activeStopIndex,
    setActiveStopIndex,
    mapViewport,
    setMapViewport,
    pinCoords,
    setPinCoords,
    handleMapClick,
    handlePinDragEnd,
    locationsData,
    driversData,
}: LogisticsSectionProps) => {
    const { t } = useTranslation(['admin']);
    const stops: any[] = formValues.stops || [];

    /** Intercepts paste events on the link input and resolves Google Maps URLs to coordinates. */
    const handleGoogleMapsPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        const text = e.clipboardData.getData('text');
        const coords = parseGoogleMapsUrl(text);
        if (coords) {
            e.preventDefault();
            const updated = [...stops];
            updated[activeStopIndex] = {
                ...updated[activeStopIndex],
                dropoff_latitude: Number(coords.lat.toFixed(6)),
                dropoff_longitude: Number(coords.lng.toFixed(6)),
                ...(coords.address ? { dropoff_address: coords.address } : {}),
            };
            form.setFieldValue('stops', updated);
            setPinCoords([coords.lng, coords.lat]);
            setMapViewport((prev: any) => ({ ...prev, center: [coords.lng, coords.lat], zoom: 16 }));
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between border-b pb-2">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Layers className="size-4 text-primary" />
                    {t('admin:logistics_details') || 'Logistics & Dispatch'}
                </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Stops Sidebar */}
                <div className="md:col-span-1 border-r pr-4 space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            {t('admin:stops_list', { count: stops.length }) || `Stops (${stops.length})`}
                        </span>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-[10px] gap-1 font-semibold border-dashed border-primary text-primary hover:bg-primary/10"
                            onClick={() => {
                                const updated = [...stops];
                                updated.push({
                                    weight_kg: 0,
                                    dropoff_address: '',
                                    dropoff_latitude: null,
                                    dropoff_longitude: null,
                                    origin_hub_id: updated[updated.length - 1]?.origin_hub_id || '',
                                    current_hub_id: updated[updated.length - 1]?.current_hub_id || '',
                                    driver_id: updated[updated.length - 1]?.driver_id || '',
                                    status: 'pending',
                                    sequence_number: updated.length + 1,
                                    scheduled_at: '',
                                });
                                form.setFieldValue('stops', updated);
                                setActiveStopIndex(updated.length - 1);
                            }}
                        >
                            <Plus className="size-3" />
                            {t('admin:add_stop') || 'Add Stop'}
                        </Button>
                    </div>

                    {/* Stops list */}
                    <div className="max-h-[30rem] overflow-y-auto space-y-2 pr-1">
                        {stops.map((stop: any, idx: number) => (
                            <div
                                key={idx}
                                className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all duration-200 ${
                                    idx === activeStopIndex
                                        ? 'bg-primary/5 border-primary shadow-sm ring-1 ring-primary/20'
                                        : 'bg-muted/10 hover:bg-muted/30 border-border'
                                }`}
                                onClick={() => setActiveStopIndex(idx)}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <Badge
                                        variant="outline"
                                        className={`text-[10px] font-semibold uppercase ${
                                            idx === activeStopIndex
                                                ? 'border-primary/30 bg-primary text-primary-foreground'
                                                : 'border-border bg-muted text-muted-foreground'
                                        }`}
                                    >
                                        {t('admin:stop_n', { defaultValue: 'Stop {{sequence_number}}', sequence_number: stop.sequence_number || idx + 1 })}
                                    </Badge>
                                    {stops.length > 1 && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="size-5 text-destructive hover:bg-destructive/10"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const updated = [...stops];
                                                updated.splice(idx, 1);
                                                form.setFieldValue('stops', updated);
                                                setActiveStopIndex(Math.max(0, idx - 1));
                                            }}
                                        >
                                            <Trash2 className="size-3" />
                                        </Button>
                                    )}
                                </div>
                                <span className="text-[10px] font-medium text-foreground block truncate">
                                    {stop.dropoff_address || t('admin:no_address') || 'No address entered'}
                                </span>
                                <div className="flex items-center gap-1.5 mt-1.5">
                                    <span className="text-[9px] text-muted-foreground font-mono">
                                        {stop.weight_kg ? `${stop.weight_kg} kg` : '0 kg'}
                                    </span>
                                    <span className="text-[9px] text-muted-foreground font-mono">•</span>
                                    <Badge
                                        variant="outline"
                                        className={`text-[9px] font-semibold capitalize ${getDeliveryStatusStyle(stop.status)}`}
                                    >
                                        {stop.status ? stop.status.replace(/_/g, ' ') : ''}
                                    </Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Active Stop Editor + Map Picker */}
                <div className="md:col-span-2 space-y-4">
                    {/* Active stop indicator */}
                    <div className="bg-primary/5 p-3 rounded-lg border border-primary/20">
                        <span className="text-xs font-semibold text-primary block uppercase">
                            {t('admin:editing_stop', { defaultValue: 'Editing Stop {{sequence_number}}', sequence_number: stops[activeStopIndex]?.sequence_number || activeStopIndex + 1 })}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                            {t('admin:editing_stop_desc') ||
                                'Update details and pick geographic location below for this specific stop.'}
                        </span>
                    </div>

                    {/* Weight / Status / Sequence */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold flex items-center gap-1">
                                <Scale className="size-3 text-muted-foreground" />
                                {t('admin:weight_kg') || 'Weight (KG)'}
                            </Label>
                            <Input
                                type="number"
                                step="0.1"
                                min="0"
                                className="h-9"
                                value={stops[activeStopIndex]?.weight_kg || 0}
                                onChange={(e) => {
                                    const updated = [...stops];
                                    updated[activeStopIndex] = {
                                        ...updated[activeStopIndex],
                                        weight_kg: Number(e.target.value),
                                    };
                                    form.setFieldValue('stops', updated);
                                }}
                            />
                        </div>

                        <div className="space-y-1.5 flex flex-col justify-end">
                            <Label className="text-xs font-semibold flex items-center gap-1">
                                <Activity className="size-3 text-muted-foreground" />
                                {t('admin:status') || 'Status'}
                            </Label>
                            <Select
                                value={stops[activeStopIndex]?.status || 'pending'}
                                onValueChange={(val) => {
                                    const updated = [...stops];
                                    updated[activeStopIndex] = {
                                        ...updated[activeStopIndex],
                                        status: val as any,
                                    };
                                    form.setFieldValue('stops', updated);
                                }}
                            >
                                <SelectTrigger className="!h-9">
                                    <SelectValue placeholder={t('admin:status') || 'Status'} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pending">{t('admin:pending') || 'Pending'}</SelectItem>
                                    <SelectItem value="at_hub">{t('admin:at_hub') || 'At Hub'}</SelectItem>
                                    <SelectItem value="linehaul">{t('admin:linehaul') || 'Linehaul'}</SelectItem>
                                    <SelectItem value="out_for_delivery">
                                        {t('admin:out_for_delivery') || 'Out For Delivery'}
                                    </SelectItem>
                                    <SelectItem value="delivered">{t('admin:delivered') || 'Delivered'}</SelectItem>
                                    <SelectItem value="failed">{t('admin:failed') || 'Failed'}</SelectItem>
                                    <SelectItem value="rescheduled">{t('admin:rescheduled') || 'Rescheduled'}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5 flex flex-col justify-end">
                            <Label className="text-xs font-semibold flex items-center gap-1">
                                <Layers className="size-3 text-muted-foreground" />
                                {t('admin:stop_sequence') || 'Stop Sequence'}
                            </Label>
                            <Input
                                type="number"
                                min="1"
                                className="h-9 font-semibold text-primary"
                                value={stops[activeStopIndex]?.sequence_number || activeStopIndex + 1}
                                onChange={(e) => {
                                    const updated = [...stops];
                                    updated[activeStopIndex] = {
                                        ...updated[activeStopIndex],
                                        sequence_number: Number(e.target.value),
                                    };
                                    form.setFieldValue('stops', updated);
                                }}
                            />
                        </div>
                    </div>

                    {/* Hub selectors */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5 flex flex-col">
                            <Label className="text-xs font-semibold">{t('admin:origin_hub') || 'Origin Hub'}</Label>
                            <SearchableSelect
                                options={locationsData?.data || []}
                                value={stops[activeStopIndex]?.origin_hub_id || ''}
                                onChange={(val: string | null) => {
                                    const updated = [...stops];
                                    updated[activeStopIndex] = {
                                        ...updated[activeStopIndex],
                                        origin_hub_id: val || '',
                                    };
                                    form.setFieldValue('stops', updated);
                                }}
                                placeholder={t('admin:select_hub') || 'Select Hub'}
                                getOptionValue={(l: any) => l.id}
                                getOptionLabel={(l: any) => l.name}
                            />
                        </div>

                        <div className="space-y-1.5 flex flex-col">
                            <Label className="text-xs font-semibold">{t('admin:current_hub') || 'Current Hub'}</Label>
                            <SearchableSelect
                                options={locationsData?.data || []}
                                value={stops[activeStopIndex]?.current_hub_id || ''}
                                onChange={(val: string | null) => {
                                    const updated = [...stops];
                                    updated[activeStopIndex] = {
                                        ...updated[activeStopIndex],
                                        current_hub_id: val || '',
                                    };
                                    form.setFieldValue('stops', updated);
                                }}
                                placeholder={t('admin:select_hub') || 'Select Hub'}
                                getOptionValue={(l: any) => l.id}
                                getOptionLabel={(l: any) => l.name}
                            />
                        </div>
                    </div>

                    {/* Driver & Scheduled Time */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5 flex flex-col">
                            <Label className="text-xs font-semibold">
                                {t('admin:assigned_driver') || 'Assign Driver (Optional)'}
                            </Label>
                            <SearchableSelect
                                options={driversData?.data || []}
                                value={stops[activeStopIndex]?.driver_id || ''}
                                onChange={(val: string | null) => {
                                    const updated = [...stops];
                                    updated[activeStopIndex] = {
                                        ...updated[activeStopIndex],
                                        driver_id: val || '',
                                    };
                                    form.setFieldValue('stops', updated);
                                }}
                                placeholder={t('admin:select_driver') || 'Unassigned / Available'}
                                getOptionValue={(d: any) => d.id}
                                getOptionLabel={(d: any) => `${d.name} (${d.phone})`}
                                getOptionSearchTerms={(d: any) => [d.name, d.phone]}
                                renderOption={(d: any) => (
                                    <div className="flex flex-col py-0.5">
                                        <span className="font-semibold text-xs text-foreground">{d.name}</span>
                                        <span className="text-[10px] text-muted-foreground font-mono">{d.phone}</span>
                                    </div>
                                )}
                            />
                        </div>

                        <div className="space-y-1.5 flex flex-col">
                            <Label className="text-xs font-semibold flex items-center gap-1">
                                <Calendar className="size-3.5 text-muted-foreground" />
                                {t('admin:scheduled_at') || 'Scheduled Time (Optional)'}
                            </Label>
                            <Input
                                type="datetime-local"
                                className="h-9"
                                value={stops[activeStopIndex]?.scheduled_at || ''}
                                onChange={(e) => {
                                    const updated = [...stops];
                                    updated[activeStopIndex] = {
                                        ...updated[activeStopIndex],
                                        scheduled_at: e.target.value || '',
                                    };
                                    form.setFieldValue('stops', updated);
                                }}
                            />
                        </div>
                    </div>

                    {/* Dropoff Address */}
                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">
                            {t('admin:dropoff_address') || 'Dropoff Address'}
                        </Label>
                        <Textarea
                            placeholder="Street, City, Block detail..."
                            className="min-h-[60px] resize-none text-xs"
                            value={stops[activeStopIndex]?.dropoff_address || ''}
                            onChange={(e) => {
                                const updated = [...stops];
                                updated[activeStopIndex] = {
                                    ...updated[activeStopIndex],
                                    dropoff_address: e.target.value,
                                };
                                form.setFieldValue('stops', updated);
                            }}
                        />
                    </div>

                    {/* Coordinate Picker */}
                    <div className="space-y-2 pt-2">
                        <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                            <MapPin className="size-4 text-primary animate-bounce" />
                            {t('admin:dropoff_geo_location') || 'Dropoff Coordinate Picker'}
                        </Label>
                        <div className="text-[10px] text-muted-foreground pb-1">
                            {t('admin:map_instructions') ||
                                'Click on the map or drag the pin to assign exact drop-off coordinates.'}
                        </div>

                        {/* Google Maps link paste input */}
                        <div className="space-y-1.5">
                            <div className="relative">
                                <Input
                                    type="text"
                                    placeholder={t('admin:paste_google_maps_link') || 'Paste Google Maps link to auto-fill coordinates...'}
                                    className="h-9 text-xs bg-background pr-10 border-dashed focus:border-solid"
                                    onPaste={handleGoogleMapsPaste}
                                    onChange={() => {}}
                                />
                                <Link2 className="size-3.5 text-muted-foreground/40 absolute right-3 top-1/2 -translate-y-1/2" />
                            </div>
                            {stops[activeStopIndex]?.dropoff_latitude && (
                                <div className="flex items-center gap-1 text-[10px] font-semibold text-success">
                                    <MapPin className="size-3" />
                                    {t('admin:gps_fixed') || 'GPS coordinates locked'}
                                </div>
                            )}
                        </div>

                        {/* Coordinate display chips */}
                        <div className="grid grid-cols-2 gap-3 mb-2">
                            <div className="bg-muted/30 border rounded-md p-1 px-2 text-center">
                                <span className="text-[9px] uppercase tracking-wider text-muted-foreground block font-semibold">
                                    {t('admin:lat') || 'LAT'}
                                </span>
                                <span className="text-xs font-semibold font-mono text-primary">
                                    {stops[activeStopIndex]?.dropoff_latitude || '-'}
                                </span>
                            </div>
                            <div className="bg-muted/30 border rounded-md p-1 px-2 text-center">
                                <span className="text-[9px] uppercase tracking-wider text-muted-foreground block font-semibold">
                                    {t('admin:lng') || 'LNG'}
                                </span>
                                <span className="text-xs font-semibold font-mono text-primary">
                                    {stops[activeStopIndex]?.dropoff_longitude || '-'}
                                </span>
                            </div>
                        </div>

                        {/* Map */}
                        <div className="h-72 w-full relative overflow-hidden rounded-xl border shadow-inner">
                            <Map
                                viewport={mapViewport}
                                onViewportChange={setMapViewport}
                                onClick={handleMapClick}
                                className="h-full w-full"
                                language="km"
                            >
                                <MapControls position="top-right" showCompass />

                                {/* Active stop pin */}
                                {pinCoords && (
                                    <MapMarker
                                        longitude={pinCoords[0]}
                                        latitude={pinCoords[1]}
                                        draggable
                                        onDragEnd={handlePinDragEnd}
                                    >
                                        <MarkerContent>
                                            <div className="relative -top-6 flex flex-col items-center justify-center">
                                                <div className="size-8 rounded-full bg-primary flex items-center justify-center border-2 border-white shadow-lg animate-pulse">
                                                    <MapPin className="size-4 text-white" />
                                                </div>
                                                <div className="bg-background/90 text-[8px] font-semibold border p-0.5 px-1 rounded shadow-xs mt-1 border-primary/20">
                                                    {t('admin:stop_n', { defaultValue: 'STOP {{sequence_number}}', sequence_number: stops[activeStopIndex]?.sequence_number || activeStopIndex + 1 })}
                                                </div>
                                            </div>
                                        </MarkerContent>
                                    </MapMarker>
                                )}

                                {/* Other stops' pins */}
                                {stops.map((stop: any, idx: number) => {
                                    if (idx === activeStopIndex) return null;
                                    if (!stop.dropoff_longitude || !stop.dropoff_latitude) return null;
                                    return (
                                        <MapMarker
                                            key={idx}
                                            longitude={Number(stop.dropoff_longitude)}
                                            latitude={Number(stop.dropoff_latitude)}
                                            onClick={() => setActiveStopIndex(idx)}
                                        >
                                            <MarkerContent>
                                                <div className="relative cursor-pointer transition-transform duration-200 active:scale-90 flex flex-col items-center justify-center">
                                                    <div className="size-7 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center border-2 border-white shadow-md font-semibold text-[10px]">
                                                        {stop.sequence_number || idx + 1}
                                                    </div>
                                                </div>
                                            </MarkerContent>
                                        </MapMarker>
                                    );
                                })}
                            </Map>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LogisticsSection;

import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Map, MapMarker, MarkerContent, MapRoute } from '@/components/ui/map';
import { UserLocationMarker } from '@/components/shared/map/UserLocationMarker';
import { RoadRoute } from '@/components/shared/map/RoadRoute';
import { useAuthStore } from '@/domains/auth/store/useAuthStore';
import { useHeaderStore } from '../../store/useHeaderStore';
import { 
    AlertTriangle, 
    ClipboardList, 
    Compass,
    Target,
    MapPin
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Import refactored modular sub-components
import { MapFilterToggle } from './MapFilterToggle';
import { MapDetailDrawer } from './MapDetailDrawer';
import { ReportRoadblockModal } from './ReportRoadblockModal';
import { MapHeaderMenu } from './MapHeaderMenu';

// Import newly modularized components under Map/components
import { LockedPlacementPin } from './components/LockedPlacementPin';
import { AlternatePathsList } from './components/AlternatePathsList';
import { FloatingErrandTrigger } from './components/FloatingErrandTrigger';
import { ActiveNavigationOverlay } from './components/ActiveNavigationOverlay';

// Import hooks & types
import { useDriverMapState } from './hooks/useDriverMapState';
import { useDriverMapSocket } from './hooks/useDriverMapSocket';
import { StopItem, ErrandTask, RoadblockAlert } from './types';

const DriverMapPage = () => {
    const { t } = useTranslation();
    const { user } = useAuthStore();
    const setHeader = useHeaderStore(s => s.setHeader);

    // Mount state and query telemetry hook
    const mapState = useDriverMapState();

    const {
        viewport,
        setViewport,
        userLocation,
        activeFilter,
        setActiveFilter,
        selectedItem,
        setSelectedItem,
        selectedType,
        setSelectedType,
        isDrawerOpen,
        setIsDrawerOpen,
        showReportModal,
        setShowReportModal,
        clickedCoords,
        setClickedCoords,
        mapStyleOption,
        setMapStyleOption,
        routePlanningMode,
        setRoutePlanningMode,
        customRouteDestination,
        setCustomRouteDestination,
        customRoutes,
        setCustomRoutes,
        selectedCustomRouteIndex,
        setSelectedCustomRouteIndex,
        isRoutingLoading,
        pinPlacementMode,
        setPinPlacementMode,
        planningLeg2Route,
        setPlanningLeg2Route,
        isInteracting,

        activeNavTask,
        activeNavRoute,
        activeNavLeg,
        clearNavigation,

        deliveries,
        tasks,
        roadblocks,

        handleSelectTaskRoute,
        handleStartTaskNavigation,
        handleCompleteTask,
        handleArriveAtPickup,
        recenterToUser,
        handleMapClick,

        updateTaskStatusMutation,
        arriveMutation,
        startDeliveryMutation,
        reportRoadblockMutation,
    } = mapState;

    // Connect WebSocket listeners
    useDriverMapSocket({
        userId: user?.id,
        companyId: user?.company_id,
    });

    const googleKhmerStyle = useMemo(() => ({
        version: 8 as const,
        sources: {
            'google-tiles': {
                type: 'raster' as const,
                tiles: ['https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&hl=km'],
                tileSize: 256,
                attribution: '&copy; Google',
            },
        },
        layers: [
            {
                id: 'google-tiles',
                type: 'raster' as const,
                source: 'google-tiles',
                minzoom: 0,
                maxzoom: 22,
            },
        ],
    }), []);

    // Set page header title and right menu actions
    useEffect(() => {
        setHeader({ 
            title: t('live_map') || 'Live Map',
            showBackButton: true,
            backTarget: '/driver',
            rightAction: (
                <MapHeaderMenu 
                    mapStyleOption={mapStyleOption}
                    setMapStyleOption={setMapStyleOption}
                    routePlanningMode={routePlanningMode}
                    setRoutePlanningMode={(active) => {
                        setRoutePlanningMode(active);
                        setCustomRoutes([]);
                        setCustomRouteDestination(null);
                        setPinPlacementMode(false);
                    }}
                    onTriggerReportRoadblock={() => {
                        setPinPlacementMode(true);
                        setRoutePlanningMode(false);
                        setCustomRoutes([]);
                        setCustomRouteDestination(null);
                        setSelectedItem(null);
                        setSelectedType(null);
                    }}
                />
            )
        });
        return () => setHeader({});
    }, [setHeader, t, mapStyleOption, routePlanningMode, viewport.center]);

    // Lock parent main container scrolling and padding on mount, restore on unmount
    useEffect(() => {
        const mainEl = document.querySelector('main');
        if (mainEl) {
            const originalOverflow = mainEl.style.overflow;
            const originalPaddingBottom = mainEl.style.paddingBottom;

            mainEl.style.overflow = 'hidden';
            mainEl.style.paddingBottom = '0px';

            const hasPbClass = mainEl.classList.contains('pb-24');
            if (hasPbClass) {
                mainEl.classList.remove('pb-24');
            }

            return () => {
                mainEl.style.overflow = originalOverflow;
                mainEl.style.paddingBottom = originalPaddingBottom;
                if (hasPbClass) {
                    mainEl.classList.add('pb-24');
                }
            };
        }
    }, []);

    const nextImmediateStop = useMemo(() => {
        return (deliveries as StopItem[]).find(
            (stop) => stop.status === 'in_transit' || stop.status === 'pending' || stop.status === 'arrived'
        );
    }, [deliveries]);

    return (
        <div className="flex flex-col w-full h-[calc(100vh-136px)] relative overflow-hidden bg-background">
            {/* 1. Map Canvas Viewport */}
            <div className="flex-1 w-full h-full relative">
                <Map 
                    viewport={viewport} 
                    onViewportChange={setViewport} 
                    onClick={handleMapClick}
                    styles={mapStyleOption === 'google_khmer_hybrid' ? {
                        light: googleKhmerStyle,
                        dark: googleKhmerStyle
                    } as any : undefined}
                    className="h-full w-full"
                    language="km"
                >
                    {/* Active Driver GPS Pin */}
                    <UserLocationMarker coordinates={userLocation} />

                    {/* 1B. Draw Snap-To-Road Sequential Snapped Delivery Polylines */}
                    {activeFilter === 'deliveries' && !activeNavTask && deliveries.length > 1 && (deliveries as StopItem[]).map((stop, idx) => {
                        if (idx === deliveries.length - 1) return null;
                        const nextStop = deliveries[idx + 1] as StopItem;
                        const fromCoords: [number, number] = [stop.delivery.lng, stop.delivery.lat];
                        const toCoords: [number, number] = [nextStop.delivery.lng, nextStop.delivery.lat];
                        
                        if (!fromCoords[0] || !fromCoords[1] || !toCoords[0] || !toCoords[1]) return null;
                        
                        const isCompletedLeg = (stop.status === 'completed' || stop.status === 'skipped') && 
                                               (nextStop.status === 'completed' || nextStop.status === 'skipped');
                        
                        return (
                            <RoadRoute 
                                key={`delivery-leg-${stop.id}`}
                                from={fromCoords}
                                to={toCoords}
                                color={isCompletedLeg ? "#94a3b8" : "#3b82f6"}
                                width={isCompletedLeg ? 2.5 : 4}
                                opacity={isCompletedLeg ? 0.6 : 0.85}
                                dashArray={isCompletedLeg ? [5, 5] : undefined}
                            />
                        );
                    })}

                    {/* 1C. Draw Next Immediate Delivery Target Snapped Polyline */}
                    {activeFilter === 'deliveries' && !activeNavTask && userLocation && nextImmediateStop && nextImmediateStop.delivery?.lng && nextImmediateStop.delivery?.lat && (
                        <RoadRoute 
                            id="next-delivery-leg"
                            from={userLocation}
                            to={[nextImmediateStop.delivery.lng, nextImmediateStop.delivery.lat]}
                            color="#0ea5e9"
                            width={5}
                        />
                    )}

                    {/* 2A. Render Deliveries Markers */}
                    {activeFilter === 'deliveries' && (deliveries as StopItem[]).map((stop) => {
                        const dl = stop.delivery;
                        if (!dl.lng || !dl.lat) return null;

                        const isSelected = selectedType === 'delivery' && selectedItem?.id === stop.id;

                        return (
                            <MapMarker
                                key={stop.id}
                                longitude={dl.lng}
                                latitude={dl.lat}
                                onClick={() => {
                                    isInteracting.current = true;
                                    setSelectedItem(stop);
                                    setSelectedType('delivery');
                                    setIsDrawerOpen(true);
                                }}
                            >
                                <MarkerContent>
                                    <div className="relative cursor-pointer transition-transform duration-200 active:scale-95">
                                        {isSelected && (
                                            <div className="absolute inset-0 -m-2.5 rounded-full bg-primary/20 animate-ping" />
                                        )}
                                        <div className={cn(
                                            "w-9 h-9 rounded-full flex items-center justify-center font-bold border-2 border-white shadow-lg text-sm transition-all duration-200",
                                            (stop.status === 'completed' || stop.status === 'skipped') ? "bg-muted text-muted-foreground" : 
                                            stop.status === 'arrived' ? "bg-amber-500 text-white" :
                                            stop.status === 'in_transit' ? "bg-sky-500 text-white animate-pulse" :
                                            "bg-primary text-primary-foreground"
                                        )}>
                                            {stop.sequence_number}
                                        </div>
                                    </div>
                                </MarkerContent>
                            </MapMarker>
                        );
                    })}

                    {/* 2B. Render Tasks Markers */}
                    {activeFilter === 'tasks' && (tasks as ErrandTask[]).flatMap((task) => {
                        const markers = [];
                        const isSelected = selectedType === 'task' && selectedItem?.id === task.id;

                        // 1. Render Pickup Marker
                        if (task.pickup_lng && task.pickup_lat) {
                            markers.push(
                                <MapMarker
                                    key={`${task.id}-pickup`}
                                    longitude={task.pickup_lng}
                                    latitude={task.pickup_lat}
                                    onClick={() => {
                                        isInteracting.current = true;
                                        setSelectedItem(task);
                                        setSelectedType('task');
                                        setIsDrawerOpen(true);
                                    }}
                                >
                                    <MarkerContent>
                                        <div className="relative cursor-pointer transition-transform duration-200 active:scale-95">
                                            {isSelected && (
                                                <div className="absolute inset-0 -m-2.5 rounded-full bg-blue-500/20 animate-ping" />
                                            )}
                                            <div className={cn(
                                                "w-9 h-9 rounded-full flex flex-col items-center justify-center border-2 border-white shadow-lg transition-all duration-200 bg-blue-600 text-white font-extrabold"
                                            )}>
                                                <MapPin size={13} className="text-white" />
                                                <span className="text-[7px] font-black uppercase tracking-tighter leading-none mt-0.5">Pick</span>
                                            </div>
                                        </div>
                                    </MarkerContent>
                                </MapMarker>
                            );
                        }

                        // 2. Render Drop-off Marker
                        if (task.dropoff_lng && task.dropoff_lat) {
                            markers.push(
                                <MapMarker
                                    key={`${task.id}-dropoff`}
                                    longitude={task.dropoff_lng}
                                    latitude={task.dropoff_lat}
                                    onClick={() => {
                                        isInteracting.current = true;
                                        setSelectedItem(task);
                                        setSelectedType('task');
                                        setIsDrawerOpen(true);
                                    }}
                                >
                                    <MarkerContent>
                                        <div className="relative cursor-pointer transition-transform duration-200 active:scale-95">
                                            {isSelected && (
                                                <div className="absolute inset-0 -m-2.5 rounded-full bg-orange-500/20 animate-ping" />
                                            )}
                                            <div className={cn(
                                                "w-9 h-9 rounded-full flex flex-col items-center justify-center border-2 border-white shadow-lg transition-all duration-200",
                                                task.status === 'completed' ? "bg-muted text-muted-foreground" : "bg-orange-500 text-white"
                                            )}>
                                                <ClipboardList size={13} className="text-white" />
                                                <span className="text-[7px] font-black uppercase tracking-tighter leading-none mt-0.5">Drop</span>
                                            </div>
                                        </div>
                                    </MarkerContent>
                                </MapMarker>
                            );
                        }

                        return markers;
                    })}

                    {/* 2B-2. Connect Selected Task's Pickup and Drop-off with Errand Connection Line */}
                    {activeFilter === 'tasks' && selectedType === 'task' && selectedItem?.pickup_lng && selectedItem?.pickup_lat && selectedItem?.dropoff_lng && selectedItem?.dropoff_lat && (
                        <RoadRoute 
                            from={[selectedItem.pickup_lng, selectedItem.pickup_lat]}
                            to={[selectedItem.dropoff_lng, selectedItem.dropoff_lat]}
                            color="#3b82f6"
                            width={3.5}
                        />
                    )}

                    {/* 2C. Render Roadblock Hazards */}
                    {(roadblocks as RoadblockAlert[]).map((rb) => {
                        if (!rb.lng || !rb.lat) return null;
                        const isSelected = selectedType === 'roadblock' && selectedItem?.id === rb.id;

                        return (
                            <MapMarker
                                key={rb.id}
                                longitude={rb.lng}
                                latitude={rb.lat}
                                onClick={() => {
                                    isInteracting.current = true;
                                    setSelectedItem(rb);
                                    setSelectedType('roadblock');
                                    setIsDrawerOpen(true);
                                }}
                            >
                                <MarkerContent>
                                    <div className="relative cursor-pointer transition-transform duration-200 active:scale-90">
                                        {isSelected && (
                                            <div className="absolute inset-0 -m-3 rounded-full bg-destructive/20 animate-ping" />
                                        )}
                                        <div className="w-10 h-10 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center border-2 border-white shadow-xl">
                                            <AlertTriangle size={18} className="animate-pulse" />
                                        </div>
                                    </div>
                                </MarkerContent>
                            </MapMarker>
                        );
                    })}

                    {/* 2D. Render custom route planning OSRM paths */}
                    {routePlanningMode && customRoutes.length > 0 && (
                        <>
                            {/* Leg 1: Current Location -> Destination */}
                            <MapRoute 
                                id="planning-leg-1"
                                coordinates={customRoutes[selectedCustomRouteIndex].coordinates}
                                color="#0ea5e9"
                                width={5}
                            />
                            {/* Leg 2: Errand Pickup -> Drop-off */}
                            {planningLeg2Route && (
                                <MapRoute 
                                    id="planning-leg-2"
                                    coordinates={planningLeg2Route.coordinates}
                                    color="#2563eb"
                                    width={4}
                                    opacity={0.95}
                                />
                            )}
                        </>
                    )}

                    {/* 2E. Render custom route planning destination marker */}
                    {routePlanningMode && customRouteDestination && (
                        <MapMarker 
                            longitude={customRouteDestination[0]} 
                            latitude={customRouteDestination[1]}
                        >
                            <MarkerContent>
                                <div className="w-8 h-8 rounded-full bg-sky-500 text-white flex items-center justify-center border-2 border-white shadow-lg animate-bounce">
                                    <Target size={16} />
                                </div>
                            </MarkerContent>
                        </MapMarker>
                    )}

                    {/* 2F. Render active navigation route polyline */}
                    {!pinPlacementMode && activeNavTask && activeNavRoute && (
                        <MapRoute 
                            coordinates={activeNavRoute.coordinates}
                            color="#10b981"
                            width={6}
                        />
                    )}
                </Map>

                {/* Roadblock Placement Mode: Top Instruction Banner */}
                {pinPlacementMode && (
                    <div className="absolute top-4 left-4 right-4 z-30 max-w-sm mx-auto bg-card/95 backdrop-blur-md border border-border/50 rounded-2xl p-4 shadow-xl flex items-center justify-between gap-3 animate-in slide-in-from-top-6 duration-300">
                        <div className="flex gap-2.5 items-start">
                            <div className="w-8 h-8 rounded-full bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
                                <AlertTriangle size={16} className="animate-pulse" />
                            </div>
                            <div className="flex flex-col gap-0.5 min-w-0">
                                <span className="text-xs font-black tracking-tight text-foreground leading-none">Position Alert Pin</span>
                                <span className="text-[10px] font-bold text-muted-foreground leading-normal">
                                    Drag map to center the alert pin on the hazard.
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={() => setPinPlacementMode(false)}
                            className="h-8 px-3 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-[10px] font-black uppercase tracking-wider transition-all"
                        >
                            Cancel
                        </button>
                    </div>
                )}

                {/* Roadblock Placement Mode: Dead-Center Hovering Locked Pin */}
                <LockedPlacementPin visible={pinPlacementMode} />

                {/* 3. Floating Filter Toggle Segment */}
                {!pinPlacementMode && (
                    <MapFilterToggle 
                        activeFilter={activeFilter} 
                        onChange={(filter) => {
                            setActiveFilter(filter);
                            setSelectedItem(null);
                            setSelectedType(null);
                        }} 
                    />
                )}

                {/* 3B. Glassmorphic OSRM Alternative Route options list */}
                <AlternatePathsList 
                    visible={!pinPlacementMode && routePlanningMode}
                    routes={customRoutes}
                    selectedIndex={selectedCustomRouteIndex}
                    onSelect={setSelectedCustomRouteIndex}
                    onClose={() => {
                        setCustomRoutes([]);
                        setCustomRouteDestination(null);
                        setRoutePlanningMode(false);
                        setPlanningLeg2Route(null);
                        setIsDrawerOpen(false);
                        setSelectedItem(null);
                        setSelectedType(null);
                    }}
                />

                {/* Roadblock Placement Mode: Confirm Hazard Location Bottom Button */}
                {pinPlacementMode && (
                    <div className="absolute bottom-6 left-4 right-4 z-30 max-w-sm mx-auto animate-in slide-in-from-bottom duration-300">
                        <button
                            onClick={() => {
                                setClickedCoords({
                                    lng: viewport.center[0],
                                    lat: viewport.center[1]
                                });
                                setPinPlacementMode(false);
                                setShowReportModal(true);
                            }}
                            className="w-full h-12 rounded-2xl bg-destructive hover:bg-destructive/90 text-white font-bold flex items-center justify-center gap-2 shadow-xl border border-destructive/20 active:scale-95 transition-all duration-150"
                        >
                            <AlertTriangle size={18} />
                            <span>Confirm Hazard Location</span>
                        </button>
                    </div>
                )}

                {/* 4. Recenter floating FAB button */}
                {!pinPlacementMode && (
                    <button
                        onClick={recenterToUser}
                        className="absolute bottom-[30px] right-4 z-10 w-10 h-10 bg-background/85 backdrop-blur-md border border-border/50 text-foreground flex items-center justify-center rounded-full shadow-lg active:scale-90 transition-all duration-150"
                        title="Recenter GPS Position"
                    >
                        <Compass size={20} className="text-primary animate-spin-slow" />
                    </button>
                )}

                {/* Floating Re-open Drawer Button during Errand route planning */}
                <FloatingErrandTrigger 
                    visible={!pinPlacementMode && routePlanningMode && !isDrawerOpen && !!selectedItem}
                    onClick={() => setIsDrawerOpen(true)}
                />

                {/* 4B. Active navigation Live Driving Action Bar overlay */}
                <ActiveNavigationOverlay 
                    task={activeNavTask}
                    route={activeNavRoute}
                    leg={activeNavLeg}
                    isPending={updateTaskStatusMutation.isPending || arriveMutation.isPending}
                    onArriveAtPickup={handleArriveAtPickup}
                    onCompleteTask={(id) => {
                        const isDelivery = !!activeNavTask?.delivery;
                        if (isDelivery) {
                            // Navigate to stop details screen to let the driver complete/fail it
                            clearNavigation();
                        } else {
                            handleCompleteTask(id);
                        }
                    }}
                    onArriveAtDeliveryStop={(id) => arriveMutation.mutate(id)}
                    onStop={() => {
                        clearNavigation();
                    }}
                />
            </div>

            {/* 5. Glassmorphic Sliding Drawer Overlay */}
            <MapDetailDrawer 
                isOpen={isDrawerOpen}
                selectedItem={selectedItem} 
                selectedType={selectedType} 
                onDismiss={() => {
                    setIsDrawerOpen(false);
                    // Only clear the selection fully if we are not in active route planning mode
                    if (!routePlanningMode) {
                        setSelectedItem(null);
                        setSelectedType(null);
                    }
                }} 
                onSelectTaskRoute={handleSelectTaskRoute}
                onStartTaskNavigation={handleStartTaskNavigation}
                hasRoutesPlanned={customRoutes.length > 0}
                isTaskInProgress={updateTaskStatusMutation.isPending || arriveMutation.isPending || startDeliveryMutation.isPending}
            />

            {/* 6. Custom Report Roadblock/Hazard Dialog Overlay */}
            <ReportRoadblockModal 
                isOpen={showReportModal} 
                onClose={() => {
                    setShowReportModal(false);
                    setClickedCoords(null);
                }} 
                clickedCoords={clickedCoords} 
                onSubmit={(description, type) => {
                    reportRoadblockMutation.mutate({ description, type });
                }} 
                isPending={reportRoadblockMutation.isPending} 
            />
        </div>
    );
};

export default DriverMapPage;

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Map, MapControls, MapMarker, MarkerContent, MapRoute } from '@/components/ui/map';
import { UserLocationMarker } from '@/components/shared/map/UserLocationMarker';
import { useAuthStore } from '@/domains/auth/store/useAuthStore';
import { useHeaderStore } from '../../store/useHeaderStore';
import { useLocationStore } from '../../store/useLocationStore';
import { pwaToast as toast } from '../../store/usePwaToastStore';
import { echo } from '@/lib/echo';
import api from '@/lib/api';
import { 
    AlertTriangle, 
    ClipboardList, 
    Package,
    Compass,
    Navigation,
    Target,
    X,
    MapPin
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Import refactored modular sub-components
import { MapFilterToggle } from './MapFilterToggle';
import { MapDetailDrawer } from './MapDetailDrawer';
import { ReportRoadblockModal } from './ReportRoadblockModal';
import { MapHeaderMenu } from './MapHeaderMenu';

import { useUpdateTaskStatus } from '../../hooks/useDriverTasks';

interface RoadblockAlert {
    id: string;
    description: string;
    type: string;
    lng: number;
    lat: number;
    created_at: string;
}

const DriverMapPage = () => {
    const { t } = useTranslation(['delivery', 'driver']);
    const { user } = useAuthStore();
    const queryClient = useQueryClient();
    const setHeader = useHeaderStore(s => s.setHeader);
    const updateTaskStatusMutation = useUpdateTaskStatus();
    
    // Track user location from background location store
    const { latitude: userLat, longitude: userLng } = useLocationStore();
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

    // Active tab: 'deliveries' or 'tasks'
    const [activeFilter, setActiveFilter] = useState<'deliveries' | 'tasks'>('deliveries');
    
    // Bottom drawer selection state
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [selectedType, setSelectedType] = useState<'delivery' | 'task' | 'roadblock' | null>(null);

    // Report roadblock state
    const [showReportModal, setShowReportModal] = useState(false);
    const [clickedCoords, setClickedCoords] = useState<{ lng: number; lat: number } | null>(null);

    // Map viewport state
    const [viewport, setViewport] = useState({
        center: [104.883628, 11.564134] as [number, number],
        zoom: 13,
        bearing: 0,
        pitch: 0,
    });

    const isInteracting = useRef(false);

    // Map style state and custom Google Khmer tiles definition
    const [mapStyleOption, setMapStyleOption] = useState<'default' | 'google_khmer_hybrid'>('google_khmer_hybrid');
    
    // OSRM Custom routing planning states
    const [routePlanningMode, setRoutePlanningMode] = useState(false);
    const [customRouteDestination, setCustomRouteDestination] = useState<[number, number] | null>(null);
    const [customRoutes, setCustomRoutes] = useState<any[]>([]);
    const [selectedCustomRouteIndex, setSelectedCustomRouteIndex] = useState(0);
    const [isRoutingLoading, setIsRoutingLoading] = useState(false);

    // Roadblock interactive placement states
    const [pinPlacementMode, setPinPlacementMode] = useState(false);

    // Active navigation states for Errand Tasks
    const [activeNavTask, setActiveNavTask] = useState<any | null>(null);
    const [activeNavRoute, setActiveNavRoute] = useState<any | null>(null);

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
            title: t('delivery:live_map') || 'Live Map',
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

    // Update center when user location becomes available
    useEffect(() => {
        if (userLat && userLng) {
            const loc: [number, number] = [userLng, userLat];
            setUserLocation(loc);
            setViewport(prev => ({
                ...prev,
                center: loc
            }));
        }
    }, [userLat, userLng]);

    // Query active route stops (deliveries)
    const { data: routeData } = useQuery({
        queryKey: ['driver', 'route', 'active'],
        queryFn: async () => {
            const { data } = await api.get('/driver/route/active');
            return data.data;
        }
    });

    // Query active tasks (errands)
    const { data: tasksData } = useQuery({
        queryKey: ['driver', 'tasks'],
        queryFn: async () => {
            const { data } = await api.get('/driver/tasks');
            return data.data;
        }
    });

    // Query active roadblocks (road alerts in last 24h)
    const { data: roadblocksData } = useQuery<RoadblockAlert[]>({
        queryKey: ['driver', 'road-alerts'],
        queryFn: async () => {
            const { data } = await api.get('/driver/road-alerts');
            return data.data;
        }
    });

    // Mutation to submit a newly reported roadblock hazard
    const reportRoadblockMutation = useMutation({
        mutationFn: async ({ description, type }: { description: string; type: string }) => {
            if (!clickedCoords) return;
            const { data } = await api.post('/driver/road-alerts', {
                description,
                type,
                lng: clickedCoords.lng,
                lat: clickedCoords.lat
            });
            return data;
        },
        onSuccess: () => {
            toast.success("Road hazard reported successfully!");
            if ('vibrate' in navigator) {
                navigator.vibrate([100, 50, 100]);
            }
            setShowReportModal(false);
            setClickedCoords(null);
            queryClient.invalidateQueries({ queryKey: ['driver', 'road-alerts'] });
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || "Failed to submit hazard report");
        }
    });

    // Extract markers list
    const deliveries = useMemo(() => routeData?.stops || [], [routeData]);
    const tasks = useMemo(() => tasksData || [], [tasksData]);
    const roadblocks = useMemo(() => roadblocksData || [], [roadblocksData]);

    // Echo listener for real-time roadblocks
    useEffect(() => {
        if (!user?.company_id) return;

        const channelName = `company.${user.company_id}`;
        
        echo.private(channelName)
            .listen('.road-alert.created', (e: any) => {
                toast.warning(`Road Alert: ${e.alertData.description}`, {
                    description: "Dispatched by Command Center"
                });

                if ('vibrate' in navigator) {
                    navigator.vibrate([200, 100, 200]);
                }

                queryClient.invalidateQueries({ queryKey: ['driver', 'road-alerts'] });
            });

        return () => {
            echo.leave(channelName);
        };
    }, [user?.company_id, queryClient]);

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

    const handleSelectTaskRoute = async (task: any) => {
        // If task is not started, navigate to Pickup first if available, otherwise Drop-off.
        // If task is in_progress, navigate directly to Drop-off.
        const usePickup = task.status === 'assigned' && task.pickup_lng && task.pickup_lat;
        const destLng = usePickup ? task.pickup_lng : (task.dropoff_lng || task.pickup_lng);
        const destLat = usePickup ? task.pickup_lat : (task.dropoff_lat || task.pickup_lat);
        
        if (!destLat || !destLng) {
            toast.error("Errand Task has no valid coordinates.");
            return;
        }
        
        const dest: [number, number] = [destLng, destLat];
        setCustomRouteDestination(dest);
        setIsRoutingLoading(true);
        setRoutePlanningMode(true);
        
        // Prioritize latest live user GPS coordinates as the starting point
        const startPoint: [number, number] = (userLng && userLat) 
            ? [userLng, userLat] 
            : (userLocation || viewport.center);
        
        try {
            const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${startPoint[0]},${startPoint[1]};${dest[0]},${dest[1]}?overview=full&geometries=geojson&alternatives=true`);
            const data = await response.json();
            
            if (data.code === 'Ok' && data.routes?.length > 0) {
                const routesList = data.routes.map((r: any) => ({
                    coordinates: r.geometry.coordinates,
                    distance: r.distance,
                    duration: r.duration
                }));
                setCustomRoutes(routesList);
                setSelectedCustomRouteIndex(0);
            } else {
                toast.error("Could not trace route to this errand destination.");
            }
        } catch (err) {
            console.error("Task OSRM route planning failure:", err);
            toast.error("Routing server error. Please try again.");
        } finally {
            setIsRoutingLoading(false);
        }
    };

    const handleStartTaskNavigation = (task: any) => {
        if (customRoutes.length === 0) return;
        const selectedRoute = customRoutes[selectedCustomRouteIndex];
        
        updateTaskStatusMutation.mutate({
            taskId: task.id,
            status: 'in_progress'
        }, {
            onSuccess: (updatedTask) => {
                setActiveNavTask(updatedTask);
                setActiveNavRoute(selectedRoute);
                setRoutePlanningMode(false);
                setCustomRoutes([]);
                setCustomRouteDestination(null);
                setSelectedItem(null);
                setSelectedType(null);
                queryClient.invalidateQueries({ queryKey: ['driver', 'tasks'] });
            }
        });
    };

    const handleCompleteTask = (taskId: string) => {
        updateTaskStatusMutation.mutate({
            taskId,
            status: 'completed'
        }, {
            onSuccess: () => {
                setActiveNavTask(null);
                setActiveNavRoute(null);
                queryClient.invalidateQueries({ queryKey: ['driver', 'tasks'] });
            }
        });
    };

    const recenterToUser = () => {
        if (userLocation) {
            setViewport(prev => ({
                ...prev,
                center: userLocation,
                zoom: 14
            }));
            toast.info("Centered to current position");
        } else {
            toast.error("Waiting for GPS coordinates...");
        }
    };

    const handleMapClick = async (e: any) => {
        if (isInteracting.current) {
            isInteracting.current = false;
            return;
        }

        if (selectedItem) {
            setSelectedItem(null);
            setSelectedType(null);
            return;
        }

        if (routePlanningMode) {
            const coords = e.lngLat;
            if (!coords) return;
            
            const dest: [number, number] = [coords.lng, coords.lat];
            setCustomRouteDestination(dest);
            setIsRoutingLoading(true);

            // Active GPS start position (fallback to map center)
            const startPoint: [number, number] = userLocation || viewport.center;
            
            try {
                const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${startPoint[0]},${startPoint[1]};${dest[0]},${dest[1]}?overview=full&geometries=geojson&alternatives=true`);
                const data = await response.json();
                
                if (data.code === 'Ok' && data.routes?.length > 0) {
                    const routesList = data.routes.map((r: any) => ({
                        coordinates: r.geometry.coordinates,
                        duration: r.duration,
                        distance: r.distance,
                    }));
                    setCustomRoutes(routesList);
                    setSelectedCustomRouteIndex(0);
                    toast.success(`Found ${routesList.length} route options!`);
                } else {
                    toast.error("Could not trace route to this destination.");
                }
            } catch (err) {
                console.error("OSRM Route planning failure:", err);
                toast.error("Routing server error. Please try again.");
            } finally {
                setIsRoutingLoading(false);
            }
        }
    };

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

                {/* <MapControls
                    showCompass={true}
                    showZoom={false}
                    position="bottom-right"
                /> */}


                    {/* Active Driver GPS Pin */}
                    <UserLocationMarker coordinates={userLocation} />

                    {/* 2A. Render Deliveries Markers */}
                    {activeFilter === 'deliveries' && deliveries.map((stop: any) => {
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
                                }}
                            >
                                <MarkerContent>
                                    <div className="relative cursor-pointer transition-transform duration-200 active:scale-95">
                                        {isSelected && (
                                            <div className="absolute inset-0 -m-2.5 rounded-full bg-primary/20 animate-ping" />
                                        )}
                                        <div className={cn(
                                            "w-9 h-9 rounded-full flex items-center justify-center font-bold border-2 border-white shadow-lg text-sm transition-all duration-200",
                                            stop.status === 'completed' ? "bg-muted text-muted-foreground" : 
                                            stop.status === 'arrived' ? "bg-amber-500 text-white" :
                                            "bg-primary text-primary-foreground"
                                        )}>
                                            {stop.sequence_number}
                                        </div>
                                    </div>
                                </MarkerContent>
                            </MapMarker>
                        );
                    })}

                    {/* 2B. Render Tasks Markers (both Pickup and Drop-off markers) */}
                    {activeFilter === 'tasks' && tasks.flatMap((task: any) => {
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
                        <MapRoute 
                            coordinates={[
                                [selectedItem.pickup_lng, selectedItem.pickup_lat],
                                [selectedItem.dropoff_lng, selectedItem.dropoff_lat]
                            ]}
                            color="#3b82f6"
                            width={3.5}
                        />
                    )}

                    {/* 2C. Render Roadblock Hazards (⚠️ warning triangle signs) */}
                    {roadblocks.map((rb) => {
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
                        <MapRoute 
                            coordinates={customRoutes[selectedCustomRouteIndex].coordinates}
                            color="#0ea5e9"
                            width={5}
                            animate
                        />
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
                            animate
                        />
                    )}
                </Map>

                {/* Roadblock Placement Mode: Top Instruction Banner */}
                {pinPlacementMode && (
                    <div className="absolute top-4 left-4 right-4 z-30 max-w-sm mx-auto bg-card/95 backdrop-blur-md border border-border/50 rounded-2xl p-4 shadow-xl flex items-center justify-between gap-3 animate-in slide-in-from-top-6 duration-300">
                        <div className="flex gap-2.5 items-start">
                            <div className="w-8 h-8 rounded-full bg-destructive/10 text-destructive flex items-center justify-center shrink-0 mt-0.5">
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
                {pinPlacementMode && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-20">
                        <div className="relative flex flex-col items-center">
                            <div className="w-12 h-12 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center border-[3px] border-white shadow-2xl animate-bounce pointer-events-none select-none">
                                <AlertTriangle size={22} className="animate-pulse" />
                            </div>
                            <div className="w-3 h-3 bg-white rotate-45 -mt-1.5 shadow-md border-r border-b border-white" />
                        </div>
                    </div>
                )}

                {/* 3. Floating Filter Toggle Segment (Top Floating, h-11) */}
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
                {!pinPlacementMode && routePlanningMode && customRoutes.length > 0 && (
                    <div className="absolute top-[72px] left-4 right-4 z-30 max-w-sm mx-auto bg-background/85 backdrop-blur-md border border-border/50 rounded-2xl p-4 shadow-xl space-y-3 animate-in slide-in-from-top duration-250">
                        <div className="flex justify-between items-center border-b border-border/50 pb-2">
                            <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                                <Navigation size={14} className="text-primary animate-pulse" />
                                Alternate Paths
                            </h4>
                            <button 
                                onClick={() => {
                                    setCustomRoutes([]);
                                    setCustomRouteDestination(null);
                                }}
                                className="w-6 h-6 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/80 text-muted-foreground transition-all"
                            >
                                <X size={14} />
                            </button>
                        </div>
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                            {customRoutes.map((route, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setSelectedCustomRouteIndex(idx)}
                                    className={cn(
                                        "w-full text-left p-3 rounded-xl border transition-all flex justify-between items-center gap-2",
                                        idx === selectedCustomRouteIndex 
                                            ? "bg-primary/10 border-primary text-primary shadow-sm" 
                                            : "bg-muted/30 border-border/50 hover:bg-muted/50 text-muted-foreground"
                                    )}
                                >
                                    <div className="flex flex-col">
                                        <span className="font-black text-xs text-foreground">
                                            Route #{idx + 1} {idx === 0 && "(Fastest)"}
                                        </span>
                                        <span className="text-[10px] font-semibold text-muted-foreground">
                                            {(route.distance / 1000).toFixed(2)} km
                                        </span>
                                    </div>
                                    <span className="font-bold text-xs text-foreground">
                                        {Math.round(route.duration / 60)} mins
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

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

                {/* 4. Recenter floating FAB button (h-11 w-11) */}
                {!pinPlacementMode && (
                    <button
                        onClick={recenterToUser}
                        className="absolute bottom-[88px] right-4 z-10 w-11 h-11 bg-background/85 backdrop-blur-md border border-border/50 text-foreground flex items-center justify-center rounded-full shadow-lg active:scale-90 transition-all duration-150"
                        title="Recenter GPS Position"
                    >
                        <Compass size={20} className="text-primary animate-spin-slow" />
                    </button>
                )}

                {/* 4B. Active navigation Live Driving Action Bar overlay */}
                {!pinPlacementMode && activeNavTask && activeNavRoute && (
                    <div className="absolute top-4 left-4 right-4 z-30 max-w-sm mx-auto bg-card/95 backdrop-blur-md border border-emerald-500/25 rounded-2xl p-4 shadow-xl space-y-3.5 animate-in slide-in-from-top-6 duration-300">
                        <div className="flex justify-between items-center pb-2 border-b border-border/50">
                            <div className="flex items-center gap-2">
                                <span className="relative flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                                </span>
                                <h4 className="font-black text-xs text-foreground uppercase tracking-wider">
                                    Active Navigation
                                </h4>
                            </div>
                            <button 
                                onClick={() => {
                                    setActiveNavTask(null);
                                    setActiveNavRoute(null);
                                }}
                                className="text-[10px] font-black uppercase tracking-wider text-muted-foreground hover:text-foreground px-2.5 py-1 rounded-xl bg-muted transition-all active:scale-95"
                            >
                                Stop
                            </button>
                        </div>
                        
                        <div className="flex items-center justify-between gap-3 bg-muted/20 p-3.5 rounded-xl border border-border/30">
                            <div className="flex flex-col min-w-0">
                                <span className="font-extrabold text-sm text-foreground truncate">
                                    {activeNavTask.title}
                                </span>
                                <span className="text-[10px] text-muted-foreground font-black uppercase tracking-wider mt-0.5">
                                    {(activeNavRoute.distance / 1000).toFixed(2)} km remaining
                                </span>
                            </div>
                            <div className="text-right shrink-0">
                                <span className="block font-black text-base text-emerald-500 leading-none">
                                    {Math.round(activeNavRoute.duration / 60)} mins
                                </span>
                                <span className="text-[8px] uppercase tracking-widest text-muted-foreground font-black mt-1 block">
                                    Est. Time
                                </span>
                            </div>
                        </div>

                        <button
                            onClick={() => handleCompleteTask(activeNavTask.id)}
                            disabled={updateTaskStatusMutation.isPending}
                            className="w-full h-11 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all shadow-lg shadow-emerald-500/10"
                        >
                            {updateTaskStatusMutation.isPending ? "Completing..." : "Complete Errand"}
                        </button>
                    </div>
                )}
            </div>

            {/* 5. Glassmorphic Sliding Drawer Overlay */}
            <MapDetailDrawer 
                selectedItem={selectedItem} 
                selectedType={selectedType} 
                onDismiss={() => {
                    setSelectedItem(null);
                    setSelectedType(null);
                }} 
                onSelectTaskRoute={handleSelectTaskRoute}
                onStartTaskNavigation={handleStartTaskNavigation}
                hasRoutesPlanned={customRoutes.length > 0}
                isTaskInProgress={updateTaskStatusMutation.isPending}
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

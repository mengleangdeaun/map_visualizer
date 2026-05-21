import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { Map, MapControls, MapMarker, MarkerContent, MapRoute } from '@/components/ui/map';
import { UserLocationMarker } from '@/components/shared/map/UserLocationMarker';
import { RoadRoute } from '@/components/shared/map/RoadRoute';
import { useAuthStore } from '@/domains/auth/store/useAuthStore';
import { useHeaderStore } from '../../store/useHeaderStore';
import { useLocationStore } from '../../store/useLocationStore';
import { useNavigationStore } from '../../store/useNavigationStore';
import { pwaToast as toast } from '../../store/usePwaToastStore';
import { echo } from '@/lib/echo';
import api from '@/lib/api';
import { 
    AlertTriangle, 
    ClipboardList, 
    Compass,
    Navigation,
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

import { useDriverTasks, useUpdateTaskStatus } from '../../hooks/useDriverTasks';

interface RoadblockAlert {
    id: string;
    description: string;
    type: string;
    lng: number;
    lat: number;
    created_at: string;
}

// Global Haversine Distance helper
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

const DriverMapPage = () => {
    const { t } = useTranslation();
    const { user } = useAuthStore();
    const navigate = useNavigate();
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
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

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

    // Active navigation states for Errand Tasks & Deliveries — persisted globally so they survive page transitions
    const {
        activeNavTask,
        setActiveNavTask,
        activeNavRoute,
        setActiveNavRoute,
        activeNavLeg,
        setActiveNavLeg,
        clearNavigation,
    } = useNavigationStore();
    const [planningLeg2Route, setPlanningLeg2Route] = useState<any | null>(null);

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

    // Proximity watcher: automatically transition from Leg 1 (Pickup) to Leg 2 (Drop-off) when within 50m of Pickup
    useEffect(() => {
        if (activeNavTask && activeNavLeg === 'pickup' && activeNavTask.pickup_lat && activeNavTask.pickup_lng && userLat && userLng) {
            const distance = calculateDistance(
                userLat, userLng,
                activeNavTask.pickup_lat, activeNavTask.pickup_lng
            );

            // If within 50 meters, trigger automatic transition
            if (distance <= 0.05) {
                handleArriveAtPickup();
            }
        }
    }, [userLat, userLng, activeNavTask, activeNavLeg]);

    // Query active route stops (deliveries)
    const { data: routeData } = useQuery({
        queryKey: ['driver', 'route', 'active'],
        queryFn: async () => {
            const { data } = await api.get('/driver/route/active');
            return data.data;
        }
    });

    // Query active tasks (errands)
    const { data: tasksData } = useDriverTasks();

    // Query active roadblocks (road alerts in last 24h)
    const { data: roadblocksData } = useQuery<RoadblockAlert[]>({
        queryKey: ['driver', 'road-alerts'],
        queryFn: async () => {
            const { data } = await api.get('/driver/road-alerts');
            return data.data;
        }
    });

    // Listen for Reverb broadcast when admin assigns a route to this driver
    useEffect(() => {
        if (!user?.id) return;

        const channel = echo.private(`driver.${user.id}`);

        channel.listen('.route.assigned', (event: any) => {
            // Refetch the active route query so the map updates immediately
            queryClient.invalidateQueries({ queryKey: ['driver', 'route', 'active'] });

            const stopCount = event?.route?.stop_count ?? 0;
            const distance  = event?.route?.estimated_distance_km
                ? ` · ${event.route.estimated_distance_km} km`
                : '';

            toast.success(`📦 New route assigned — ${stopCount} stops${distance}`);

            if ('vibrate' in navigator) navigator.vibrate([150, 80, 150]);
        });

        return () => {
            channel.stopListening('.route.assigned');
        };
    }, [user?.id]);


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

    // Mutation to register arrival at a delivery stop — navigates directly to Stop Details on success
    const arriveMutation = useMutation({
        mutationFn: async (stopId: string) => {
            const { data } = await api.post(`/driver/route/stops/${stopId}/arrive`);
            return data.data;
        },
        onSuccess: (_res, stopId) => {
            toast.success('Arrived at stop!');

            // Optimistically update the cache so StopDetails sees 'arrived' immediately
            // without waiting for the background refetch to complete
            queryClient.setQueryData(['driver', 'route', 'active'], (old: any) => {
                if (!old?.stops) return old;
                return {
                    ...old,
                    stops: old.stops.map((s: any) =>
                        s.id === stopId
                            ? { ...s, status: 'arrived', arrived_at: new Date().toISOString() }
                            : s
                    ),
                };
            });

            // Then invalidate to trigger a background sync
            queryClient.invalidateQueries({ queryKey: ['driver', 'route', 'active'] });
            clearNavigation();
            navigate({ to: '/driver/route/stop/$id', params: { id: stopId } });
        },
        onError: () => {
            toast.error('Failed to register arrival. Please try again.');
        },
    });

    // Mutation to register starting delivery route navigation
    const startDeliveryMutation = useMutation({
        mutationFn: async (stopId: string) => {
            const { latitude, longitude } = useLocationStore.getState();
            const { data } = await api.post(`/driver/route/stops/${stopId}/start`, {
                latitude,
                longitude
            });
            return data.data;
        },
        onSuccess: (res, stopId) => {
            toast.success("Delivery route started!");
            queryClient.invalidateQueries({ queryKey: ['driver', 'route', 'active'] });
        },
        onError: () => {
            toast.error("Failed to start delivery route. Please try again.");
        }
    });

    // Extract markers list
    const deliveries = useMemo(() => routeData?.stops || [], [routeData]);
    const tasks = useMemo(() => tasksData?.data || [], [tasksData]);
    const roadblocks = useMemo(() => roadblocksData || [], [roadblocksData]);

    const nextImmediateStop = useMemo(() => {
        return deliveries.find((stop: any) => stop.status === 'in_transit' || stop.status === 'pending' || stop.status === 'arrived');
    }, [deliveries]);

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

    const handleSelectTaskRoute = async (item: any) => {
        const isDelivery = !!item.delivery;

        let destLng = 0;
        let destLat = 0;

        if (isDelivery) {
            destLng = item.delivery.lng;
            destLat = item.delivery.lat;
        } else {
            // Determine errand task destination
            let usePickup = false;
            if (item.pickup_lng && item.pickup_lat) {
                if (item.status === 'assigned' || item.status === 'pending') {
                    usePickup = true;
                } else if (item.status === 'in_progress') {
                    const startPoint: [number, number] = (userLng && userLat) 
                        ? [userLng, userLat] 
                        : (userLocation || viewport.center);
                    
                    const distanceToPickup = calculateDistance(
                        startPoint[1], startPoint[0], 
                        item.pickup_lat, item.pickup_lng
                    );
                    
                    if (distanceToPickup > 0.05) {
                        usePickup = true;
                    }
                }
            }
            destLng = usePickup ? item.pickup_lng : (item.dropoff_lng || item.pickup_lng);
            destLat = usePickup ? item.pickup_lat : (item.dropoff_lat || item.pickup_lat);
        }

        if (!destLat || !destLng) {
            toast.error(isDelivery ? "Delivery Stop has no valid coordinates." : "Errand Task has no valid coordinates.");
            return;
        }

        const dest: [number, number] = [destLng, destLat];
        setCustomRouteDestination(dest);
        setIsRoutingLoading(true);
        setRoutePlanningMode(true);

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

                // Fetch Leg 2 only for Errand Tasks if pickup is used
                let leg2Route = null;
                if (!isDelivery && item.pickup_lng && item.pickup_lat && item.dropoff_lng && item.dropoff_lat) {
                    try {
                        const response2 = await fetch(`https://router.project-osrm.org/route/v1/driving/${item.pickup_lng},${item.pickup_lat};${item.dropoff_lng},${item.dropoff_lat}?overview=full&geometries=geojson`);
                        const data2 = await response2.json();
                        if (data2.code === 'Ok' && data2.routes?.length > 0) {
                            leg2Route = {
                                coordinates: data2.routes[0].geometry.coordinates,
                                distance: data2.routes[0].distance,
                                duration: data2.routes[0].duration
                            };
                        }
                    } catch (e2) {
                        console.error("OSRM planning Leg 2 route failure:", e2);
                    }
                }
                setPlanningLeg2Route(leg2Route);
            } else {
                toast.error(isDelivery ? "Could not trace route to this stop." : "Could not trace route to this errand destination.");
                setPlanningLeg2Route(null);
            }
        } catch (err) {
            console.error("OSRM route planning failure:", err);
            toast.error("Routing server error. Please try again.");
            setPlanningLeg2Route(null);
        } finally {
            setIsRoutingLoading(false);
        }
    };

    const handleStartTaskNavigation = (item: any) => {
        if (customRoutes.length === 0) return;
        const selectedRoute = customRoutes[selectedCustomRouteIndex];
        const isDelivery = !!item.delivery;

        if (isDelivery) {
            startDeliveryMutation.mutate(item.id, {
                onSuccess: (res) => {
                    const updatedItem = {
                        ...item,
                        status: 'in_transit',
                        delivery: {
                            ...item.delivery,
                            started_at: res?.started_at || new Date().toISOString()
                        }
                    };
                    setActiveNavTask(updatedItem);

                    // Dynamic live route tracing: use the OSRM path computed from actual current location if available,
                    // otherwise gracefully fallback to the pre-calculated selectedRoute.
                    const routeToUse = res?.actual_leg_geometry || selectedRoute;
                    setActiveNavRoute(routeToUse);
                    setActiveNavLeg('dropoff');

                    setRoutePlanningMode(false);
                    setCustomRoutes([]);
                    setCustomRouteDestination(null);
                    setSelectedItem(null);
                    setSelectedType(null);
                    setIsDrawerOpen(false);
                }
            });
        } else {
            // Errand Tasks status update mutation
            updateTaskStatusMutation.mutate({
                taskId: item.id,
                status: 'in_progress'
            }, {
                onSuccess: (updatedTask) => {
                    setActiveNavTask(updatedTask);
                    setActiveNavRoute(selectedRoute);
                    
                    const hasPickup = !!(updatedTask.pickup_lat && updatedTask.pickup_lng);
                    setActiveNavLeg(hasPickup ? 'pickup' : 'dropoff');
                    setPlanningLeg2Route(null);

                    setRoutePlanningMode(false);
                    setCustomRoutes([]);
                    setCustomRouteDestination(null);
                    setSelectedItem(null);
                    setSelectedType(null);
                    setIsDrawerOpen(false);
                    queryClient.invalidateQueries({ queryKey: ['driver', 'tasks'] });
                }
            });
        }
    };

    const handleCompleteTask = (taskId: string) => {
        updateTaskStatusMutation.mutate({
            taskId,
            status: 'completed'
        }, {
            onSuccess: () => {
                clearNavigation();
                queryClient.invalidateQueries({ queryKey: ['driver', 'tasks'] });
            }
        });
    };

    const handleArriveAtPickup = async () => {
        if (!activeNavTask) return;
        
        toast.success("Arrived at Pickup! Routing to Drop-off location...");
        setActiveNavLeg('dropoff');

        const destLng = activeNavTask.dropoff_lng || activeNavTask.pickup_lng;
        const destLat = activeNavTask.dropoff_lat || activeNavTask.pickup_lat;

        if (!destLat || !destLng) {
            toast.error("Errand Task has no valid drop-off coordinates.");
            return;
        }

        const startPoint: [number, number] = (userLng && userLat) 
            ? [userLng, userLat] 
            : (userLocation || viewport.center);

        try {
            const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${startPoint[0]},${startPoint[1]};${destLng},${destLat}?overview=full&geometries=geojson`);
            const data = await response.json();
            
            if (data.code === 'Ok' && data.routes?.length > 0) {
                const selectedRoute = {
                    coordinates: data.routes[0].geometry.coordinates,
                    distance: data.routes[0].distance,
                    duration: data.routes[0].duration
                };
                setActiveNavRoute(selectedRoute);
            } else {
                toast.error("Failed to fetch route to Drop-off.");
            }
        } catch (err) {
            console.error("OSRM drop-off routing failure:", err);
            toast.error("Error fetching route to Drop-off.");
        }
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
                    {/* Active Driver GPS Pin */}
                    <UserLocationMarker coordinates={userLocation} />

                    {/* 1B. Draw Snap-To-Road Sequential Snapped Delivery Polylines */}
                    {activeFilter === 'deliveries' && !activeNavTask && deliveries.length > 1 && deliveries.map((stop: any, idx: number) => {
                        if (idx === deliveries.length - 1) return null;
                        const nextStop = deliveries[idx + 1];
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
                            navigate({ to: '/driver/route/stop/$id', params: { id: String(id) } });
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

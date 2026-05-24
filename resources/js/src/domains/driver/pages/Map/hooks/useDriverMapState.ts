import { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { useLocationStore } from '../../../store/useLocationStore';
import { useNavigationStore } from '../../../store/useNavigationStore';
import { pwaToast as toast } from '../../../store/usePwaToastStore';
import { useDriverTasks, useUpdateTaskStatus } from '../../../hooks/useDriverTasks';
import { driverMapService } from '../services/driverMapService';
import { MapViewport, RoadblockAlert, StopItem, ErrandTask, CustomRoute } from '../types';

// Helper to compute Haversine distance in km
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
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

export const useDriverMapState = () => {
    const navigate = useNavigate();
    const search = useSearch({ strict: false }) as Record<string, string>;
    const queryClient = useQueryClient();
    const updateTaskStatusMutation = useUpdateTaskStatus();

    const focusLat = search.lat ? parseFloat(search.lat) : null;
    const focusLng = search.lng ? parseFloat(search.lng) : null;
    const focusType = search.type as 'delivery' | 'task' | 'roadblock' | null;
    const focusId = search.id || null;

    // Track user location from background location store
    const { latitude: userLat, longitude: userLng } = useLocationStore();
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

    // Active filter segment: 'deliveries' or 'tasks'
    const [activeFilter, setActiveFilter] = useState<'deliveries' | 'tasks'>('deliveries');

    // Bottom drawer selection state
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [selectedType, setSelectedType] = useState<'delivery' | 'task' | 'roadblock' | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    // Report roadblock state
    const [showReportModal, setShowReportModal] = useState(false);
    const [clickedCoords, setClickedCoords] = useState<{ lng: number; lat: number } | null>(null);

    // Map viewport state
    const [viewport, setViewport] = useState<MapViewport>({
        center: [104.883628, 11.564134],
        zoom: 13,
        bearing: 0,
        pitch: 0,
    });

    const isInteracting = useRef(false);

    // Map style option
    const [mapStyleOption, setMapStyleOption] = useState<'default' | 'google_khmer_hybrid'>('google_khmer_hybrid');

    // OSRM Custom routing planning states
    const [routePlanningMode, setRoutePlanningMode] = useState(false);
    const [customRouteDestination, setCustomRouteDestination] = useState<[number, number] | null>(null);
    const [customRoutes, setCustomRoutes] = useState<CustomRoute[]>([]);
    const [selectedCustomRouteIndex, setSelectedCustomRouteIndex] = useState(0);
    const [isRoutingLoading, setIsRoutingLoading] = useState(false);

    // Roadblock interactive placement states
    const [pinPlacementMode, setPinPlacementMode] = useState(false);

    // Active navigation states from persisted Zustand store
    const {
        activeNavTask,
        setActiveNavTask,
        activeNavRoute,
        setActiveNavRoute,
        activeNavLeg,
        setActiveNavLeg,
        clearNavigation,
    } = useNavigationStore();

    const [planningLeg2Route, setPlanningLeg2Route] = useState<CustomRoute | null>(null);

    // 1. Sync current location & auto-recenter once if no focus coordinates are specified
    useEffect(() => {
        if (userLat && userLng) {
            const loc: [number, number] = [userLng, userLat];
            setUserLocation(loc);
            if (!focusLat && !focusLng) {
                setViewport(prev => ({
                    ...prev,
                    center: loc
                }));
            }
        }
    }, [userLat, userLng, focusLat, focusLng]);

    // 1b. Fly to and focus on custom search parameters coordinate on mount/update
    useEffect(() => {
        if (focusLat && focusLng) {
            setViewport(prev => ({
                ...prev,
                center: [focusLng, focusLat],
                zoom: 16, // Fly in close!
            }));

            // Sync the active filter tab to the focal type
            if (focusType === 'delivery') {
                setActiveFilter('deliveries');
            } else if (focusType === 'task') {
                setActiveFilter('tasks');
            }
        }
    }, [focusLat, focusLng, focusType]);

    // 2. Fetch queries via decoupled service layer
    const { data: routeData } = useQuery({
        queryKey: ['driver', 'route', 'active'],
        queryFn: () => driverMapService.fetchActiveRoute(),
    });

    const { data: tasksData } = useDriverTasks();

    const { data: roadblocksData } = useQuery<RoadblockAlert[]>({
        queryKey: ['driver', 'road-alerts'],
        queryFn: () => driverMapService.fetchRoadAlerts(),
    });

    // Helper memoized lists
    const deliveriesList = useMemo(() => {
        return (routeData?.stops || []).filter(
            (stop: StopItem) => stop.delivery.status !== 'delivered' && 
                               stop.delivery.status !== 'failed' && 
                               stop.delivery.status !== 'rescheduled'
        );
    }, [routeData]);

    const tasksList = useMemo(() => {
        return tasksData?.data || [];
    }, [tasksData]);

    const roadblocksList = useMemo(() => {
        return roadblocksData || [];
    }, [roadblocksData]);

    // Auto-select focused item from search parameters on load/update
    useEffect(() => {
        if (!focusId || !focusType) return;

        if (focusType === 'delivery' && deliveriesList.length > 0) {
            const item = (deliveriesList as StopItem[]).find(
                s => String(s.id) === String(focusId) || String(s.delivery?.id) === String(focusId)
            );
            if (item) {
                setSelectedItem(item);
                setSelectedType('delivery');
                setIsDrawerOpen(true);
            }
        } else if (focusType === 'task' && tasksList.length > 0) {
            const item = (tasksList as ErrandTask[]).find(
                t => String(t.id) === String(focusId)
            );
            if (item) {
                setSelectedItem(item);
                setSelectedType('task');
                setIsDrawerOpen(true);
            }
        } else if (focusType === 'roadblock' && roadblocksList.length > 0) {
            const item = (roadblocksList as RoadblockAlert[]).find(
                r => String(r.id) === String(focusId)
            );
            if (item) {
                setSelectedItem(item);
                setSelectedType('roadblock');
                setIsDrawerOpen(true);
            }
        }
    }, [focusId, focusType, deliveriesList, tasksList, roadblocksList]);

    // 3. Proximity watcher: auto transition from pickup to dropoff
    useEffect(() => {
        if (
            activeNavTask &&
            activeNavLeg === 'pickup' &&
            activeNavTask.pickup_lat &&
            activeNavTask.pickup_lng &&
            userLat &&
            userLng
        ) {
            const dist = calculateDistance(
                userLat,
                userLng,
                activeNavTask.pickup_lat,
                activeNavTask.pickup_lng
            );

            // Auto-trigger arrival if driver is within 50 meters
            if (dist <= 0.05) {
                handleArriveAtPickup();
            }
        }
    }, [userLat, userLng, activeNavTask, activeNavLeg]);

    // 4. Mutations
    const reportRoadblockMutation = useMutation({
        mutationFn: (payload: { description: string; type: string }) => {
            if (!clickedCoords) throw new Error('No clicked coordinates selected');
            return driverMapService.reportRoadblock({
                ...payload,
                lng: clickedCoords.lng,
                lat: clickedCoords.lat,
            });
        },
        onSuccess: () => {
            toast.success('Road hazard reported successfully!');
            if ('vibrate' in navigator) {
                navigator.vibrate([100, 50, 100]);
            }
            setShowReportModal(false);
            setClickedCoords(null);
            queryClient.invalidateQueries({ queryKey: ['driver', 'road-alerts'] });
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Failed to submit hazard report');
        },
    });

    const arriveMutation = useMutation({
        mutationFn: (stopId: string) => driverMapService.arriveAtStop(stopId),
        onSuccess: (_res, stopId) => {
            toast.success('Arrived at stop!');

            // Optimistic update of stops
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

            queryClient.invalidateQueries({ queryKey: ['driver', 'route', 'active'] });
            clearNavigation();
            navigate({ to: '/driver/route/stop/$id', params: { id: stopId } });
        },
        onError: () => {
            toast.error('Failed to register arrival. Please try again.');
        },
    });

    const startDeliveryMutation = useMutation({
        mutationFn: (stopId: string) => {
            const { latitude, longitude } = useLocationStore.getState();
            return driverMapService.startDeliveryRoute(stopId, { latitude, longitude });
        },
        onSuccess: (_res, _stopId) => {
            toast.success('Delivery route started!');
            queryClient.invalidateQueries({ queryKey: ['driver', 'route', 'active'] });
        },
        onError: () => {
            toast.error('Failed to start delivery route. Please try again.');
        },
    });

    // 5. Actions / Handlers
    const handleSelectTaskRoute = async (item: any) => {
        const isDelivery = !!item.delivery;
        let destLng = 0;
        let destLat = 0;

        if (isDelivery) {
            destLng = item.delivery.lng;
            destLat = item.delivery.lat;
        } else {
            let usePickup = false;
            if (item.pickup_lng && item.pickup_lat) {
                if (item.status === 'assigned' || item.status === 'pending') {
                    usePickup = true;
                } else if (item.status === 'in_progress') {
                    const startPoint: [number, number] = (userLng && userLat)
                        ? [userLng, userLat]
                        : (userLocation || viewport.center);

                    const distanceToPickup = calculateDistance(
                        startPoint[1],
                        startPoint[0],
                        item.pickup_lat,
                        item.pickup_lng
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
            toast.error(isDelivery ? 'Delivery Stop has no valid coordinates.' : 'Errand Task has no valid coordinates.');
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
            const routesList = await driverMapService.fetchOSRMRoute(startPoint, dest, true);
            setCustomRoutes(routesList);
            setSelectedCustomRouteIndex(0);

            // Fetch leg 2 for tasks if pickup was selected
            let leg2Route = null;
            if (!isDelivery && item.pickup_lng && item.pickup_lat && item.dropoff_lng && item.dropoff_lat) {
                try {
                    const resLeg2 = await driverMapService.fetchOSRMRoute(
                        [item.pickup_lng, item.pickup_lat],
                        [item.dropoff_lng, item.dropoff_lat],
                        false
                    );
                    if (resLeg2.length > 0) {
                        leg2Route = resLeg2[0];
                    }
                } catch (e2) {
                    console.error('OSRM planning Leg 2 route failure:', e2);
                }
            }
            setPlanningLeg2Route(leg2Route);
        } catch (err) {
            console.error('OSRM route planning failure:', err);
            toast.error('Routing server error. Please try again.');
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
                            started_at: res?.started_at || new Date().toISOString(),
                        },
                    };
                    setActiveNavTask(updatedItem);

                    const routeToUse = res?.actual_leg_geometry || selectedRoute;
                    setActiveNavRoute(routeToUse);
                    setActiveNavLeg('dropoff');

                    setRoutePlanningMode(false);
                    setCustomRoutes([]);
                    setCustomRouteDestination(null);
                    setSelectedItem(null);
                    setSelectedType(null);
                    setIsDrawerOpen(false);
                },
            });
        } else {
            updateTaskStatusMutation.mutate(
                { taskId: item.id, status: 'in_progress' },
                {
                    onSuccess: (updatedTask: any) => {
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
                    },
                }
            );
        }
    };

    const handleCompleteTask = (taskId: string) => {
        updateTaskStatusMutation.mutate(
            { taskId, status: 'completed' },
            {
                onSuccess: () => {
                    clearNavigation();
                    queryClient.invalidateQueries({ queryKey: ['driver', 'tasks'] });
                },
            }
        );
    };

    const handleArriveAtPickup = async () => {
        if (!activeNavTask) return;

        toast.success('Arrived at Pickup! Routing to Drop-off location...');
        setActiveNavLeg('dropoff');

        const destLng = activeNavTask.dropoff_lng || activeNavTask.pickup_lng;
        const destLat = activeNavTask.dropoff_lat || activeNavTask.pickup_lat;

        if (!destLat || !destLng) {
            toast.error('Errand Task has no valid drop-off coordinates.');
            return;
        }

        const startPoint: [number, number] = (userLng && userLat)
            ? [userLng, userLat]
            : (userLocation || viewport.center);

        try {
            const resRoute = await driverMapService.fetchOSRMRoute(startPoint, [destLng, destLat], false);
            if (resRoute.length > 0) {
                setActiveNavRoute(resRoute[0]);
            } else {
                toast.error('Failed to fetch route to Drop-off.');
            }
        } catch (err) {
            console.error('OSRM drop-off routing failure:', err);
            toast.error('Error fetching route to Drop-off.');
        }
    };

    const recenterToUser = () => {
        if (userLocation) {
            setViewport(prev => ({
                ...prev,
                center: userLocation,
                zoom: 14,
            }));
            toast.info('Centered to current position');
        } else {
            toast.error('Waiting for GPS coordinates...');
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

            const startPoint: [number, number] = userLocation || viewport.center;

            try {
                const routesList = await driverMapService.fetchOSRMRoute(startPoint, dest, true);
                setCustomRoutes(routesList);
                setSelectedCustomRouteIndex(0);
                toast.success(`Found ${routesList.length} route options!`);
            } catch (err) {
                console.error('OSRM Route planning failure:', err);
                toast.error('Could not trace route to this destination.');
            } finally {
                setIsRoutingLoading(false);
            }
        }
    };

    return {
        // Core state values
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

        // persistent Zustand store hooks
        activeNavTask,
        activeNavRoute,
        activeNavLeg,
        clearNavigation,

        // API queries
        deliveries: deliveriesList,
        tasks: tasksList,
        roadblocks: roadblocksList,
        routeData,

        // Actions & handlers
        handleSelectTaskRoute,
        handleStartTaskNavigation,
        handleCompleteTask,
        handleArriveAtPickup,
        recenterToUser,
        handleMapClick,

        // mutation states
        updateTaskStatusMutation,
        arriveMutation,
        startDeliveryMutation,
        reportRoadblockMutation,
    };
};

export default useDriverMapState;

import { MapRoute } from "@/components/ui/map";
import { useEffect, useState, useMemo } from "react";

interface RoadRouteProps {
    id?: string;
    from: [number, number];
    to: [number, number];
    color?: string;
    width?: number;
    opacity?: number;
    dashArray?: [number, number];
    animate?: boolean;
    interactive?: boolean;
    onClick?: () => void;
}

/**
 * A wrapper around MapRoute that fetches real-world road coordinates from OSRM.
 * Falls back to a straight line while fetching or if the request fails.
 */
export const RoadRoute = ({
    from,
    to,
    opacity = 0.8,
    ...props
}: RoadRouteProps) => {
    // Initial state is a straight line between from and to
    const initialCoords = useMemo(() => [from, to] as [number, number][], [from, to]);
    const [coordinates, setCoordinates] = useState<[number, number][]>(initialCoords);
    const [isFetching, setIsFetching] = useState(false);

    useEffect(() => {
        if (!from || !to) return;
        
        // Skip if coordinates are invalid or identical
        if (isNaN(from[0]) || isNaN(from[1]) || isNaN(to[0]) || isNaN(to[1])) return;
        if (from[0] === to[0] && from[1] === to[1]) return;

        let isMounted = true;

        const fetchRoute = async () => {
            setIsFetching(true);
            try {
                const response = await fetch(
                    `https://router.project-osrm.org/route/v1/driving/${from[0]},${from[1]};${to[0]},${to[1]}?overview=full&geometries=geojson`
                );
                
                if (!response.ok) throw new Error("OSRM request failed");
                
                const data = await response.json();

                if (isMounted && data.routes && data.routes.length > 0) {
                    setCoordinates(data.routes[0].geometry.coordinates);
                }
            } catch (error) {
                console.error("Failed to fetch road route:", error);
                // Fallback to straight line (already in state or updated via initialCoords)
                if (isMounted) {
                    setCoordinates([from, to]);
                }
            } finally {
                if (isMounted) {
                    setIsFetching(false);
                }
            }
        };

        fetchRoute();

        return () => {
            isMounted = false;
        };
    }, [from[0], from[1], to[0], to[1]]);

    // Sync coordinates with from/to changes while waiting for fetch
    useEffect(() => {
        setCoordinates([from, to]);
    }, [from[0], from[1], to[0], to[1]]);

    return (
        <MapRoute
            {...props}
            coordinates={coordinates}
            opacity={isFetching ? opacity * 0.5 : opacity}
        />
    );
};

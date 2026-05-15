/**
 * Google Maps URL Parsing Utility
 */

export interface MapCoordinates {
    lat: number;
    lng: number;
    address?: string;
}

/**
 * Extracts coordinates from various Google Maps URL formats
 */
export const parseGoogleMapsUrl = (url: string): MapCoordinates | null => {
    if (!url || typeof url !== 'string') return null;

    // 1. Regular URL format: .../@lat,lng,zoom...
    const coordRegex = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
    const match = url.match(coordRegex);
    if (match) {
        return {
            lat: parseFloat(match[1]),
            lng: parseFloat(match[2])
        };
    }

    // 2. Search/Query format: .../search/lat,lng... or ...?q=lat,lng...
    const searchRegex = /(?:search\/|q=)(-?\d+\.\d+)(?:,|%2C)(-?\d+\.\d+)/;
    const searchMatch = url.match(searchRegex);
    if (searchMatch) {
        return {
            lat: parseFloat(searchMatch[1]),
            lng: parseFloat(searchMatch[2])
        };
    }

    // 3. Place format without @ (less common)
    const placeRegex = /place\/(-?\d+\.\d+)\+(-?\d+\.\d+)/;
    const placeMatch = url.match(placeRegex);
    if (placeMatch) {
        return {
            lat: parseFloat(placeMatch[1]),
            lng: parseFloat(placeMatch[2])
        };
    }

    return null;
};

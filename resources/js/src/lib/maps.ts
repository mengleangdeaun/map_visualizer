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

    let result: MapCoordinates | null = null;

    // 1. Precise location from data parameter (!3dLat!4dLng)
    // This is usually more accurate than the @lat,lng center point
    const preciseRegex = /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/;
    const preciseMatch = url.match(preciseRegex);
    if (preciseMatch) {
        result = {
            lat: parseFloat(preciseMatch[1]),
            lng: parseFloat(preciseMatch[2])
        };
    }

    // 2. Regular URL format: .../@lat,lng,zoom...
    if (!result) {
        const coordRegex = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
        const match = url.match(coordRegex);
        if (match) {
            result = {
                lat: parseFloat(match[1]),
                lng: parseFloat(match[2])
            };
        }
    }

    // 3. Search/Query format: .../search/lat,lng... or ...?q=lat,lng...
    if (!result) {
        const searchRegex = /(?:search\/|q=)(-?\d+\.\d+)(?:,|%2C)(-?\d+\.\d+)/;
        const searchMatch = url.match(searchRegex);
        if (searchMatch) {
            result = {
                lat: parseFloat(searchMatch[1]),
                lng: parseFloat(searchMatch[2])
            };
        }
    }

    // 4. Place format without @ (less common)
    if (!result) {
        const placeRegex = /place\/(-?\d+\.\d+)\+(-?\d+\.\d+)/;
        const placeMatch = url.match(placeRegex);
        if (placeMatch) {
            result = {
                lat: parseFloat(placeMatch[1]),
                lng: parseFloat(placeMatch[2])
            };
        }
    }

    // Extract place name if possible
    if (result) {
        // Match /place/Name+Of+Place/
        const placeNameMatch = url.match(/\/place\/([^/@?]+)/);
        if (placeNameMatch) {
            try {
                result.address = decodeURIComponent(placeNameMatch[1].replace(/\+/g, ' '));
            } catch (e) {
                // Ignore decoding errors
            }
        }
    }

    // Sanity check: ensure we actually have numbers
    if (result && (isNaN(result.lat) || isNaN(result.lng))) {
        return null;
    }

    return result;
};

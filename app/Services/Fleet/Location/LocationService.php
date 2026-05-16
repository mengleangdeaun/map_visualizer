<?php

namespace App\Services\Fleet\Location;

use App\Models\Fleet\Location;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class LocationService
{
    /**
     * Find a location by ID with spatial data.
     */
    public function findById(string $id): Location
    {
        return Location::query()
            ->select('*')
            ->selectRaw('ST_Y(location::geometry) as latitude')
            ->selectRaw('ST_X(location::geometry) as longitude')
            ->findOrFail($id);
    }

    /**
     * List locations with pagination and filtering.
     */
    public function list(array $params): LengthAwarePaginator
    {
        $perPage = $params['per_page'] ?? 10;
        $companyId = $params['company_id'] ?? null;
        $search = $params['search'] ?? null;
        $type = $params['type'] ?? null;

        $query = Location::query()
            ->select('*')
            ->selectRaw('ST_Y(location::geometry) as latitude')
            ->selectRaw('ST_X(location::geometry) as longitude')
            ->with('company');

        if ($companyId) {
            $query->where('company_id', $companyId);
        }

        if ($type) {
            $query->where('type', $type);
        }

        if ($search) {
            $query->where('name', 'LIKE', "%{$search}%")
                  ->orWhere('code', 'LIKE', "%{$search}%");
        }

        return $query->latest()->paginate($perPage);
    }

    /**
     * Create a new location.
     */
    public function create(array $data): Location
    {
        // Handle spatial data if provided as lat/lng
        if (isset($data['latitude']) && isset($data['longitude'])) {
            $lat = (float) $data['latitude'];
            $lng = (float) $data['longitude'];
            // Using basic ST_GeomFromText to avoid SRID conflicts if column SRID is 0
            $data['location'] = DB::raw("ST_GeomFromText('POINT($lng $lat)', 4326)");
            unset($data['latitude'], $data['longitude']);
        }

        $location = Location::create($data);
        return $this->findById($location->id);
    }

    /**
     * Update an existing location.
     */
    public function update(Location $location, array $data): Location
    {
        // Handle spatial data if provided as lat/lng
        if (isset($data['latitude']) && isset($data['longitude'])) {
            $lat = (float) $data['latitude'];
            $lng = (float) $data['longitude'];
            // Using basic ST_GeomFromText to avoid SRID conflicts if column SRID is 0
            $data['location'] = DB::raw("ST_GeomFromText('POINT($lng $lat)', 4326)");
            unset($data['latitude'], $data['longitude']);
        }

        $location->update($data);
        return $this->findById($location->id);
    }

    /**
     * Delete a location.
     */
    public function delete(Location $location): bool
    {
        return $location->delete();
    }
}

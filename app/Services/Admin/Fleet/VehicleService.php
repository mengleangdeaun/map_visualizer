<?php

namespace App\Services\Admin\Fleet;

use App\Models\Fleet\Vehicle;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class VehicleService
{
    /**
     * Find a vehicle by ID with spatial data.
     */
    public function findById(string $id): Vehicle
    {
        $vehicle = Vehicle::query()
            ->select([
                'id',
                'company_id',
                'driver_id',
                'type',
                'plate_number',
                'max_weight_kg',
                'max_volume_cbm',
                'image_url',
                'is_active',
                'max_speed_kmh',
                'last_telemetry_at',
                'created_at',
                'updated_at',
            ])
            ->selectRaw('ST_Y(last_location::geometry) as latitude')
            ->selectRaw('ST_X(last_location::geometry) as longitude')
            ->with([
                'company' => function($q) {
                    $q->select(['id', 'name', 'slug']);
                },
                'driver' => function($q) {
                    $q->select(['id', 'name', 'phone', 'email']);
                }
            ])
            ->findOrFail($id);

        // Inject hot telemetry from Valkey cache if available
        $cached = \Illuminate\Support\Facades\Cache::get("vehicle:telemetry:{$id}");
        if ($cached) {
            $vehicle->last_location = 'cached';
            $vehicle->setAttribute('latitude', $cached['latitude']);
            $vehicle->setAttribute('longitude', $cached['longitude']);
            $vehicle->heading = $cached['heading'] ?? 0;
        } else {
            $vehicle->heading = 0;
        }

        return $vehicle;
    }

    /**
     * List vehicles with pagination and filtering.
     */
    public function list(array $params): LengthAwarePaginator
    {
        $perPage = $params['per_page'] ?? 10;
        $companyId = $params['company_id'] ?? null;
        $search = $params['search'] ?? null;
        $type = $params['type'] ?? null;

        $query = Vehicle::query()
            ->select([
                'id',
                'company_id',
                'driver_id',
                'type',
                'plate_number',
                'max_weight_kg',
                'max_volume_cbm',
                'image_url',
                'is_active',
                'max_speed_kmh',
                'last_telemetry_at',
                'created_at',
                'updated_at',
            ])
            ->selectRaw('ST_Y(last_location::geometry) as latitude')
            ->selectRaw('ST_X(last_location::geometry) as longitude')
            ->with([
                'company' => function($q) {
                    $q->select(['id', 'name', 'slug']);
                },
                'driver' => function($q) {
                    $q->select(['id', 'name', 'phone', 'email']);
                }
            ]);

        if ($companyId) {
            $query->where('company_id', $companyId);
        }

        if ($type) {
            $query->where('type', $type);
        }

        if ($search) {
            $query->where('plate_number', 'LIKE', "%{$search}%");
        }

        $vehicles = $query->latest()->paginate($perPage);

        // Inject hot telemetry from Valkey cache into listed vehicles
        $vehicles->getCollection()->transform(function ($vehicle) {
            $cached = \Illuminate\Support\Facades\Cache::get("vehicle:telemetry:{$vehicle->id}");
            if ($cached) {
                $vehicle->last_location = 'cached';
                $vehicle->setAttribute('latitude', $cached['latitude']);
                $vehicle->setAttribute('longitude', $cached['longitude']);
                $vehicle->heading = $cached['heading'] ?? 0;
            } else {
                $vehicle->heading = 0;
            }
            return $vehicle;
        });

        return $vehicles;
    }

    /**
     * Create a new vehicle.
     */
    public function create(array $data): Vehicle
    {
        if (isset($data['latitude']) && isset($data['longitude'])) {
            $lat = (float) $data['latitude'];
            $lng = (float) $data['longitude'];
            $data['last_location'] = DB::raw("ST_GeomFromText('POINT($lng $lat)', 4326)");
            unset($data['latitude'], $data['longitude']);
        }

        $vehicle = Vehicle::create($data);
        return $this->findById($vehicle->id);
    }

    /**
     * Update an existing vehicle.
     */
    public function update(Vehicle $vehicle, array $data): Vehicle
    {
        if (isset($data['latitude']) && isset($data['longitude'])) {
            $lat = (float) $data['latitude'];
            $lng = (float) $data['longitude'];
            $data['last_location'] = DB::raw("ST_GeomFromText('POINT($lng $lat)', 4326)");
            
            // Trigger Broadcast Event here in the future
            // event(new VehicleLocationUpdated($vehicle, $lat, $lng));
            
            unset($data['latitude'], $data['longitude']);
        }

        $vehicle->update($data);
        return $this->findById($vehicle->id);
    }

    /**
     * Delete a vehicle.
     */
    public function delete(Vehicle $vehicle): bool
    {
        return $vehicle->delete();
    }
}

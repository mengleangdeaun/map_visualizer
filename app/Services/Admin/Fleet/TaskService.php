<?php

namespace App\Services\Admin\Fleet;

use App\Models\Driver\Task;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class TaskService
{
    /**
     * Find a task by ID with spatial data.
     */
    public function findById(string $id): Task
    {
        return Task::query()
            ->select('*')
            ->selectRaw('ST_Y(pickup_location::geometry) as pickup_lat')
            ->selectRaw('ST_X(pickup_location::geometry) as pickup_lng')
            ->selectRaw('ST_Y(dropoff_location::geometry) as dropoff_lat')
            ->selectRaw('ST_X(dropoff_location::geometry) as dropoff_lng')
            ->with(['company', 'vehicle', 'driver'])
            ->findOrFail($id);
    }

    /**
     * List tasks with pagination and filtering.
     */
    public function list(array $params): LengthAwarePaginator
    {
        $perPage = $params['per_page'] ?? 10;
        $companyId = $params['company_id'] ?? null;
        $search = $params['search'] ?? null;
        $status = $params['status'] ?? null;
        $vehicleId = $params['vehicle_id'] ?? null;

        $query = Task::query()
            ->select('*')
            ->selectRaw('ST_Y(pickup_location::geometry) as pickup_lat')
            ->selectRaw('ST_X(pickup_location::geometry) as pickup_lng')
            ->selectRaw('ST_Y(dropoff_location::geometry) as dropoff_lat')
            ->selectRaw('ST_X(dropoff_location::geometry) as dropoff_lng')
            ->with(['vehicle', 'driver']);

        if ($companyId) {
            $query->where('company_id', $companyId);
        }

        if ($status) {
            if ($status === 'active') {
                $query->whereNotIn('status', ['completed', 'cancelled', 'archived']);
            } else {
                $query->where('status', $status);
            }
        } else {
            $query->where('status', '!=', 'archived');
        }

        if ($vehicleId) {
            $query->where('vehicle_id', $vehicleId);
        }

        if ($search) {
            $query->where('title', 'LIKE', "%{$search}%");
        }

        return $query->latest()->paginate($perPage);
    }

    /**
     * Create a new task.
     */
    /**
     * Create a new task.
     */
    public function create(array $data): Task
    {
        $pickupLat = $data['pickup_lat'] ?? null;
        $pickupLng = $data['pickup_lng'] ?? null;
        $dropoffLat = $data['dropoff_lat'] ?? null;
        $dropoffLng = $data['dropoff_lng'] ?? null;

        unset($data['pickup_lat'], $data['pickup_lng'], $data['dropoff_lat'], $data['dropoff_lng']);

        // Auto-resolve driver from vehicle if not provided
        if (isset($data['vehicle_id']) && !isset($data['driver_id'])) {
            $vehicle = \App\Models\Fleet\Vehicle::find($data['vehicle_id']);
            if ($vehicle && $vehicle->driver_id) {
                $data['driver_id'] = $vehicle->driver_id;
            }
        }

        $task = Task::create($data);
        $this->updateSpatialData($task->id, $pickupLat, $pickupLng, $dropoffLat, $dropoffLng);
        
        return $this->findById($task->id);
    }

    /**
     * Update an existing task.
     */
    public function update(Task $task, array $data): Task
    {
        $pickupLat = $data['pickup_lat'] ?? null;
        $pickupLng = $data['pickup_lng'] ?? null;
        $dropoffLat = $data['dropoff_lat'] ?? null;
        $dropoffLng = $data['dropoff_lng'] ?? null;

        unset($data['pickup_lat'], $data['pickup_lng'], $data['dropoff_lat'], $data['dropoff_lng']);

        // Auto-resolve driver from vehicle if reassigned and driver not explicitly changed
        if (isset($data['vehicle_id']) && !isset($data['driver_id'])) {
            $vehicle = \App\Models\Fleet\Vehicle::find($data['vehicle_id']);
            if ($vehicle && $vehicle->driver_id) {
                $data['driver_id'] = $vehicle->driver_id;
            }
        }

        $task->update($data);
        $this->updateSpatialData($task->id, $pickupLat, $pickupLng, $dropoffLat, $dropoffLng);

        return $this->findById($task->id);
    }

    /**
     * Internal helper to update spatial columns via direct SQL.
     */
    protected function updateSpatialData(string $id, $pLat, $pLng, $dLat, $dLng): void
    {
        $pickupSql = ($pLat !== null && $pLng !== null && $pLat != 0) 
            ? "ST_SetSRID(ST_MakePoint(" . (float)$pLng . ", " . (float)$pLat . "), 4326)" 
            : "NULL";
            
        $dropoffSql = ($dLat !== null && $dLng !== null && $dLat != 0) 
            ? "ST_SetSRID(ST_MakePoint(" . (float)$dLng . ", " . (float)$dLat . "), 4326)" 
            : "NULL";

        DB::statement("UPDATE tasks SET pickup_location = $pickupSql, dropoff_location = $dropoffSql WHERE id = ?", [$id]);
    }

    /**
     * Delete a task.
     */
    public function delete(Task $task): bool
    {
        return $task->delete();
    }
}

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
            ->with(['company', 'vehicle', 'driver', 'customer'])
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
            ->with(['vehicle', 'driver', 'customer']);

        if ($companyId) {
            $query->where('company_id', $companyId);
        }

        if ($status) {
            $query->where('status', $status);
        }

        if ($vehicleId) {
            $query->where('vehicle_id', $vehicleId);
        }

        if ($search) {
            $query->where('title', 'LIKE', "%{$search}%")
                  ->orWhere('external_order_id', 'LIKE', "%{$search}%");
        }

        return $query->latest()->paginate($perPage);
    }

    /**
     * Create a new task.
     */
    public function create(array $data): Task
    {
        if (isset($data['pickup_lat']) && isset($data['pickup_lng'])) {
            $lat = (float) $data['pickup_lat'];
            $lng = (float) $data['pickup_lng'];
            $data['pickup_location'] = DB::raw("ST_GeomFromText('POINT($lng $lat)', 4326)");
            unset($data['pickup_lat'], $data['pickup_lng']);
        }

        if (isset($data['dropoff_lat']) && isset($data['dropoff_lng'])) {
            $lat = (float) $data['dropoff_lat'];
            $lng = (float) $data['dropoff_lng'];
            $data['dropoff_location'] = DB::raw("ST_GeomFromText('POINT($lng $lat)', 4326)");
            unset($data['dropoff_lat'], $data['dropoff_lng']);
        }

        // Auto-resolve driver from vehicle if not provided
        if (isset($data['vehicle_id']) && !isset($data['driver_id'])) {
            $vehicle = \App\Models\Fleet\Vehicle::find($data['vehicle_id']);
            if ($vehicle && $vehicle->driver_id) {
                $data['driver_id'] = $vehicle->driver_id;
            }
        }

        $task = Task::create($data);
        return $this->findById($task->id);
    }

    /**
     * Update an existing task.
     */
    public function update(Task $task, array $data): Task
    {
        if (isset($data['pickup_lat']) && isset($data['pickup_lng'])) {
            $lat = (float) $data['pickup_lat'];
            $lng = (float) $data['pickup_lng'];
            $data['pickup_location'] = DB::raw("ST_GeomFromText('POINT($lng $lat)', 4326)");
            unset($data['pickup_lat'], $data['pickup_lng']);
        }

        if (isset($data['dropoff_lat']) && isset($data['dropoff_lng'])) {
            $lat = (float) $data['dropoff_lat'];
            $lng = (float) $data['dropoff_lng'];
            $data['dropoff_location'] = DB::raw("ST_GeomFromText('POINT($lng $lat)', 4326)");
            unset($data['dropoff_lat'], $data['dropoff_lng']);
        }

        // Auto-resolve driver from vehicle if reassigned and driver not explicitly changed
        if (isset($data['vehicle_id']) && !isset($data['driver_id'])) {
            $vehicle = \App\Models\Fleet\Vehicle::find($data['vehicle_id']);
            if ($vehicle && $vehicle->driver_id) {
                $data['driver_id'] = $vehicle->driver_id;
            }
        }

        $task->update($data);
        return $this->findById($task->id);
    }

    /**
     * Delete a task.
     */
    public function delete(Task $task): bool
    {
        return $task->delete();
    }
}

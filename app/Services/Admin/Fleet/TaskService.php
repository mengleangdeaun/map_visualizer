<?php

namespace App\Services\Admin\Fleet;

use App\Models\Driver\Task;
use App\Services\Admin\Fleet\DocumentNumberingService;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class TaskService
{
    protected $documentNumberingService;

    public function __construct(DocumentNumberingService $documentNumberingService)
    {
        $this->documentNumberingService = $documentNumberingService;
    }
    /**
     * Find a task by ID with spatial data.
     */
    public function findById(string $id): Task
    {
        return Task::query()
            ->select([
                'id',
                'company_id',
                'vehicle_id',
                'driver_id',
                'tracking_number',
                'title',
                'description',
                'status',
                'contact_name',
                'contact_phone',
                'pickup_address',
                'dropoff_address',
                'scheduled_at',
                'started_at',
                'completed_at',
                'priority',
                'created_by',
                'updated_by',
                'created_at',
                'updated_at',
            ])
            ->selectRaw('ST_Y(pickup_location::geometry) as pickup_lat')
            ->selectRaw('ST_X(pickup_location::geometry) as pickup_lng')
            ->selectRaw('ST_Y(dropoff_location::geometry) as dropoff_lat')
            ->selectRaw('ST_X(dropoff_location::geometry) as dropoff_lng')
            ->with([
                'company' => function($q) {
                    $q->select(['id', 'name', 'slug']);
                },
                'vehicle' => function($q) {
                    $q->select([
                        'id',
                        'driver_id',
                        'type',
                        'plate_number',
                        'is_active'
                    ])
                    ->selectRaw('ST_Y(last_location::geometry) as latitude')
                    ->selectRaw('ST_X(last_location::geometry) as longitude');
                },
                'driver' => function($q) {
                    $q->select([
                        'id',
                        'name',
                        'phone',
                        'email'
                    ]);
                },
                'driver.vehicles' => function($q) {
                    $q->select('*')
                      ->selectRaw('ST_Y(last_location::geometry) as latitude')
                      ->selectRaw('ST_X(last_location::geometry) as longitude');
                }
            ])
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
            ->select([
                'id',
                'company_id',
                'vehicle_id',
                'driver_id',
                'tracking_number',
                'title',
                'description',
                'status',
                'contact_name',
                'contact_phone',
                'pickup_address',
                'dropoff_address',
                'scheduled_at',
                'started_at',
                'completed_at',
                'priority',
                'created_by',
                'updated_by',
                'created_at',
                'updated_at',
            ])
            ->selectRaw('ST_Y(pickup_location::geometry) as pickup_lat')
            ->selectRaw('ST_X(pickup_location::geometry) as pickup_lng')
            ->selectRaw('ST_Y(dropoff_location::geometry) as dropoff_lat')
            ->selectRaw('ST_X(dropoff_location::geometry) as dropoff_lng')
            ->with([
                'vehicle' => function($q) {
                    $q->select([
                        'id',
                        'driver_id',
                        'type',
                        'plate_number',
                        'is_active'
                    ])
                    ->selectRaw('ST_Y(last_location::geometry) as latitude')
                    ->selectRaw('ST_X(last_location::geometry) as longitude');
                },
                'driver' => function($q) {
                    $q->select([
                        'id',
                        'name',
                        'phone',
                        'email'
                    ]);
                },
                'driver.vehicles' => function($q) {
                    $q->select('*')
                      ->selectRaw('ST_Y(last_location::geometry) as latitude')
                      ->selectRaw('ST_X(last_location::geometry) as longitude');
                }
            ]);

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
            $query->where(function ($q) use ($search) {
                $q->where('title', 'LIKE', "%{$search}%")
                  ->orWhere('tracking_number', 'LIKE', "%{$search}%");
            });
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

        // Auto-resolve vehicle from driver if not provided
        if (isset($data['driver_id']) && !isset($data['vehicle_id'])) {
            $driver = \App\Models\User\User::find($data['driver_id']);
            if ($driver) {
                $activeShift = \App\Models\Fleet\VehicleShift::where('driver_id', $driver->id)
                    ->whereNull('ended_at')
                    ->first();
                if ($activeShift) {
                    $data['vehicle_id'] = $activeShift->vehicle_id;
                }
            }
        }

        if (empty($data['tracking_number']) && isset($data['company_id'])) {
            $data['tracking_number'] = $this->documentNumberingService->generateNextNumberByScope('task', $data['company_id'])
                ?? ('TSK-' . date('ymd') . '-' . strtoupper(Str::random(8)));
        }

        $task = Task::create($data);
        $this->updateSpatialData($task->id, $pickupLat, $pickupLng, $dropoffLat, $dropoffLng);
        
        $resolvedTask = $this->findById($task->id);
        
        // Trigger multi-channel notifications
        app(\App\Services\Notification\NotificationService::class)->notifyNewTask($resolvedTask);
        
        return $resolvedTask;
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

        // Auto-resolve vehicle from driver if reassigned and vehicle not explicitly changed
        if (isset($data['driver_id']) && !isset($data['vehicle_id'])) {
            $driver = \App\Models\User\User::find($data['driver_id']);
            if ($driver) {
                $activeShift = \App\Models\Fleet\VehicleShift::where('driver_id', $driver->id)
                    ->whereNull('ended_at')
                    ->first();
                if ($activeShift) {
                    $data['vehicle_id'] = $activeShift->vehicle_id;
                }
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
        // Sanitize inputs to ensure they are floats
        $pLat = $pLat !== null ? (float)$pLat : null;
        $pLng = $pLng !== null ? (float)$pLng : null;
        $dLat = $dLat !== null ? (float)$dLat : null;
        $dLng = $dLng !== null ? (float)$dLng : null;

        $pickupSql = ($pLat !== null && $pLng !== null && $pLat != 0) 
            ? "ST_SetSRID(ST_MakePoint($pLng, $pLat), 4326)" 
            : "NULL";
            
        $dropoffSql = ($dLat !== null && $dLng !== null && $dLat != 0) 
            ? "ST_SetSRID(ST_MakePoint($dLng, $dLat), 4326)" 
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

<?php

namespace App\Http\Controllers\Api\Admin\Fleet;

use App\Http\Controllers\Controller;
use App\Models\Driver\Task;
use App\Services\Admin\Fleet\TaskService;
use App\Events\TaskUpdated;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class TaskController extends Controller
{
    protected $taskService;

    public function __construct(TaskService $taskService)
    {
        $this->taskService = $taskService;
    }

    /**
     * Display a listing of tasks.
     */
    public function index(Request $request): JsonResponse
    {
        $params = $request->only(['per_page', 'search', 'status', 'vehicle_id', 'company_id']);
        $user = $request->user();
        
        if ($user->company_id) {
            $params['company_id'] = $user->company_id;
        }

        $tasks = $this->taskService->list($params);
        return response()->json($tasks);
    }

    /**
     * Store a newly created task in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'vehicle_id' => 'nullable|ulid|exists:vehicles,id',
            'driver_id' => 'nullable|ulid|exists:users,id',
            'customer_id' => 'nullable|ulid|exists:customers,id',
            'source' => 'required|in:manual,external',
            'external_order_id' => 'nullable|string',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'required|in:pending,assigned,in_progress,completed,cancelled',
            'receiver_name' => 'nullable|string|max:255',
            'receiver_phone' => 'nullable|string|max:20',
            'pickup_lat' => 'nullable|numeric',
            'pickup_lng' => 'nullable|numeric',
            'dropoff_lat' => 'nullable|numeric',
            'dropoff_lng' => 'nullable|numeric',
            'pickup_address' => 'nullable|string',
            'dropoff_address' => 'nullable|string',
            'scheduled_at' => 'nullable|date',
        ]);

        if ($request->user()->company_id) {
            $validated['company_id'] = $request->user()->company_id;
        }

        $task = $this->taskService->create($validated);
        
        broadcast(new TaskUpdated($task));

        return response()->json([
            'message' => 'Task created successfully',
            'data' => $task
        ], 201);
    }

    /**
     * Display the specified task.
     */
    public function show(string $id): JsonResponse
    {
        $task = $this->taskService->findById($id);
        return response()->json($task);
    }

    /**
     * Update the specified task in storage.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $task = Task::findOrFail($id);
        
        $validated = $request->validate([
            'vehicle_id' => 'nullable|ulid|exists:vehicles,id',
            'driver_id' => 'nullable|ulid|exists:users,id',
            'customer_id' => 'nullable|ulid|exists:customers,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'required|in:pending,assigned,in_progress,completed,cancelled',
            'receiver_name' => 'nullable|string|max:255',
            'receiver_phone' => 'nullable|string|max:20',
            'pickup_lat' => 'nullable|numeric',
            'pickup_lng' => 'nullable|numeric',
            'dropoff_lat' => 'nullable|numeric',
            'dropoff_lng' => 'nullable|numeric',
            'pickup_address' => 'nullable|string',
            'dropoff_address' => 'nullable|string',
            'scheduled_at' => 'nullable|date',
        ]);

        $task = $this->taskService->update($task, $validated);
        
        broadcast(new TaskUpdated($task));

        return response()->json([
            'message' => 'Task updated successfully',
            'data' => $task
        ]);
    }

    /**
     * Remove the specified task from storage.
     */
    public function destroy(string $id): JsonResponse
    {
        $task = Task::findOrFail($id);
        $this->taskService->delete($task);

        return response()->json([
            'message' => 'Task deleted successfully'
        ]);
    }
}

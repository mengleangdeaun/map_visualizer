<?php

namespace App\Http\Controllers\Api\Driver\Task;

use App\Http\Controllers\Controller;
use App\Models\Driver\Task;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TaskController extends Controller
{
    /**
     * Get tasks assigned to the authenticated driver.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        
        // A driver is assigned to a task via their current vehicle.
        // Or directly if we add driver_id to tasks (Enterprise standard usually uses driver_id for direct assignment).
        
        // Let's assume tasks have a driver_id or we filter by vehicle assigned to the driver.
        // For simplicity and strictness, let's filter by driver_id if it exists, or vehicle_id.
        
        $query = Task::with(['customer', 'vehicle'])
            ->where(function($q) use ($user) {
                $q->where('driver_id', $user->id)
                  ->orWhereHas('vehicle', function($vq) use ($user) {
                      $vq->where('driver_id', $user->id);
                  });
            })
            ->whereIn('status', ['assigned', 'in_progress', 'pending'])
            ->orderBy('created_at', 'desc');

        return response()->json($query->paginate(20));
    }

    /**
     * Update task status (lifecycle management).
     */
    public function updateStatus(Request $request, Task $task): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|string|in:in_progress,completed,cancelled',
            'notes' => 'nullable|string',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
        ]);

        $task->update([
            'status' => $validated['status'],
        ]);

        broadcast(new \App\Events\TaskUpdated($task));

        return response()->json([
            'message' => "Task status updated to {$validated['status']}",
            'data' => $task->load(['customer', 'vehicle'])
        ]);
    }
}

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
        
        $query = Task::query()
            ->select('*')
            ->selectRaw('ST_Y(pickup_location::geometry) as pickup_lat')
            ->selectRaw('ST_X(pickup_location::geometry) as pickup_lng')
            ->selectRaw('ST_Y(dropoff_location::geometry) as dropoff_lat')
            ->selectRaw('ST_X(dropoff_location::geometry) as dropoff_lng')
            ->with(['vehicle'])
            ->where(function($q) use ($user) {
                $q->where('driver_id', $user->id)
                  ->orWhereHas('vehicle', function($vq) use ($user) {
                      $vq->where('driver_id', $user->id);
                  });
            });

        // 1. History or Active Status Filter
        if ($request->filled('status') && $request->input('status') !== 'all') {
            $query->where('status', $request->input('status'));
        } else {
            if ($request->boolean('history') || $request->input('history') === 'true') {
                $query->whereIn('status', ['completed', 'cancelled']);
            } else {
                $query->whereIn('status', ['assigned', 'in_progress', 'pending']);
            }
        }

        // 2. Priority Filter
        if ($request->filled('priority') && $request->input('priority') !== 'all') {
            $query->where('priority', $request->input('priority'));
        }

        // 3. Date Filter (Formats standard Y-m-d)
        if ($request->filled('date')) {
            $query->whereDate('scheduled_at', $request->input('date'));
        }

        $query->orderBy('created_at', 'desc');

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

        $updatedTask = Task::query()
            ->select('*')
            ->selectRaw('ST_Y(pickup_location::geometry) as pickup_lat')
            ->selectRaw('ST_X(pickup_location::geometry) as pickup_lng')
            ->selectRaw('ST_Y(dropoff_location::geometry) as dropoff_lat')
            ->selectRaw('ST_X(dropoff_location::geometry) as dropoff_lng')
            ->with(['vehicle'])
            ->find($task->id);

        return response()->json([
            'message' => "Task status updated to {$validated['status']}",
            'data' => $updatedTask
        ]);
    }
}

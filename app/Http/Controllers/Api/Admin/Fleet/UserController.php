<?php

namespace App\Http\Controllers\Api\Admin\Fleet;

use App\Http\Controllers\Controller;
use App\Models\User\User;
use App\Services\System\User\UserService;
use App\Http\Requests\System\User\StoreUserRequest;
use App\Http\Requests\System\User\UpdateUserRequest;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class UserController extends Controller
{
    protected $userService;

    public function __construct(UserService $userService)
    {
        $this->userService = $userService;
    }

    /**
     * Display a listing of users belonging to the company.
     */
    public function index(Request $request): JsonResponse
    {
        $params = $request->only(['per_page', 'search', 'role', 'status']);
        $user = $request->user();

        // Enforce company scope
        if ($user->company_id) {
            $params['company_id'] = $user->company_id;
        } else {
            // If the logged-in system user has no company_id (platform staff), allow filtering by param
            $params['company_id'] = $request->query('company_id');
        }

        $users = $this->userService->list($params);

        return response()->json($users);
    }

    /**
     * Store a newly created user in storage.
     */
    public function store(StoreUserRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $user = $request->user();

        // Enforce company scope
        if ($user->company_id) {
            $validated['company_id'] = $user->company_id;
        }

        // Restrict role to valid company roles (do not allow super_admin / system_staff)
        if (in_array($validated['role'], ['super_admin', 'system_staff'])) {
            return response()->json(['message' => 'Unauthorized role assignment'], 403);
        }

        $newUser = $this->userService->create($validated);

        return response()->json([
            'message' => 'User created successfully',
            'data' => $newUser->load(['company', 'hub'])
        ], 201);
    }

    /**
     * Display the specified user.
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $user = $request->user();
        $query = User::query();

        if ($user->company_id) {
            $query->where('company_id', $user->company_id);
        }

        $foundUser = $query->findOrFail($id);

        return response()->json($foundUser->load(['company', 'hub']));
    }

    /**
     * Update the specified user in storage.
     */
    public function update(UpdateUserRequest $request, string $id): JsonResponse
    {
        $user = $request->user();
        $query = User::query();

        if ($user->company_id) {
            $query->where('company_id', $user->company_id);
        }

        $foundUser = $query->findOrFail($id);
        $validated = $request->validated();

        // Enforce company scope
        if ($user->company_id) {
            $validated['company_id'] = $user->company_id;
        }

        // Restrict role to valid company roles
        if (isset($validated['role']) && in_array($validated['role'], ['super_admin', 'system_staff'])) {
            return response()->json(['message' => 'Unauthorized role assignment'], 403);
        }

        $updatedUser = $this->userService->update($foundUser, $validated);

        return response()->json([
            'message' => 'User updated successfully',
            'data' => $updatedUser->load(['company', 'hub'])
        ]);
    }

    /**
     * Remove the specified user from storage.
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $user = $request->user();
        $query = User::query();

        if ($user->company_id) {
            $query->where('company_id', $user->company_id);
        }

        $foundUser = $query->findOrFail($id);
        $this->userService->delete($foundUser);

        return response()->json(['message' => 'User deleted successfully']);
    }
}

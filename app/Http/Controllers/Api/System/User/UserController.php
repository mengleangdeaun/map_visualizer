<?php

namespace App\Http\Controllers\Api\System\User;

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
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        $users = $this->userService->list($request->all());
        return response()->json($users);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreUserRequest $request): JsonResponse
    {
        $user = $this->userService->create($request->validated());
        return response()->json([
            'message' => 'User created successfully',
            'data' => $user->load(['company', 'hub'])
        ], 210);
    }

    /**
     * Display the specified resource.
     */
    public function show(User $user): JsonResponse
    {
        return response()->json($user->load(['company', 'hub']));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateUserRequest $request, User $user): JsonResponse
    {
        $user = $this->userService->update($user, $request->validated());
        return response()->json([
            'message' => 'User updated successfully',
            'data' => $user->load(['company', 'hub'])
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(User $user): JsonResponse
    {
        $this->userService->delete($user);
        return response()->json(['message' => 'User deleted successfully']);
    }
}

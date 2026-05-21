<?php

namespace App\Services\System\User;

use App\Models\User\User;
use Illuminate\Support\Facades\Storage;
use Illuminate\Pagination\LengthAwarePaginator;

class UserService
{
    /**
     * List users with pagination and filtering.
     */
    public function list(array $params): LengthAwarePaginator
    {
        $perPage = $params['per_page'] ?? 10;
        $search = $params['search'] ?? null;
        $companyId = $params['company_id'] ?? null;
        $role = $params['role'] ?? null;
        $status = $params['status'] ?? null;
        $type = $params['type'] ?? null; // platform, company

        $query = User::query()
            ->select([
                'id',
                'company_id',
                'role',
                'name',
                'phone',
                'email',
                'telegram_user_id',
                'base_hub_id',
                'status',
                'operational_status',
                'profile_url',
                'permissions',
                'telegram_chat_id',
                'telegram_topic_id',
                'created_at',
                'updated_at',
            ])
            ->with([
                'company' => function($q) {
                    $q->select([
                        'id',
                        'name',
                        'slug',
                        'tax_id',
                        'base_currency',
                        'logo_url',
                        'status',
                        'telegram_user_id',
                        'exchange_rate_mode',
                        'exchange_rate_override_value',
                    ]);
                },
                'hub' => function($q) {
                    $q->select([
                        'id',
                        'company_id',
                        'code',
                        'name',
                        'type',
                    ])
                    ->selectRaw('ST_Y(location::geometry) as latitude')
                    ->selectRaw('ST_X(location::geometry) as longitude');
                }
            ]);

        if ($type === 'platform') {
            $query->whereNull('company_id');
        } elseif ($type === 'company') {
            $query->whereNotNull('company_id');
        }

        if ($companyId) {
            $query->where('company_id', $companyId);
        }

        if ($role) {
            $query->where('role', $role);
        }

        if ($status) {
            $query->where('status', $status);
        }

        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('name', 'LIKE', "%{$search}%")
                  ->orWhere('email', 'LIKE', "%{$search}%")
                  ->orWhere('phone', 'LIKE', "%{$search}%");
            });
        }

        return $query->latest()->paginate($perPage);
    }

    /**
     * Create a new user.
     */
    public function create(array $data): User
    {
        $user = new User();
        $user->fill($data);

        if (isset($data['password'])) {
            $user->password = bcrypt($data['password']);
        }

        if (isset($data['profile'])) {
            $user->profile_url = $data['profile']->store('profiles', 'public');
        }

        if (isset($data['permissions']) && is_string($data['permissions'])) {
            $user->permissions = json_decode($data['permissions'], true);
        }

        $user->save();

        return $user;
    }

    /**
     * Update an existing user.
     */
    public function update(User $user, array $data): User
    {
        if (isset($data['password'])) {
            $data['password'] = bcrypt($data['password']);
        } else {
            unset($data['password']);
        }

        if (isset($data['profile'])) {
            $this->deleteProfileImage($user);
            $user->profile_url = $data['profile']->store('profiles', 'public');
            unset($data['profile_url']);
        } elseif (array_key_exists('profile_url', $data) && empty($data['profile_url'])) {
            $user->profile_url = null;
        }

        if (isset($data['permissions']) && is_string($data['permissions'])) {
            $data['permissions'] = json_decode($data['permissions'], true);
        }

        $user->fill($data);
        $user->save();

        return $user;
    }

    /**
     * Delete a user.
     */
    public function delete(User $user): bool
    {
        $this->deleteProfileImage($user);
        return $user->delete();
    }

    /**
     * Helper to delete profile image from storage.
     */
    protected function deleteProfileImage(User $user): void
    {
        $oldPath = $user->getAttributes()['profile_url'] ?? null;
        if ($oldPath && Storage::disk('public')->exists($oldPath)) {
            Storage::disk('public')->delete($oldPath);
        }
    }
}

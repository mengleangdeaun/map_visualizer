<?php

namespace App\Http\Requests\System\User;

use Illuminate\Foundation\Http\FormRequest;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'company_id' => 'sometimes|nullable|exists:companies,id',
            'role' => 'sometimes|required|string|in:super_admin,system_staff,admin,dispatcher,hub_operator,driver',
            'name' => 'sometimes|required|string|max:255',
            'phone' => 'sometimes|required|string|max:20',
            'email' => 'nullable|email|max:255',
            'password' => 'nullable|string|min:8',
            'telegram_user_id' => 'nullable|string|max:255',
            'base_hub_id' => 'nullable|exists:locations,id',
            'status' => 'sometimes|required|string|in:active,suspended,inactive',
            'profile' => 'nullable|file|image|max:2048',
            'profile_url' => 'nullable|string',
            'permissions' => 'nullable|string',
        ];
    }
}

<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create Super Admin User
        \App\Models\User\User::updateOrCreate(
            ['email' => 'mengleangdeaun@gmail.com'],
            [
                'company_id' => null, // Platform Staff have null company_id
                'role' => 'super_admin',
                'phone' => '+855 00 000 000',
                'name' => 'Mengleang Deaun',
                'password' => \Illuminate\Support\Facades\Hash::make('111213@S251'),
                'status' => 'active',
                'operational_status' => 'online',
                'permissions' => [
                    'manage_all_companies' => true,
                    'access_billing' => true,
                    'edit_system_settings' => true,
                    'manage_platform_users' => true,
                ],
            ]
        );
    }
}

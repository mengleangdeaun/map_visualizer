<?php

namespace Database\Seeders;

// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create Platform Company
        $platform = \App\Models\System\Company::updateOrCreate(
            ['slug' => 'platform'],
            [
                'name' => 'MapCN Platform',
                'status' => 'active',
            ]
        );

        // Create Super Admin User
        \App\Models\User\User::updateOrCreate(
            ['email' => 'mengleangdeaun@gmail.com'],
            [
                'company_id' => null, // Platform Staff have null company_id
                'role' => 'admin',
                'name' => 'Mengleang Deaun',
                'password' => \Illuminate\Support\Facades\Hash::make('111213@S251'),
                'status' => 'active',
                'operational_status' => 'online',
                'permissions' => [
                    'manage_all_companies' => true,
                    'access_billing' => true,
                    'edit_system_settings' => true,
                ],
            ]
        );
    }
}

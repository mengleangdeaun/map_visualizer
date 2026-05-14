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
            ['slug' => 'sccg'],
            [
                'name' => 'SCCG Platform',
                'status' => 'active',
            ]
        );

        // Call other seeders
        $this->call([
            UserSeeder::class,
        ]);
    }
}

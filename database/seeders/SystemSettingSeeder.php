<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SystemSettingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $settings = [
            [
                'id' => 1,
                'key' => 'exchange_rate_current_value',
                'value' => '4014',
                'type' => 'float',
                'created_at' => '2026-04-24 02:53:04',
                'updated_at' => '2026-05-16 02:00:08',
            ],
            [
                'id' => 2,
                'key' => 'exchange_rate_last_sync',
                'value' => '2026-05-16 09:00:08',
                'type' => 'string',
                'created_at' => '2026-04-24 02:53:04',
                'updated_at' => '2026-05-16 02:00:08',
            ],
            [
                'id' => 3,
                'key' => 'exchange_rate_mode',
                'value' => 'auto',
                'type' => 'string',
                'created_at' => '2026-04-24 02:53:22',
                'updated_at' => '2026-04-24 02:53:22',
            ],
            [
                'id' => 4,
                'key' => 'exchange_rate_manual_value',
                'value' => '4001',
                'type' => 'float',
                'created_at' => '2026-04-24 02:53:22',
                'updated_at' => '2026-04-24 02:53:22',
            ],
            [
                'id' => 5,
                'key' => 'exchange_rate_provider_url',
                'value' => 'https://www.nbc.gov.kh/api/exRate.php',
                'type' => 'string',
                'created_at' => '2026-04-24 02:53:22',
                'updated_at' => '2026-04-24 02:53:22',
            ],
            [
                'id' => 6,
                'key' => 'exchange_rate_provider_type',
                'value' => 'xml',
                'type' => 'string',
                'created_at' => '2026-04-24 02:53:22',
                'updated_at' => '2026-04-24 02:53:22',
            ],
            [
                'id' => 7,
                'key' => 'exchange_rate_api_key',
                'value' => null,
                'type' => 'string',
                'created_at' => '2026-04-24 02:53:22',
                'updated_at' => '2026-04-24 02:53:22',
            ],
            [
                'id' => 8,
                'key' => 'exchange_rate_data_path',
                'value' => 'average',
                'type' => 'string',
                'created_at' => '2026-04-24 02:53:22',
                'updated_at' => '2026-04-24 02:53:22',
            ],
        ];

        foreach ($settings as $setting) {
            DB::table('system_settings')->updateOrInsert(
                ['key' => $setting['key']],
                $setting
            );
        }
    }
}

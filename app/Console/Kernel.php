<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    /**
     * Define the application's command schedule.
     */
    protected function schedule(Schedule $schedule): void
    {
        $schedule->command('exchange-rate:sync')
            ->dailyAt('09:00')
            ->timezone('Asia/Phnom_Penh');

        $schedule->command('exchange-rate:sync')
            ->dailyAt('15:00')
            ->timezone('Asia/Phnom_Penh');

        $schedule->command('fleet:dispatch-broadcasts')
            ->everyMinute();
    }


    /**
     * Register the commands for the application.
     */
    protected function commands(): void
    {
        $this->load(__DIR__.'/Commands');

        require base_path('routes/console.php');
    }
}

<?php

namespace App\Console\Commands;

use App\Models\System\Broadcast;
use App\Models\User\User;
use App\Notifications\DynamicActionNotification;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Notification;

class DispatchScheduledBroadcasts extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'fleet:dispatch-broadcasts';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Dispatches scheduled announcements and broadcasts to drivers';

    /**
     * Execute the console command.
     */
    public function handle(): void
    {
        $broadcasts = Broadcast::where('status', 'draft')
            ->where('scheduled_at', '<=', now())
            ->get();

        if ($broadcasts->isEmpty()) {
            $this->info('No pending scheduled broadcasts to dispatch.');
            return;
        }

        foreach ($broadcasts as $broadcast) {
            $broadcast->update(['status' => 'sending']);

            $this->info("Dispatching broadcast: {$broadcast->id}");

            // Resolve target audience drivers
            $query = User::where('company_id', $broadcast->company_id)
                ->where('role', 'driver');

            // Apply filters based on target audience
            if ($broadcast->target_audience === 'active_drivers') {
                $query->whereHas('vehicles', function ($q) {
                    $q->where('is_active', true);
                });
            }

            $drivers = $query->get();
            $successCount = 0;

            foreach ($drivers as $driver) {
                try {
                    // Create Broadcast Recipient record
                    $broadcast->recipients()->create([
                        'user_id' => $driver->id,
                        'status' => 'delivered',
                    ]);

                    // Dispatch Dynamic action notification
                    $driver->notify(new DynamicActionNotification(
                        'admin_announcement',
                        $broadcast->company_id,
                        [
                            'title' => 'Important Announcement',
                            'description' => $broadcast->message,
                            'message' => $broadcast->message,
                        ]
                    ));

                    $successCount++;
                } catch (\Exception $e) {
                    $broadcast->recipients()->create([
                        'user_id' => $driver->id,
                        'status' => 'failed',
                        'error_message' => $e->getMessage(),
                    ]);
                }
            }

            $broadcast->update([
                'status' => 'completed',
                'success_count' => $successCount,
            ]);

            $this->info("Broadcast {$broadcast->id} completed. Sent to {$successCount} drivers.");
        }
    }
}

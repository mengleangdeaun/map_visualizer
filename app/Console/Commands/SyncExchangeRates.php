<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\System\ExchangeRate\ExchangeRateService;

class SyncExchangeRates extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'exchange-rate:sync';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Synchronize exchange rate from National Bank of Cambodia (NBC)';

    /**
     * Execute the console command.
     */
    public function handle(ExchangeRateService $exchangeRateService)
    {
        $this->info('Starting exchange rate synchronization from NBC...');

        $result = $exchangeRateService->syncExchangeRate();

        if ($result['success']) {
            $this->info("Exchange rate synchronized successfully!");
            $this->info("Current Rate: " . $result['rate']);
            $this->info("Last Sync: " . $result['last_sync']);
            return Command::SUCCESS;
        } else {
            $this->error("Failed to synchronize exchange rate: " . $result['error']);
            return Command::FAILURE;
        }
    }
}

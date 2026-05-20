<?php

namespace App\Services\Admin\Fleet;

use App\Models\Fleet\DocumentNumberSetting;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;

class DocumentNumberingService
{
    /**
     * List numbering configurations with pagination and filtering.
     */
    public function list(array $params): LengthAwarePaginator
    {
        $perPage = $params['per_page'] ?? 10;
        $companyId = $params['company_id'] ?? null;
        $search = $params['search'] ?? null;

        $query = DocumentNumberSetting::query()->with(['company']);

        if ($companyId) {
            $query->where('company_id', $companyId);
        }

        if ($search) {
            $query->where('name', 'LIKE', "%{$search}%")
                  ->orWhere('prefix', 'LIKE', "%{$search}%")
                  ->orWhere('sequence_scope', 'LIKE', "%{$search}%");
        }

        return $query->latest()->paginate($perPage);
    }

    /**
     * Create a new configuration.
     */
    public function create(array $data): DocumentNumberSetting
    {
        return DocumentNumberSetting::create($data);
    }

    /**
     * Update an existing configuration.
     */
    public function update(DocumentNumberSetting $setting, array $data): DocumentNumberSetting
    {
        $setting->update($data);
        return $setting->fresh();
    }

    /**
     * Delete a configuration.
     */
    public function delete(DocumentNumberSetting $setting): bool
    {
        return $setting->delete();
    }

    /**
     * Generate the next sequential number by configuration scope.
     * Returns null if no active configuration exists for the scope.
     */
    public function generateNextNumberByScope(string $scope, string $companyId): ?string
    {
        $setting = DocumentNumberSetting::where('company_id', $companyId)
            ->where('sequence_scope', $scope)
            ->where('is_active', true)
            ->first();

        if (!$setting) {
            return null;
        }

        return $this->generateNextNumber($setting);
    }

    /**
     * Generate the next formatted sequential number.
     * Uses pessimistic locking to guarantee counter unique consistency.
     */
    public function generateNextNumber(DocumentNumberSetting $setting): string
    {
        return DB::transaction(function () use ($setting) {
            // Lock the setting row for update to prevent sequence race conditions
            $setting = DocumentNumberSetting::where('id', $setting->id)
                ->lockForUpdate()
                ->firstOrFail();

            $now = Carbon::now();
            $shouldReset = false;

            if ($setting->last_reset_at) {
                $lastReset = Carbon::parse($setting->last_reset_at);
                switch (strtolower($setting->reset_frequency)) {
                    case 'daily':
                        $shouldReset = $now->format('Y-m-d') !== $lastReset->format('Y-m-d');
                        break;
                    case 'monthly':
                        $shouldReset = $now->format('Y-m') !== $lastReset->format('Y-m');
                        break;
                    case 'yearly':
                        $shouldReset = $now->format('Y') !== $lastReset->format('Y');
                        break;
                }
            }

            // Perform reset if frequency demands it
            if ($shouldReset) {
                $setting->next_number = 1;
                $setting->last_reset_at = $now;
            } elseif (!$setting->last_reset_at) {
                $setting->last_reset_at = $now;
            }

            // Create formatted sequence string
            $seq = str_pad((string) $setting->next_number, $setting->digit_padding, '0', STR_PAD_LEFT);
            
            $separator = $setting->separator === 'None' ? '' : ($setting->separator ?? '');

            $replacements = [
                '{PREFIX}' => $setting->prefix ?? '',
                '{SUFFIX}' => $setting->suffix ?? '',
                '{YYYY}' => $now->format('Y'),
                '{YY}' => $now->format('y'),
                '{MM}' => $now->format('m'),
                '{DD}' => $now->format('d'),
                '{SEQ}' => $seq,
                '{SEPARATOR}' => $separator,
                '{SEP}' => $separator,
            ];

            $formatted = str_replace(array_keys($replacements), array_values($replacements), $setting->template);

            // Increment and persist setting state
            $setting->next_number += 1;
            $setting->save();

            return $formatted;
        });
    }
}

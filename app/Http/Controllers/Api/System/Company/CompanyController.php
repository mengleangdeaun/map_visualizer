<?php

namespace App\Http\Controllers\Api\System\Company;

use App\Http\Controllers\Controller;
use App\Models\System\Company;
use App\Http\Resources\System\SystemCompanyResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class CompanyController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $perPage = $request->input('per_page', 10);
        $search = $request->input('search');

        $query = Company::query()
            ->select([
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
                'created_at',
                'updated_at',
            ])
            ->with(['telegramSettings' => function($q) {
                $q->select([
                    'id',
                    'company_id',
                    'bot_token',
                    'company_chat_id',
                    'notify_pwa',
                    'notify_driver_telegram',
                    'notify_company_telegram',
                    'bot_username',
                    'bot_name',
                ]);
            }]);

        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('name', 'LIKE', "%{$search}%")
                  ->orWhere('slug', 'LIKE', "%{$search}%")
                  ->orWhere('tax_id', 'LIKE', "%{$search}%");
            });
        }

        $companies = $query->latest()->paginate($perPage);
        return SystemCompanyResource::collection($companies);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:companies,slug',
            'tax_id' => 'nullable|string|max:255',
            'base_currency' => 'nullable|string|size:3',
            'logo' => 'nullable|file|image|max:2048',
            'logo_url' => 'nullable|string|max:2048',
            'status' => 'nullable|string|in:active,inactive,suspended',
            'telegram_user_id' => 'nullable|string|max:255',
            'exchange_rate_mode' => 'nullable|string|in:global,override',
            'exchange_rate_override_value' => 'nullable|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();
        
        $company = new Company();
        $company->fill($data);
        
        if ($request->hasFile('logo')) {
            $company->logo_url = $request->file('logo')->store('logos', config('filesystems.default'));
        }

        $company->save();

        // Seed initial exchange rate snap for company
        $rate = 1.000000;
        if ($company->exchange_rate_mode === 'override' && $company->exchange_rate_override_value !== null) {
            $rate = (float) $company->exchange_rate_override_value;
        } else {
            $rate = (float) \App\Models\System\SystemSetting::getValue('exchange_rate_current_value', 4014.00);
        }

        \App\Models\System\ExchangeRate::create([
            'company_id' => $company->id,
            'from_currency' => 'USD',
            'to_currency' => 'KHR',
            'rate' => $rate,
            'effective_date' => now(),
        ]);

        return response()->json([
            'message' => 'Company created successfully',
            'data' => new SystemCompanyResource($company)
        ], 210);
    }

    /**
     * Display the specified resource.
     */
    public function show(Company $company)
    {
        $company->load('telegramSettings');
        return new SystemCompanyResource($company);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Company $company)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'slug' => 'sometimes|required|string|max:255|unique:companies,slug,' . $company->id,
            'tax_id' => 'nullable|string|max:255',
            'base_currency' => 'sometimes|required|string|size:3',
            'logo' => 'nullable|file|image|max:2048',
            'logo_url' => 'nullable|string|max:2048',
            'status' => 'sometimes|required|string|in:active,inactive,suspended',
            'telegram_user_id' => 'nullable|string|max:255',
            'exchange_rate_mode' => 'sometimes|required|string|in:global,override',
            'exchange_rate_override_value' => 'nullable|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();

        $oldMode = $company->exchange_rate_mode;
        $oldOverride = $company->exchange_rate_override_value;

        if ($request->hasFile('logo')) {
            $oldPath = $company->getAttributes()['logo_url'] ?? null;
            if ($oldPath && Storage::disk(config('filesystems.default'))->exists($oldPath)) {
                Storage::disk(config('filesystems.default'))->delete($oldPath);
            }
            $company->logo_url = $request->file('logo')->store('logos', config('filesystems.default'));
            unset($data['logo_url']); // Remove from data array to avoid double-handling
        } elseif ($request->exists('logo_url') && ($request->logo_url === null || $request->logo_url === '')) {
            $oldPath = $company->getAttributes()['logo_url'] ?? null;
            if ($oldPath && Storage::disk(config('filesystems.default'))->exists($oldPath)) {
                Storage::disk(config('filesystems.default'))->delete($oldPath);
            }
            $company->logo_url = null;
            unset($data['logo_url']);
        }

        unset($data['logo']);
        $company->fill($data);
        $company->save();

        // If exchange settings changed, record new entry in exchange_rates history
        if ($company->exchange_rate_mode !== $oldMode || $company->exchange_rate_override_value != $oldOverride) {
            $rate = 1.000000;
            if ($company->exchange_rate_mode === 'override' && $company->exchange_rate_override_value !== null) {
                $rate = (float) $company->exchange_rate_override_value;
            } else {
                $rate = (float) \App\Models\System\SystemSetting::getValue('exchange_rate_current_value', 4014.00);
            }

            \App\Models\System\ExchangeRate::create([
                'company_id' => $company->id,
                'from_currency' => 'USD',
                'to_currency' => 'KHR',
                'rate' => $rate,
                'effective_date' => now(),
            ]);
        }

        $company->load('telegramSettings');
        return response()->json([
            'message' => 'Company updated successfully',
            'data' => new SystemCompanyResource($company)
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Company $company)
    {
        // Get raw path from database to avoid accessor interference
        $oldPath = $company->getAttributes()['logo_url'] ?? null;
        
        if ($oldPath && Storage::disk(config('filesystems.default'))->exists($oldPath)) {
            Storage::disk(config('filesystems.default'))->delete($oldPath);
        }
        
        $company->delete();
        return response()->json(['message' => 'Company deleted successfully']);
    }
}

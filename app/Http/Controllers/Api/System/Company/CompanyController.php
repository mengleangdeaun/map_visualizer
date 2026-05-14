<?php

namespace App\Http\Controllers\Api\System\Company;

use App\Http\Controllers\Controller;
use App\Models\System\Company;
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

        $query = Company::query();

        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('name', 'LIKE', "%{$search}%")
                  ->orWhere('slug', 'LIKE', "%{$search}%")
                  ->orWhere('tax_id', 'LIKE', "%{$search}%");
            });
        }

        $companies = $query->latest()->paginate($perPage);
        return response()->json($companies);
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
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();
        
        $company = new Company();
        $company->fill($data);
        
        if ($request->hasFile('logo')) {
            $company->logo_url = $request->file('logo')->store('logos', 'public');
        }

        $company->save();

        return response()->json([
            'message' => 'Company created successfully',
            'data' => $company
        ], 210);
    }

    /**
     * Display the specified resource.
     */
    public function show(Company $company)
    {
        return response()->json($company);
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
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();

        if ($request->hasFile('logo')) {
            $oldPath = $company->getAttributes()['logo_url'] ?? null;
            if ($oldPath && Storage::disk('public')->exists($oldPath)) {
                Storage::disk('public')->delete($oldPath);
            }
            $company->logo_url = $request->file('logo')->store('logos', 'public');
            unset($data['logo_url']); // Remove from data array to avoid double-handling
        } elseif ($request->exists('logo_url') && ($request->logo_url === null || $request->logo_url === '')) {
            $oldPath = $company->getAttributes()['logo_url'] ?? null;
            if ($oldPath && Storage::disk('public')->exists($oldPath)) {
                Storage::disk('public')->delete($oldPath);
            }
            $company->logo_url = null;
            unset($data['logo_url']);
        }

        unset($data['logo']);
        $company->fill($data);
        $company->save();

        return response()->json([
            'message' => 'Company updated successfully',
            'data' => $company
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Company $company)
    {
        // Get raw path from database to avoid accessor interference
        $oldPath = $company->getAttributes()['logo_url'] ?? null;
        
        if ($oldPath && Storage::disk('public')->exists($oldPath)) {
            Storage::disk('public')->delete($oldPath);
        }
        
        $company->delete();
        return response()->json(['message' => 'Company deleted successfully']);
    }
}

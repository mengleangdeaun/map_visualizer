<?php

namespace App\Http\Controllers\Api\System\Company;

use App\Http\Controllers\Controller;
use App\Models\System\Company;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

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
            'tax_id' => 'nullable|string|max:255',
            'base_currency' => 'nullable|string|size:3',
            'telegram_user_id' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $company = Company::create($validator->validated());

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
            'tax_id' => 'nullable|string|max:255',
            'base_currency' => 'sometimes|required|string|size:3',
            'telegram_user_id' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $company->update($validator->validated());

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
        $company->delete();
        return response()->json(['message' => 'Company deleted successfully']);
    }
}

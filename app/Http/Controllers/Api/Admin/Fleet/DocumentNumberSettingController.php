<?php

namespace App\Http\Controllers\Api\Admin\Fleet;

use App\Http\Controllers\Controller;
use App\Models\Fleet\DocumentNumberSetting;
use App\Services\Admin\Fleet\DocumentNumberingService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class DocumentNumberSettingController extends Controller
{
    protected $numberingService;

    public function __construct(DocumentNumberingService $numberingService)
    {
        $this->numberingService = $numberingService;
    }

    /**
     * Display a listing of numbering configurations.
     */
    public function index(Request $request): JsonResponse
    {
        $params = $request->only(['per_page', 'search', 'company_id']);
        $user = $request->user();

        if ($user->company_id) {
            $params['company_id'] = $user->company_id;
        }

        $settings = $this->numberingService->list($params);

        return response()->json($settings);
    }

    /**
     * Store a newly created configuration in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'prefix' => 'nullable|string|max:50',
            'suffix' => 'nullable|string|max:50',
            'date_format' => 'nullable|string|in:None,YYYY,YY,YYYYMM,YYYYMMDD',
            'separator' => 'nullable|string|in:-,/,_,None',
            'digit_padding' => 'required|integer|min:1|max:10',
            'next_number' => 'required|integer|min:1',
            'reset_frequency' => 'required|string|in:None,Daily,Monthly,Yearly',
            'sequence_scope' => 'nullable|string|max:100',
            'template' => 'required|string|max:255',
            'is_active' => 'boolean',
        ]);

        if ($request->user()->company_id) {
            $validated['company_id'] = $request->user()->company_id;
        }

        $setting = $this->numberingService->create($validated);

        return response()->json([
            'message' => 'Document numbering setting created successfully',
            'data' => $setting
        ], 201);
    }

    /**
     * Display the specified configuration.
     */
    public function show(string $id): JsonResponse
    {
        $setting = DocumentNumberSetting::where('company_id', auth()->user()->company_id)
            ->findOrFail($id);

        return response()->json($setting);
    }

    /**
     * Update the specified configuration in storage.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $setting = DocumentNumberSetting::where('company_id', auth()->user()->company_id)
            ->findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'prefix' => 'nullable|string|max:50',
            'suffix' => 'nullable|string|max:50',
            'date_format' => 'nullable|string|in:None,YYYY,YY,YYYYMM,YYYYMMDD',
            'separator' => 'nullable|string|in:-,/,_,None',
            'digit_padding' => 'required|integer|min:1|max:10',
            'next_number' => 'required|integer|min:1',
            'reset_frequency' => 'required|string|in:None,Daily,Monthly,Yearly',
            'sequence_scope' => 'nullable|string|max:100',
            'template' => 'required|string|max:255',
            'is_active' => 'boolean',
        ]);

        $setting = $this->numberingService->update($setting, $validated);

        return response()->json([
            'message' => 'Document numbering setting updated successfully',
            'data' => $setting
        ]);
    }

    /**
     * Remove the specified configuration from storage.
     */
    public function destroy(string $id): JsonResponse
    {
        $setting = DocumentNumberSetting::where('company_id', auth()->user()->company_id)
            ->findOrFail($id);

        $this->numberingService->delete($setting);

        return response()->json([
            'message' => 'Document numbering setting deleted successfully'
        ]);
    }

    /**
     * Generate the next number for testing.
     */
    public function generate(string $id): JsonResponse
    {
        $setting = DocumentNumberSetting::where('company_id', auth()->user()->company_id)
            ->findOrFail($id);

        $number = $this->numberingService->generateNextNumber($setting);

        return response()->json([
            'number' => $number,
            'data' => $setting->fresh()
        ]);
    }
}

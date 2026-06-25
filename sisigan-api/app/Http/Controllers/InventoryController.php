<?php

namespace App\Http\Controllers;

use App\Models\Inventory;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class InventoryController extends Controller
{
    /**
     * Get all inventory items
     */
    public function index(): JsonResponse
    {
        try {
            $items = Inventory::all();
            return response()->json([
                'success' => true,
                'data' => $items,
                'message' => 'Inventory items retrieved successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve inventory items: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get low stock items
     */
    public function lowStock(): JsonResponse
    {
        try {
            $items = Inventory::lowStock();
            return response()->json([
                'success' => true,
                'data' => $items,
                'message' => 'Low stock items retrieved successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve low stock items: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get single inventory item
     */
    public function show(Inventory $inventory): JsonResponse
    {
        try {
            return response()->json([
                'success' => true,
                'data' => $inventory,
                'message' => 'Inventory item retrieved successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve inventory item: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create new inventory item
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'icon' => 'nullable|string',
                'color' => 'nullable|string',
                'quantity' => 'required|numeric|min:0',
                'unit' => 'required|string|max:50',
                'threshold' => 'required|numeric|min:0',
                'status' => 'nullable|in:normal,low',
            ]);

            // Auto-calculate status if not provided
            if (empty($validated['status'])) {
                $validated['status'] = $validated['quantity'] < $validated['threshold'] ? 'low' : 'normal';
            }

            $item = Inventory::create($validated);

            return response()->json([
                'success' => true,
                'data' => $item,
                'message' => 'Inventory item created successfully'
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create inventory item: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update inventory item
     */
    public function update(Request $request, Inventory $inventory): JsonResponse
    {
        try {
            $validated = $request->validate([
                'name' => 'sometimes|string|max:255',
                'icon' => 'nullable|string',
                'color' => 'nullable|string',
                'quantity' => 'sometimes|numeric|min:0',
                'unit' => 'sometimes|string|max:50',
                'threshold' => 'sometimes|numeric|min:0',
                'status' => 'nullable|in:normal,low',
            ]);

            // Auto-calculate status if quantity changed and status not explicitly provided
            if (isset($validated['quantity']) && !isset($validated['status'])) {
                $threshold = $validated['threshold'] ?? $inventory->threshold;
                $validated['status'] = $validated['quantity'] < $threshold ? 'low' : 'normal';
            }

            $inventory->update($validated);

            return response()->json([
                'success' => true,
                'data' => $inventory,
                'message' => 'Inventory item updated successfully'
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update inventory item: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete inventory item
     */
    public function destroy(Inventory $inventory): JsonResponse
    {
        try {
            $inventory->delete();

            return response()->json([
                'success' => true,
                'message' => 'Inventory item deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete inventory item: ' . $e->getMessage()
            ], 500);
        }
    }
}

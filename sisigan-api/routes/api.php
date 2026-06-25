<?php

use App\Http\Controllers\InventoryController;
use App\Http\Controllers\MenuController;
use App\Http\Controllers\OrderController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// Health check endpoint
Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'timestamp' => now()
    ]);
});

// Inventory API Routes
Route::apiResource('inventory', InventoryController::class);
Route::get('/inventory/low-stock', [InventoryController::class, 'lowStock']);

// Menu API Routes
Route::apiResource('menu', MenuController::class);
Route::get('/menu/categories', [MenuController::class, 'categories']);

// Orders API Routes
Route::apiResource('orders', OrderController::class);
Route::get('/orders/summary/today', [OrderController::class, 'todaysSummary']);
Route::get('/orders/report/sales', [OrderController::class, 'salesReport']);
Route::get('/orders/report/top-items', [OrderController::class, 'topItems']);

<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    /**
     * Get all orders with filtering
     */
    public function index(Request $request)
    {
        $query = Order::with('items.menu');

        if ($request->has('status') && $request->status !== 'All') {
            $query->where('status', $request->status);
        }

        return response()->json($query->latest()->get());
    }

    /**
     * Create a new order
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'customer_name' => 'required|string',
            'items' => 'required|array',
            'items.*.menu_id' => 'required|exists:menu_items,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.price' => 'required|numeric',
            'notes' => 'nullable|string',
        ]);

        $totalAmount = 0;
        foreach ($validated['items'] as $item) {
            $totalAmount += $item['price'] * $item['quantity'];
        }

        $order = Order::create([
            'customer_name' => $validated['customer_name'],
            'total_amount' => $totalAmount,
            'notes' => $validated['notes'] ?? null,
        ]);

        foreach ($validated['items'] as $item) {
            OrderItem::create([
                'order_id' => $order->id,
                'menu_id' => $item['menu_id'],
                'quantity' => $item['quantity'],
                'price' => $item['price'],
            ]);
        }

        return response()->json($order->load('items.menu'), 201);
    }

    /**
     * Get a single order
     */
    public function show(Order $order)
    {
        return response()->json($order->load('items.menu'));
    }

    /**
     * Update order status
     */
    public function update(Request $request, Order $order)
    {
        $validated = $request->validate([
            'status' => 'in:New,In Progress,Ready,Completed',
            'notes' => 'nullable|string',
        ]);

        $order->update($validated);

        return response()->json($order);
    }

    /**
     * Delete an order
     */
    public function destroy(Order $order)
    {
        $order->delete();

        return response()->json(['message' => 'Order deleted']);
    }

    /**
     * Get today's summary
     */
    public function todaysSummary()
    {
        $today = now()->startOfDay();

        $totalSales = Order::where('created_at', '>=', $today)
            ->where('status', 'Completed')
            ->sum('total_amount');

        $totalOrders = Order::where('created_at', '>=', $today)->count();

        return response()->json([
            'total_sales' => $totalSales,
            'total_orders' => $totalOrders,
            'avg_per_order' => $totalOrders > 0 ? $totalSales / $totalOrders : 0,
        ]);
    }

    /**
     * Get sales report
     */
    public function salesReport(Request $request)
    {
        $period = $request->get('period', 'today');
        $startDate = now()->startOfDay();

        switch ($period) {
            case 'week':
                $startDate = now()->startOfWeek();
                break;
            case 'month':
                $startDate = now()->startOfMonth();
                break;
        }

        $orders = Order::where('created_at', '>=', $startDate)
            ->where('status', 'Completed')
            ->get();

        $breakdown = [];
        foreach ($orders->groupBy(function ($date) {
            return $date->created_at->format('Y-m-d');
        }) as $date => $dateOrders) {
            $breakdown[] = [
                'date' => $date,
                'amount' => $dateOrders->sum('total_amount'),
                'order_count' => $dateOrders->count(),
            ];
        }

        $totalSales = $orders->sum('total_amount');
        $totalOrders = $orders->count();

        return response()->json([
            'total_sales' => $totalSales,
            'total_orders' => $totalOrders,
            'avg_per_order' => $totalOrders > 0 ? $totalSales / $totalOrders : 0,
            'breakdown' => $breakdown,
        ]);
    }

    /**
     * Get top selling items
     */
    public function topItems(Request $request)
    {
        $period = $request->get('period', 'today');
        $startDate = now()->startOfDay();

        switch ($period) {
            case 'week':
                $startDate = now()->startOfWeek();
                break;
            case 'month':
                $startDate = now()->startOfMonth();
                break;
        }

        $topItems = OrderItem::whereHas('order', function ($query) use ($startDate) {
            $query->where('created_at', '>=', $startDate)
                ->where('status', 'Completed');
        })
            ->with('menu')
            ->selectRaw('menu_id, SUM(quantity) as total_sold, SUM(quantity * price) as total_revenue')
            ->groupBy('menu_id')
            ->orderByDesc('total_sold')
            ->limit(5)
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->menu->id,
                    'name' => $item->menu->name,
                    'sold' => $item->total_sold,
                    'price' => $item->total_revenue,
                ];
            });

        return response()->json($topItems);
    }
}

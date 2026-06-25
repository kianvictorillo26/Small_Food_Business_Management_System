<?php

namespace Database\Seeders;

use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Database\Seeder;

class OrderSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $orders = [
            [
                'customer_name' => 'Juan',
                'status' => 'Ready',
                'items' => [
                    ['menu_id' => 1, 'quantity' => 2, 'price' => 120],
                    ['menu_id' => 5, 'quantity' => 1, 'price' => 20],
                ]
            ],
            [
                'customer_name' => 'Maria',
                'status' => 'In Progress',
                'items' => [
                    ['menu_id' => 2, 'quantity' => 3, 'price' => 180],
                ]
            ],
            [
                'customer_name' => 'Customer',
                'status' => 'Completed',
                'items' => [
                    ['menu_id' => 1, 'quantity' => 1, 'price' => 120],
                    ['menu_id' => 5, 'quantity' => 2, 'price' => 20],
                    ['menu_id' => 8, 'quantity' => 1, 'price' => 30],
                ]
            ],
            [
                'customer_name' => 'Pedro',
                'status' => 'New',
                'items' => [
                    ['menu_id' => 3, 'quantity' => 1, 'price' => 150],
                ]
            ],
            [
                'customer_name' => 'Rosa',
                'status' => 'Completed',
                'items' => [
                    ['menu_id' => 4, 'quantity' => 1, 'price' => 220],
                    ['menu_id' => 9, 'quantity' => 1, 'price' => 35],
                ]
            ],
        ];

        foreach ($orders as $orderData) {
            $items = $orderData['items'];
            unset($orderData['items']);

            $totalAmount = 0;
            foreach ($items as $item) {
                $totalAmount += $item['price'] * $item['quantity'];
            }

            $order = Order::create([
                ...$orderData,
                'total_amount' => $totalAmount,
            ]);

            foreach ($items as $item) {
                OrderItem::create([
                    'order_id' => $order->id,
                    'menu_id' => $item['menu_id'],
                    'quantity' => $item['quantity'],
                    'price' => $item['price'],
                ]);
            }
        }
    }
}

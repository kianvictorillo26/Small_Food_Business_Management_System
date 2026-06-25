<?php

namespace Database\Seeders;

use App\Models\Menu;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class MenuSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Disable foreign key constraints
        DB::statement('SET FOREIGN_KEY_CHECKS=0');
        
        // Clear existing menu items
        Menu::truncate();
        
        // Re-enable foreign key constraints
        DB::statement('SET FOREIGN_KEY_CHECKS=1');

        $items = [
            // Category 1: Sisig
            ['name' => 'Pork Sisig', 'price' => 150, 'category' => 'Sisig', 'available' => true, 'description' => 'Tender chopped pork with calamansi and chili peppers'],
            ['name' => 'Chicken Sisig', 'price' => 120, 'category' => 'Sisig', 'available' => true, 'description' => 'Juicy chicken sisig'],
            ['name' => 'Beef Sisig', 'price' => 160, 'category' => 'Sisig', 'available' => true, 'description' => 'Premium beef sisig'],
            ['name' => 'Tuna Sisig', 'price' => 140, 'category' => 'Sisig', 'available' => true, 'description' => 'Fresh tuna sisig'],
            ['name' => 'Bangus Sisig', 'price' => 145, 'category' => 'Sisig', 'available' => true, 'description' => 'Delicious bangus milkfish sisig'],
            ['name' => 'Tofu Sisig', 'price' => 110, 'category' => 'Sisig', 'available' => true, 'description' => 'Vegetarian tofu sisig'],
            ['name' => 'Spicy Pork Sisig', 'price' => 155, 'category' => 'Sisig', 'available' => true, 'description' => 'Extra spicy pork sisig - for spice lovers!'],
            ['name' => 'Sisig Overload', 'price' => 180, 'category' => 'Sisig', 'available' => true, 'description' => 'Loaded with all ingredients!'],

            // Category 2: Rice Meals
            ['name' => 'Pork Sisig Rice Meal', 'price' => 160, 'category' => 'Rice Meals', 'available' => true, 'description' => 'Pork sisig with steamed rice'],
            ['name' => 'Chicken Sisig Rice Meal', 'price' => 130, 'category' => 'Rice Meals', 'available' => true, 'description' => 'Chicken sisig with steamed rice'],
            ['name' => 'Beef Sisig Rice Meal', 'price' => 170, 'category' => 'Rice Meals', 'available' => true, 'description' => 'Beef sisig with steamed rice'],
            ['name' => 'Tuna Sisig Rice Meal', 'price' => 150, 'category' => 'Rice Meals', 'available' => true, 'description' => 'Tuna sisig with steamed rice'],

            // Category 3: Sides
            ['name' => 'Fries', 'price' => 60, 'category' => 'Sides', 'available' => true, 'description' => 'Crispy golden fries'],
            ['name' => 'Cheese Fries', 'price' => 80, 'category' => 'Sides', 'available' => true, 'description' => 'Fries topped with melted cheese'],
            ['name' => 'Lumpiang Shanghai', 'price' => 90, 'category' => 'Sides', 'available' => true, 'description' => 'Crispy spring rolls'],
            ['name' => 'Calamares', 'price' => 120, 'category' => 'Sides', 'available' => true, 'description' => 'Crispy squid rings'],
            ['name' => 'Onion Rings', 'price' => 75, 'category' => 'Sides', 'available' => true, 'description' => 'Golden crispy onion rings'],

            // Category 4: Drinks
            ['name' => 'Soft Drinks', 'price' => 35, 'category' => 'Drinks', 'available' => true, 'description' => 'Cold soft drinks'],
            ['name' => 'Iced Tea', 'price' => 40, 'category' => 'Drinks', 'available' => true, 'description' => 'Refreshing iced tea'],
            ['name' => 'Calamansi Juice', 'price' => 50, 'category' => 'Drinks', 'available' => true, 'description' => 'Fresh calamansi juice'],
            ['name' => 'Mango Juice', 'price' => 50, 'category' => 'Drinks', 'available' => true, 'description' => 'Fresh mango juice'],
            ['name' => 'Water', 'price' => 20, 'category' => 'Drinks', 'available' => true, 'description' => 'Bottled water'],

            // Category 5: Desserts
            ['name' => 'Halo-Halo', 'price' => 80, 'category' => 'Desserts', 'available' => true, 'description' => 'Refreshing mixed dessert with shaved ice'],
            ['name' => 'Leche Flan', 'price' => 70, 'category' => 'Desserts', 'available' => true, 'description' => 'Creamy egg custard dessert'],

            // Category 6: Add-Ons
            ['name' => 'Extra Rice', 'price' => 25, 'category' => 'Add-Ons', 'available' => true, 'description' => 'Extra steamed rice'],
            ['name' => 'Garlic Rice', 'price' => 45, 'category' => 'Add-Ons', 'available' => true, 'description' => 'Fragrant garlic-fried rice'],
        ];

        foreach ($items as $item) {
            Menu::create($item);
        }
    }
}

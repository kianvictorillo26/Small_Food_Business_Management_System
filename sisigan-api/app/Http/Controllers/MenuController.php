<?php

namespace App\Http\Controllers;

use App\Models\Menu;
use Illuminate\Http\Request;

class MenuController extends Controller
{
    /**
     * Get all menu items
     */
    public function index(Request $request)
    {
        $query = Menu::query();

        if ($request->has('category') && $request->category !== 'All') {
            $query->where('category', $request->category);
        }

        return response()->json($query->get());
    }

    /**
     * Get menu categories
     */
    public function categories()
    {
        $categories = Menu::select('category')
            ->distinct()
            ->pluck('category')
            ->prepend('All');

        return response()->json($categories);
    }

    /**
     * Create a new menu item
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'description' => 'nullable|string',
            'price' => 'required|numeric',
            'category' => 'required|string',
            'available' => 'boolean',
        ]);

        $menu = Menu::create($validated);

        return response()->json($menu, 201);
    }

    /**
     * Get a single menu item
     */
    public function show(Menu $menu)
    {
        return response()->json($menu);
    }

    /**
     * Update a menu item
     */
    public function update(Request $request, Menu $menu)
    {
        $validated = $request->validate([
            'name' => 'string',
            'description' => 'nullable|string',
            'price' => 'numeric',
            'category' => 'string',
            'available' => 'boolean',
        ]);

        $menu->update($validated);

        return response()->json($menu);
    }

    /**
     * Delete a menu item
     */
    public function destroy(Menu $menu)
    {
        $menu->delete();

        return response()->json(['message' => 'Menu item deleted']);
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Menu extends Model
{
    protected $table = 'menu_items';

    protected $fillable = [
        'name',
        'description',
        'price',
        'category',
        'available',
        'image_url',
    ];

    protected $casts = [
        'available' => 'boolean',
        'price' => 'decimal:2',
    ];

    public function orderItems()
    {
        return $this->hasMany(OrderItem::class);
    }
}

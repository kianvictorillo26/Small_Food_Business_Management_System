<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    protected $table = 'orders';

    protected $fillable = [
        'customer_name',
        'status',
        'total_amount',
        'notes',
    ];

    protected $casts = [
        'total_amount' => 'decimal:2',
    ];

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function scopeByStatus($query, $status)
    {
        if ($status !== 'All') {
            return $query->where('status', $status);
        }
        return $query;
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Inventory extends Model
{
    use HasFactory;

    protected $table = 'inventory';

    protected $fillable = [
        'name',
        'icon',
        'color',
        'quantity',
        'unit',
        'threshold',
        'status',
    ];

    protected $casts = [
        'quantity' => 'decimal:2',
        'threshold' => 'decimal:2',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get low stock items
     */
    public static function lowStock()
    {
        return self::whereRaw('quantity < threshold')->get();
    }

    /**
     * Update item quantity and status
     */
    public function updateQuantity($newQuantity)
    {
        $this->quantity = $newQuantity;
        $this->status = $newQuantity < $this->threshold ? 'low' : 'normal';
        $this->save();
        
        return $this;
    }
}

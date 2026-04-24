<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Formation extends Model
{
    use HasFactory;

    protected $fillable = [
        'titre',
        'description',
        'category',
        'date',
        'statut',
        'price',
        'duration',
        'level',
        'vues',
        'user_id',
        'formateur_nom',
        'apprenants_count',
    ];

    protected function casts(): array
    {
        return [
            'date'     => 'date',
            'price'    => 'decimal:2',
            'duration' => 'integer',
        ];
    }

    public function modules(): HasMany
    {
        return $this->hasMany(Module::class, 'formation_id')->orderBy('ordre');
    }
}

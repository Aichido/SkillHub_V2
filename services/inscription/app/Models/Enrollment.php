<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Enrollment extends Model
{
    use HasFactory;

    protected $table = 'enrollments';

    protected $fillable = [
        'utilisateur_id',
        'formation_id',
        'progression',
        'date_inscription',
    ];

    protected function casts(): array
    {
        return [
            'progression'      => 'integer',
            'date_inscription' => 'datetime',
        ];
    }
}

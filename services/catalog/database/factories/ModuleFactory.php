<?php

namespace Database\Factories;

use App\Models\Formation;
use Illuminate\Database\Eloquent\Factories\Factory;

class ModuleFactory extends Factory
{
    public function definition(): array
    {
        return [
            'titre'        => $this->faker->sentence(4),
            'contenu'      => $this->faker->paragraphs(2, true),
            'ordre'        => $this->faker->numberBetween(1, 10),
            'formation_id' => Formation::factory(),
        ];
    }
}

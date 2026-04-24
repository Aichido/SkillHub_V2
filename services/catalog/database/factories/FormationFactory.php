<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class FormationFactory extends Factory
{
    public function definition(): array
    {
        return [
            'titre'            => $this->faker->sentence(3),
            'description'      => $this->faker->paragraph(),
            'category'         => $this->faker->randomElement(['dev', 'design', 'marketing']),
            'date'             => $this->faker->dateTimeBetween('now', '+1 year')->format('Y-m-d'),
            'statut'           => 'À venir',
            'price'            => $this->faker->randomFloat(2, 0, 500),
            'duration'         => $this->faker->numberBetween(1, 40),
            'level'            => $this->faker->randomElement(['beginner', 'intermediaire', 'advanced']),
            'vues'             => 0,
            'user_id'          => 1,
            'formateur_nom'    => $this->faker->name(),
            'apprenants_count' => 0,
        ];
    }
}

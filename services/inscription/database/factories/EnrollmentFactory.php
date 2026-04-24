<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class EnrollmentFactory extends Factory
{
    public function definition(): array
    {
        return [
            'utilisateur_id'   => $this->faker->numberBetween(1, 100),
            'formation_id'     => $this->faker->numberBetween(1, 100),
            'progression'      => $this->faker->numberBetween(0, 100),
            'date_inscription' => now(),
        ];
    }
}

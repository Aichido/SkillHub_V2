<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Formation;

class FormationSeeder extends Seeder
{
    public function run(): void
    {
        Formation::create([
            'titre' => 'Développement Web avec Laravel',
            'description' => 'Apprenez à créer des applications web robustes avec Laravel.',
            'category' => 'Développement',
            'date' => now(),
            'statut' => 'Ouvert',
            'price' => 0,
            'duration' => 30,
            'level' => 'beginner',
            'vues' => 0,
            'user_id' => 1,
            'formateur_nom' => 'Formateur Test',
            'apprenants_count' => 0,
        ]);
        Formation::create([
            'titre' => 'React pour les débutants',
            'description' => 'Démarrez avec React et construisez des interfaces modernes.',
            'category' => 'Front-end',
            'date' => now(),
            'statut' => 'Ouvert',
            'price' => 0,
            'duration' => 20,
            'level' => 'beginner',
            'vues' => 0,
            'user_id' => 1,
            'formateur_nom' => 'Formateur Test',
            'apprenants_count' => 0,
        ]);
    }
}

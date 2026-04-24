<?php

/**
 * Fichier : EnrollmentController.php
 * Rôle    : Gère les inscriptions des apprenants aux formations (inscription, désinscription, liste).
 * Modifié : 2026-04-21
 */

namespace App\Http\Controllers;

use App\Models\Enrollment;
use App\Services\MongoActivityLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class EnrollmentController extends Controller
{
    public function __construct(private MongoActivityLogger $mongoLogger)
    {
    }

    public function store(Request $requete, int $idFormation): JsonResponse
    {
        $utilisateurAuth = $requete->input('auth_user');

        if (($utilisateurAuth['role'] ?? '') !== 'apprenant') {
            return response()->json(['message' => "Seuls les apprenants peuvent s'inscrire à une formation."], 403);
        }

        // La formation est vérifiée auprès du service Catalog avant toute inscription
        $urlCatalog     = config('services.catalog.url');
        $reponseApi     = Http::get("{$urlCatalog}/api/formations/{$idFormation}");

        if (! $reponseApi->ok()) {
            return response()->json(['message' => 'Formation introuvable.'], 404);
        }

        $inscription = Enrollment::query()->firstOrCreate([
            'utilisateur_id' => $utilisateurAuth['id'],
            'formation_id'   => $idFormation,
        ], [
            'progression'      => 0,
            'date_inscription' => now(),
        ]);

        $this->mongoLogger->log('course_enrollment', [
            'user_id'   => $utilisateurAuth['id'],
            'course_id' => $idFormation,
        ]);

        return response()->json([
            'id'               => $inscription->id,
            'utilisateur_id'   => $inscription->utilisateur_id,
            'formation_id'     => $inscription->formation_id,
            'progression'      => $inscription->progression,
            'date_inscription' => optional($inscription->date_inscription)->toIso8601String(),
        ], 201);
    }

    public function destroy(Request $requete, int $idFormation): JsonResponse
    {
        $utilisateurAuth = $requete->input('auth_user');

        if (($utilisateurAuth['role'] ?? '') !== 'apprenant') {
            return response()->json(['message' => 'Seuls les apprenants peuvent se désinscrire.'], 403);
        }

        Enrollment::query()
            ->where('utilisateur_id', $utilisateurAuth['id'])
            ->where('formation_id', $idFormation)
            ->delete();

        return response()->json(['message' => 'Désinscription effectuée.']);
    }

    public function myCourses(Request $requete): JsonResponse
    {
        $utilisateurAuth = $requete->input('auth_user');

        if (($utilisateurAuth['role'] ?? '') !== 'apprenant') {
            return response()->json(['message' => 'Seuls les apprenants peuvent accéder à cette ressource.'], 403);
        }

        $inscriptions = Enrollment::query()
            ->where('utilisateur_id', $utilisateurAuth['id'])
            ->orderByDesc('date_inscription')
            ->get();

        if ($inscriptions->isEmpty()) {
            return response()->json([]);
        }

        // Les détails de chaque formation sont récupérés individuellement depuis le service Catalog
        $urlCatalog   = config('services.catalog.url');
        $idsFormation = $inscriptions->pluck('formation_id')->unique()->values()->all();

        $formations = collect();
        foreach ($idsFormation as $id) {
            $reponseApi = Http::get("{$urlCatalog}/api/formations/{$id}");
            if ($reponseApi->ok()) {
                $formations->put($id, $reponseApi->json());
            }
        }

        $resultat = $inscriptions->map(function (Enrollment $inscription) use ($formations): array {
            $formation = $formations->get($inscription->formation_id, []);

            return [
                'id'               => $formation['id'] ?? $inscription->formation_id,
                'titre'            => $formation['titre'] ?? 'Formation introuvable',
                'description'      => $formation['description'] ?? '',
                'category'         => $formation['category'] ?? '',
                'date'             => $formation['date'] ?? null,
                'statut'           => $formation['statut'] ?? '',
                'price'            => $formation['price'] ?? 0,
                'duration'         => $formation['duration'] ?? 0,
                'level'            => $formation['level'] ?? '',
                'vues'             => $formation['vues'] ?? 0,
                'apprenants'       => $formation['apprenants'] ?? 0,
                'formateur'        => $formation['formateur'] ?? null,
                'modules'          => $formation['modules'] ?? [],
                'progression'      => $inscription->progression,
                'date_inscription' => optional($inscription->date_inscription)->toIso8601String(),
            ];
        });

        return response()->json($resultat->values());
    }
}

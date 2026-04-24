<?php

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

    public function store(Request $request, int $formationId): JsonResponse
    {
        $authUser = $request->get('auth_user');

        if (($authUser['role'] ?? '') !== 'apprenant') {
            return response()->json(['message' => 'Seuls les apprenants peuvent s\'inscrire à une formation.'], 403);
        }

        // Vérifier que la formation existe dans le service Catalog
        $catalogUrl      = config('services.catalog.url');
        $catalogResponse = Http::get("{$catalogUrl}/api/formations/{$formationId}");

        if (! $catalogResponse->ok()) {
            return response()->json(['message' => 'Formation introuvable.'], 404);
        }

        $inscription = Enrollment::query()->firstOrCreate([
            'utilisateur_id' => $authUser['id'],
            'formation_id'   => $formationId,
        ], [
            'progression'      => 0,
            'date_inscription' => now(),
        ]);

        $this->mongoLogger->log('course_enrollment', [
            'user_id'   => $authUser['id'],
            'course_id' => $formationId,
        ]);

        return response()->json([
            'id'              => $inscription->id,
            'utilisateur_id'  => $inscription->utilisateur_id,
            'formation_id'    => $inscription->formation_id,
            'progression'     => $inscription->progression,
            'date_inscription' => optional($inscription->date_inscription)->toIso8601String(),
        ], 201);
    }

    public function destroy(Request $request, int $formationId): JsonResponse
    {
        $authUser = $request->get('auth_user');

        if (($authUser['role'] ?? '') !== 'apprenant') {
            return response()->json(['message' => 'Seuls les apprenants peuvent se désinscrire.'], 403);
        }

        Enrollment::query()
            ->where('utilisateur_id', $authUser['id'])
            ->where('formation_id', $formationId)
            ->delete();

        return response()->json(['message' => 'Désinscription effectuée.']);
    }

    public function myCourses(Request $request): JsonResponse
    {
        $authUser = $request->get('auth_user');

        if (($authUser['role'] ?? '') !== 'apprenant') {
            return response()->json(['message' => 'Seuls les apprenants peuvent accéder à cette ressource.'], 403);
        }

        // Récupérer les inscriptions de l'utilisateur
        $inscriptions = Enrollment::query()
            ->where('utilisateur_id', $authUser['id'])
            ->orderByDesc('date_inscription')
            ->get();

        if ($inscriptions->isEmpty()) {
            return response()->json([]);
        }

        // Récupérer les détails des formations depuis le service Catalog
        $catalogUrl   = config('services.catalog.url');
        $formationIds = $inscriptions->pluck('formation_id')->unique()->values()->all();

        $formations = collect();
        foreach ($formationIds as $id) {
            $response = Http::get("{$catalogUrl}/api/formations/{$id}");
            if ($response->ok()) {
                $formations->put($id, $response->json());
            }
        }

        $result = $inscriptions->map(function (Enrollment $inscription) use ($formations): array {
            $formation = $formations->get($inscription->formation_id, []);

            return [
                'id'              => $formation['id'] ?? $inscription->formation_id,
                'titre'           => $formation['titre'] ?? 'Formation introuvable',
                'description'     => $formation['description'] ?? '',
                'category'        => $formation['category'] ?? '',
                'date'            => $formation['date'] ?? null,
                'statut'          => $formation['statut'] ?? '',
                'price'           => $formation['price'] ?? 0,
                'duration'        => $formation['duration'] ?? 0,
                'level'           => $formation['level'] ?? '',
                'vues'            => $formation['vues'] ?? 0,
                'apprenants'      => $formation['apprenants'] ?? 0,
                'formateur'       => $formation['formateur'] ?? null,
                'modules'         => $formation['modules'] ?? [],
                'progression'     => $inscription->progression,
                'date_inscription' => optional($inscription->date_inscription)->toIso8601String(),
            ];
        });

        return response()->json($result->values());
    }
}

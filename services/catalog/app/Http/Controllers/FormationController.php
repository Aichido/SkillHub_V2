<?php

namespace App\Http\Controllers;

use App\Models\Formation;
use App\Models\Module;
use App\Services\MongoActivityLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FormationController extends Controller
{
    public function __construct(private MongoActivityLogger $mongoLogger)
    {
    }

    public function index(Request $requete): JsonResponse
    {
        $authUser = $requete->get('auth_user'); // null si route publique

        $query = Formation::query()->with('modules');

        $recherche = trim((string) $requete->query('recherche', $requete->query('search', '')));
        $categorie = trim((string) $requete->query('category', ''));
        $niveau    = trim((string) $requete->query('level', ''));

        if ($recherche !== '') {
            $query->where(function ($q) use ($recherche): void {
                $q->where('titre', 'like', "%{$recherche}%")
                  ->orWhere('description', 'like', "%{$recherche}%");
            });
        }

        if ($categorie !== '') {
            $query->where('category', $categorie);
        }

        if ($niveau !== '') {
            $query->where('level', $niveau);
        }

        // Un formateur ne voit que ses formations
        if ($authUser && ($authUser['role'] ?? '') === 'formateur') {
            $query->where('user_id', $authUser['id']);
        }

        $inclureUserId = $authUser && ($authUser['role'] ?? '') === 'formateur';

        $formations = $query->orderByDesc('date')->get()
            ->map(fn (Formation $f) => $this->presenterFormation($f, $inclureUserId));

        return response()->json($formations);
    }

    public function myFormations(Request $requete): JsonResponse
    {
        $authUser = $requete->get('auth_user');

        if (($authUser['role'] ?? '') !== 'formateur') {
            return response()->json(['message' => 'Seuls les formateurs peuvent accéder à leurs formations.'], 403);
        }

        $formations = Formation::query()
            ->where('user_id', $authUser['id'])
            ->with('modules')
            ->orderByDesc('date')
            ->get()
            ->map(fn (Formation $f) => $this->presenterFormation($f, true));

        return response()->json($formations);
    }

    public function show(Formation $formation): JsonResponse
    {
        $formation->increment('vues');
        $formation->refresh();
        $formation->load(['modules' => fn ($q) => $q->orderBy('ordre')]);

        $this->mongoLogger->log('course_viewed', ['course_id' => $formation->id]);

        return response()->json([
            ...$this->presenterFormation($formation, false),
            'modules' => $formation->modules->map(fn ($m) => [
                'id'      => $m->id,
                'titre'   => $m->titre,
                'contenu' => $m->contenu,
                'ordre'   => $m->ordre,
            ])->values(),
        ]);
    }

    public function store(Request $requete): JsonResponse
    {
        $authUser = $requete->get('auth_user');

        if (($authUser['role'] ?? '') !== 'formateur') {
            return response()->json(['message' => 'Seuls les formateurs peuvent créer une formation.'], 403);
        }

        $donneesValidees = $requete->validate([
            'titre'              => ['required', 'string', 'max:255'],
            'description'        => ['required', 'string'],
            'category'           => ['required', 'string', 'max:100'],
            'date'               => ['required', 'date'],
            'statut'             => ['nullable', 'string', 'max:60'],
            'price'              => ['required', 'numeric', 'min:0'],
            'duration'           => ['required', 'integer', 'min:1'],
            'level'              => ['required', 'in:beginner,intermediaire,advanced'],
            'modules'            => ['nullable', 'array', 'min:3'],
            'modules.*.titre'    => ['required_with:modules', 'string', 'max:255'],
            'modules.*.contenu'  => ['required_with:modules', 'string'],
        ]);

        $formation = Formation::query()->create([
            'titre'         => $donneesValidees['titre'],
            'description'   => $donneesValidees['description'],
            'category'      => $donneesValidees['category'],
            'date'          => $donneesValidees['date'],
            'statut'        => $donneesValidees['statut'] ?? 'À venir',
            'price'         => $donneesValidees['price'],
            'duration'      => $donneesValidees['duration'],
            'level'         => $donneesValidees['level'],
            'vues'          => 0,
            'user_id'       => $authUser['id'],
            'formateur_nom' => $authUser['nom'],
            'apprenants_count' => 0,
        ]);

        $this->mongoLogger->log('course_created', [
            'course_id'  => $formation->id,
            'created_by' => $authUser['id'],
        ]);

        $this->remplacerModules($formation, $donneesValidees['modules'] ?? $this->modulesParDefaut());

        return response()->json($this->presenterFormation($formation, true), 201);
    }

    public function update(Request $requete, Formation $formation): JsonResponse
    {
        $authUser = $requete->get('auth_user');

        if (($authUser['role'] ?? '') !== 'formateur') {
            return response()->json(['message' => 'Seuls les formateurs peuvent modifier une formation.'], 403);
        }

        if ($formation->user_id !== $authUser['id']) {
            return response()->json(['message' => 'Cette formation ne vous appartient pas.'], 403);
        }

        $donneesValidees = $requete->validate([
            'titre'             => ['required', 'string', 'max:255'],
            'description'       => ['required', 'string'],
            'category'          => ['required', 'string', 'max:100'],
            'date'              => ['required', 'date'],
            'statut'            => ['nullable', 'string', 'max:60'],
            'price'             => ['nullable', 'numeric', 'min:0'],
            'duration'          => ['nullable', 'integer', 'min:1'],
            'level'             => ['nullable', 'in:beginner,intermediaire,advanced'],
            'modules'           => ['nullable', 'array', 'min:3'],
            'modules.*.titre'   => ['required_with:modules', 'string', 'max:255'],
            'modules.*.contenu' => ['required_with:modules', 'string'],
        ]);

        $formation->update([
            'titre'       => $donneesValidees['titre'],
            'description' => $donneesValidees['description'],
            'category'    => $donneesValidees['category'],
            'date'        => $donneesValidees['date'],
            'statut'      => $donneesValidees['statut'] ?? $formation->statut,
            'price'       => $donneesValidees['price'] ?? $formation->price,
            'duration'    => $donneesValidees['duration'] ?? $formation->duration,
            'level'       => $donneesValidees['level'] ?? $formation->level,
        ]);

        $this->mongoLogger->log('course_update', [
            'course_id'  => $formation->id,
            'updated_by' => $authUser['id'],
        ]);

        if (array_key_exists('modules', $donneesValidees)) {
            $this->remplacerModules($formation, $donneesValidees['modules']);
        }

        return response()->json($this->presenterFormation($formation, true));
    }

    public function destroy(Request $requete, Formation $formation): JsonResponse
    {
        $authUser = $requete->get('auth_user');

        if (($authUser['role'] ?? '') !== 'formateur') {
            return response()->json(['message' => 'Seuls les formateurs peuvent supprimer une formation.'], 403);
        }

        if ($formation->user_id !== $authUser['id']) {
            return response()->json(['message' => 'Cette formation ne vous appartient pas.'], 403);
        }

        $formationId = $formation->id;
        $formation->delete();

        $this->mongoLogger->log('course_deleted', [
            'course_id'  => $formationId,
            'deleted_by' => $authUser['id'],
        ]);

        return response()->json(['message' => 'Formation supprimée avec succès.']);
    }

    private function presenterFormation(Formation $formation, bool $inclureUserId): array
    {
        $donnees = [
            'id'          => $formation->id,
            'titre'       => $formation->titre,
            'description' => $formation->description,
            'category'    => $formation->category,
            'date'        => optional($formation->date)->format('Y-m-d'),
            'statut'      => $formation->statut,
            'price'       => (float) $formation->price,
            'duration'    => $formation->duration,
            'level'       => $formation->level,
            'vues'        => $formation->vues,
            'apprenants'  => $formation->apprenants_count ?? 0,
            'formateur'   => $formation->formateur_nom,
        ];

        if ($inclureUserId) {
            $donnees['user_id'] = $formation->user_id;
        }

        return $donnees;
    }

    private function remplacerModules(Formation $formation, array $modules): void
    {
        $formation->modules()->delete();

        foreach (array_values($modules) as $index => $module) {
            Module::query()->create([
                'titre'        => $module['titre'],
                'contenu'      => $module['contenu'],
                'ordre'        => $index + 1,
                'formation_id' => $formation->id,
            ]);
        }
    }

    private function modulesParDefaut(): array
    {
        return [
            ['titre' => 'Introduction',          'contenu' => 'Présentation générale de la formation.'],
            ['titre' => 'Concepts fondamentaux', 'contenu' => 'Notions essentielles à maîtriser.'],
            ['titre' => 'Projet pratique',       'contenu' => 'Application concrète des acquis.'],
        ];
    }
}

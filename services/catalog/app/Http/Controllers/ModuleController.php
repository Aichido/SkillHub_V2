<?php

namespace App\Http\Controllers;

use App\Models\Formation;
use App\Models\Module;
use App\Services\MongoActivityLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ModuleController extends Controller
{
    public function __construct(private MongoActivityLogger $mongoLogger)
    {
    }

    public function index(Formation $formation): JsonResponse
    {
        $modules = $formation->modules()->get()->map(fn (Module $m) => $this->presenterModule($m));

        return response()->json($modules);
    }

    public function store(Request $requete, Formation $formation): JsonResponse
    {
        $authUser = $requete->get('auth_user');

        if (($authUser['role'] ?? '') !== 'formateur') {
            return response()->json(['message' => 'Seuls les formateurs peuvent gérer les modules.'], 403);
        }

        if ($formation->user_id !== $authUser['id']) {
            return response()->json(['message' => 'Cette formation ne vous appartient pas.'], 403);
        }

        $donneesValidees = $requete->validate([
            'titre'   => ['required', 'string', 'max:255'],
            'contenu' => ['required', 'string'],
            'ordre'   => ['nullable', 'integer', 'min:1'],
        ]);

        $ordre = $donneesValidees['ordre'] ?? ((int) $formation->modules()->max('ordre') + 1);

        $module = Module::query()->create([
            'titre'        => $donneesValidees['titre'],
            'contenu'      => $donneesValidees['contenu'],
            'ordre'        => $ordre,
            'formation_id' => $formation->id,
        ]);

        $this->mongoLogger->log('module_created', [
            'formation_id' => $formation->id,
            'module_id'    => $module->id,
            'created_by'   => $authUser['id'],
        ]);

        return response()->json($this->presenterModule($module), 201);
    }

    public function update(Request $requete, Module $module): JsonResponse
    {
        $authUser = $requete->get('auth_user');
        $formation = $module->formation;

        if (($authUser['role'] ?? '') !== 'formateur') {
            return response()->json(['message' => 'Seuls les formateurs peuvent gérer les modules.'], 403);
        }

        if (! $formation || $formation->user_id !== $authUser['id']) {
            return response()->json(['message' => 'Ce module ne vous appartient pas.'], 403);
        }

        $donneesValidees = $requete->validate([
            'titre'   => ['required', 'string', 'max:255'],
            'contenu' => ['required', 'string'],
            'ordre'   => ['required', 'integer', 'min:1'],
        ]);

        $module->update($donneesValidees);

        $this->mongoLogger->log('module_updated', [
            'formation_id' => $formation->id,
            'module_id'    => $module->id,
            'updated_by'   => $authUser['id'],
        ]);

        return response()->json($this->presenterModule($module));
    }

    public function destroy(Request $requete, Module $module): JsonResponse
    {
        $authUser  = $requete->get('auth_user');
        $formation = $module->formation;

        if (($authUser['role'] ?? '') !== 'formateur') {
            return response()->json(['message' => 'Seuls les formateurs peuvent gérer les modules.'], 403);
        }

        if (! $formation || $formation->user_id !== $authUser['id']) {
            return response()->json(['message' => 'Ce module ne vous appartient pas.'], 403);
        }

        $moduleId    = $module->id;
        $formationId = $formation->id;
        $module->delete();

        $this->mongoLogger->log('module_deleted', [
            'formation_id' => $formationId,
            'module_id'    => $moduleId,
            'deleted_by'   => $authUser['id'],
        ]);

        return response()->json(['message' => 'Module supprimé.']);
    }

    private function presenterModule(Module $module): array
    {
        return [
            'id'           => $module->id,
            'titre'        => $module->titre,
            'contenu'      => $module->contenu,
            'ordre'        => $module->ordre,
            'formation_id' => $module->formation_id,
        ];
    }
}

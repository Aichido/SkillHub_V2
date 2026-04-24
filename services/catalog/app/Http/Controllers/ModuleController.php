<?php

/**
 * Fichier : ModuleController.php
 * Rôle    : Gère les modules d'une formation (ajout, modification, suppression) réservés au formateur propriétaire.
 * Modifié : 2026-04-21
 */

namespace App\Http\Controllers;

use App\Models\Formation;
use App\Models\Module;
use App\Services\MongoActivityLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ModuleController extends Controller
{
    private const ROLE_FORMATEUR    = 'formateur';
    private const MSG_FORMATEUR_REQ = 'Seuls les formateurs peuvent gérer les modules.';

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
        $utilisateurAuth = $requete->input('auth_user');

        if (($utilisateurAuth['role'] ?? '') !== self::ROLE_FORMATEUR) {
            return response()->json(['message' => self::MSG_FORMATEUR_REQ], 403);
        }

        if ($formation->user_id !== $utilisateurAuth['id']) {
            return response()->json(['message' => 'Cette formation ne vous appartient pas.'], 403);
        }

        $donneesValidees = $requete->validate([
            'titre'   => ['required', 'string', 'max:255'],
            'contenu' => ['required', 'string'],
            'ordre'   => ['nullable', 'integer', 'min:1'],
        ]);

        // Si aucun ordre n'est fourni, le module est placé après le dernier existant
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
            'created_by'   => $utilisateurAuth['id'],
        ]);

        return response()->json($this->presenterModule($module), 201);
    }

    public function update(Request $requete, Module $module): JsonResponse
    {
        $utilisateurAuth = $requete->input('auth_user');
        $formation       = $module->formation;

        if (($utilisateurAuth['role'] ?? '') !== self::ROLE_FORMATEUR) {
            return response()->json(['message' => self::MSG_FORMATEUR_REQ], 403);
        }

        if (! $formation || $formation->user_id !== $utilisateurAuth['id']) {
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
            'updated_by'   => $utilisateurAuth['id'],
        ]);

        return response()->json($this->presenterModule($module));
    }

    public function destroy(Request $requete, Module $module): JsonResponse
    {
        $utilisateurAuth = $requete->input('auth_user');
        $formation       = $module->formation;

        if (($utilisateurAuth['role'] ?? '') !== self::ROLE_FORMATEUR) {
            return response()->json(['message' => self::MSG_FORMATEUR_REQ], 403);
        }

        if (! $formation || $formation->user_id !== $utilisateurAuth['id']) {
            return response()->json(['message' => 'Ce module ne vous appartient pas.'], 403);
        }

        $idModule    = $module->id;
        $idFormation = $formation->id;
        $module->delete();

        $this->mongoLogger->log('module_deleted', [
            'formation_id' => $idFormation,
            'module_id'    => $idModule,
            'deleted_by'   => $utilisateurAuth['id'],
        ]);

        return response()->json(['message' => 'Module supprimé.']);
    }

    /**
     * Formate un module en tableau simple pour les réponses JSON de l'API.
     */
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

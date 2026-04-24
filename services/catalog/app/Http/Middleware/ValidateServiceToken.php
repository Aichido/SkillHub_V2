<?php

/**
 * Fichier : ValidateServiceToken.php
 * Rôle    : Middleware qui valide le jeton Bearer auprès du service Auth avant d'autoriser la requête.
 * Modifié : 2026-04-21
 */

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Symfony\Component\HttpFoundation\Response;

class ValidateServiceToken
{
    public function handle(Request $requete, Closure $suivant): Response
    {
        $jeton = $requete->bearerToken();

        if (! $jeton) {
            return response()->json(['message' => 'Jeton manquant.'], 401);
        }

        $urlAuth = config('services.auth.url');

        // Le jeton est transmis au service Auth qui vérifie sa validité et retourne l'utilisateur
        $reponseAuth = Http::withToken($jeton)->post("{$urlAuth}/api/validate-token");

        if (! $reponseAuth->ok() || ! $reponseAuth->json('valid')) {
            return response()->json(['message' => 'Non autorisé.'], 401);
        }

        // L'utilisateur validé est injecté dans la requête pour les contrôleurs en aval
        $requete->merge(['auth_user' => $reponseAuth->json('user')]);

        return $suivant($requete);
    }
}

<?php

/**
 * Fichier : VerifierJetonJwt.php
 * Rôle    : Middleware qui vérifie le jeton JWT sur chaque requête protégée du service Auth.
 * Modifié : 2026-04-21
 */

namespace App\Http\Middleware;

use App\Models\User;
use App\Services\ServiceJwt;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

class VerifierJetonJwt
{
    public function __construct(private ServiceJwt $serviceJwt)
    {
    }

    public function handle(Request $requete, Closure $suivant): Response
    {
        $jeton = $requete->bearerToken();

        if (! $jeton) {
            return response()->json(['message' => 'Jeton manquant.'], 401);
        }

        // Un jeton blacklisté est rejeté même s'il n'est pas encore expiré
        if (Cache::has($this->cleBlacklist($jeton))) {
            return response()->json(['message' => 'Jeton invalide ou expiré.'], 403);
        }

        try {
            $donneesJwt    = $this->serviceJwt->decoder($jeton);
            $idUtilisateur = (int) ($donneesJwt['sub'] ?? 0);
            $utilisateur   = User::query()->find($idUtilisateur);

            if (! $utilisateur) {
                return response()->json(['message' => 'Utilisateur introuvable.'], 401);
            }

            // L'utilisateur est injecté dans la requête pour être accessible dans les contrôleurs
            $requete->setUserResolver(fn () => $utilisateur);

            return $suivant($requete);
        } catch (Throwable) {
            return response()->json(['message' => 'Jeton invalide ou expiré.'], 403);
        }
    }

    private function cleBlacklist(string $jeton): string
    {
        return 'jwt_blacklist:' . hash('sha256', $jeton);
    }
}

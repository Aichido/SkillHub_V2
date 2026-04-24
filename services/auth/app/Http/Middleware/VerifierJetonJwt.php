<?php

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

        if (Cache::has($this->cleBlacklist($jeton))) {
            return response()->json(['message' => 'Jeton invalide ou expiré.'], 403);
        }

        try {
            $payload      = $this->serviceJwt->decoder($jeton);
            $idUtilisateur = (int) ($payload['sub'] ?? 0);

            $utilisateur = User::query()->find($idUtilisateur);

            if (! $utilisateur) {
                return response()->json(['message' => 'Utilisateur introuvable.'], 401);
            }

            $requete->setUserResolver(fn () => $utilisateur);

            return $suivant($requete);
        } catch (Throwable) {
            return response()->json(['message' => 'Jeton invalide ou expiré.'], 403);
        }
    }

    private function cleBlacklist(string $jeton): string
    {
        return 'jwt_blacklist:'.hash('sha256', $jeton);
    }
}

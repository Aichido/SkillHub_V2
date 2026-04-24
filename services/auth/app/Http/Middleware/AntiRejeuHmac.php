<?php

/**
 * Fichier : AntiRejeuHmac.php
 * Rôle    : Middleware qui bloque les attaques par rejeu grâce à HMAC, nonce et horodatage.
 * Modifié : 2026-04-21
 */

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class AntiRejeuHmac
{
    private const LIMITE_SECONDES = 300;

    public function handle(Request $requete, Closure $suivant): mixed
    {
        $signature    = $requete->header('X-HMAC-Signature');
        $nonce        = $requete->header('X-Nonce');
        $horodatage   = $requete->header('X-Timestamp');

        if (! $signature || ! $nonce || ! $horodatage) {
            return response()->json(['message' => 'Paramètres de sécurité manquants.'], 403);
        }

        // La requête est rejetée si elle date de plus de 5 minutes
        if (\abs(time() - (int) $horodatage) > self::LIMITE_SECONDES) {
            return response()->json(['message' => 'Requête expirée.'], 403);
        }

        // Un nonce déjà utilisé signale une tentative de rejeu
        $cleCacheNonce = 'nonce_' . $nonce;
        if (Cache::has($cleCacheNonce)) {
            return response()->json(['message' => 'Tentative de rejeu détectée.'], 403);
        }

        $contenuAVerifier  = $requete->getContent() . $nonce . $horodatage;
        $signatureAttendue = hash_hmac('sha256', $contenuAVerifier, env('APP_MASTER_KEY', 'CleDeTestSecrete123!'));

        if (! hash_equals($signatureAttendue, $signature)) {
            return response()->json(['message' => 'Signature invalide.'], 403);
        }

        Cache::put($cleCacheNonce, true, self::LIMITE_SECONDES);

        return $suivant($requete);
    }
}

<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class AntiRejeuHmac
{
    public function handle(Request $requete, Closure $next)
    {
        $signature = $requete->header('X-HMAC-Signature');
        $nonce = $requete->header('X-Nonce');
        $timestamp = $requete->header('X-Timestamp');

        // 1. Vérifier que les en-têtes sont présents
        if (!$signature || !$nonce || !$timestamp) {
            return response()->json(['message' => 'Paramètres de sécurité manquants.'], 403);
        }

        // 2. Vérifier l'expiration du Timestamp (ex: rejeté si vieux de plus de 5 minutes)
        $limiteTemps = 300; // 5 minutes en secondes
        if (abs(time() - $timestamp) > $limiteTemps) {
            return response()->json(['message' => 'Requête expirée.'], 403);
        }

        // 3. Vérifier le Nonce (s'il a déjà été utilisé, on bloque)
        $cleCacheNonce = 'nonce_' . $nonce;
        if (Cache::has($cleCacheNonce)) {
            return response()->json(['message' => 'Tentative de rejeu détectée.'], 403);
        }

        // 4. Vérifier la signature HMAC
        $payload = $requete->getContent() . $nonce . $timestamp;
        $signatureAttendue = hash_hmac('sha256', $payload, env('APP_MASTER_KEY', 'CleDeTestSecrete123!'));

        if (!hash_equals($signatureAttendue, $signature)) {
            return response()->json(['message' => 'Signature invalide.'], 403);
        }

        // 5. Enregistrer le Nonce pour qu'il ne puisse plus être utilisé
        Cache::put($cleCacheNonce, true, $limiteTemps);

        return $next($requete);
    }
}
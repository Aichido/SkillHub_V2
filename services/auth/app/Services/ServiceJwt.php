<?php

/**
 * Fichier : ServiceJwt.php
 * Rôle    : Génère et vérifie les jetons JWT signés en HMAC-SHA256.
 * Modifié : 2026-04-21
 */

namespace App\Services;

use Carbon\CarbonImmutable;
use RuntimeException;

class ServiceJwt
{
    private string $cleSecrete;

    public function __construct()
    {
        $this->cleSecrete = (string) config('app.key');

        if ($this->cleSecrete === '') {
            throw new RuntimeException('La clé d\'application est absente');
        }
    }

    /**
     * Génère un jeton JWT signé à partir des données fournies en payload.
     * Le jeton contient trois segments base64url séparés par des points.
     */
    public function generer(array $donnees): string
    {
        $enTete = ['alg' => 'HS256', 'typ' => 'JWT'];

        $segments = [
            $this->encoderSegment($enTete),
            $this->encoderSegment($donnees),
        ];

        $signature  = hash_hmac('sha256', implode('.', $segments), $this->cleSecrete, true);
        $segments[] = $this->encoderBase64Url($signature);

        return implode('.', $segments);
    }

    /**
     * Décode un jeton JWT et retourne son payload après vérification de la signature et de l'expiration.
     * Lève une RuntimeException si le jeton est invalide, falsifié ou expiré.
     */
    public function decoder(string $jeton): array
    {
        $segments = explode('.', $jeton);

        if (\count($segments) !== 3) {
            throw new RuntimeException('Jeton JWT invalide.');
        }

        [$enTeteEncode, $donneesEncodees, $signatureEncodee] = $segments;

        // La signature reçue doit correspondre exactement à celle recalculée avec la clé secrète
        $signatureAttendue = hash_hmac('sha256', $enTeteEncode . '.' . $donneesEncodees, $this->cleSecrete, true);
        $signatureRecue    = $this->decoderBase64Url($signatureEncodee);

        if (! hash_equals($signatureAttendue, $signatureRecue)) {
            throw new RuntimeException('Signature JWT invalide.');
        }

        $donneesDecode = json_decode($this->decoderBase64UrlVersTexte($donneesEncodees), true);

        if (! \is_array($donneesDecode)) {
            throw new RuntimeException('Payload JWT invalide.');
        }

        if (isset($donneesDecode['exp']) && CarbonImmutable::now()->timestamp >= (int) $donneesDecode['exp']) {
            throw new RuntimeException('Jeton JWT expiré.');
        }

        return $donneesDecode;
    }

    private function encoderSegment(array $donnees): string
    {
        $json = json_encode($donnees, JSON_THROW_ON_ERROR);

        return $this->encoderBase64Url($json);
    }

    private function encoderBase64Url(string $texte): string
    {
        return rtrim(strtr(base64_encode($texte), '+/', '-_'), '=');
    }

    private function decoderBase64Url(string $segment): string
    {
        $base64 = strtr($segment, '-_', '+/');
        $reste  = strlen($base64) % 4;

        if ($reste > 0) {
            $base64 .= str_repeat('=', 4 - $reste);
        }

        $valeur = base64_decode($base64, true);

        if ($valeur === false) {
            throw new RuntimeException('Décodage base64 impossible.');
        }

        return $valeur;
    }

    private function decoderBase64UrlVersTexte(string $segment): string
    {
        return $this->decoderBase64Url($segment);
    }
}

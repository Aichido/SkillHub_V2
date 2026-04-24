<?php

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

    public function generer(array $payload): string
    {
        $enTete = [
            'alg' => 'HS256',
            'typ' => 'JWT',
        ];

        $segments = [
            $this->encoderSegment($enTete),
            $this->encoderSegment($payload),
        ];

        $signature = hash_hmac('sha256', implode('.', $segments), $this->cleSecrete, true);
        $segments[] = $this->encoderBase64Url($signature);

        return implode('.', $segments);
    }

    public function decoder(string $jeton): array
    {
        $segments = explode('.', $jeton);

        if (count($segments) !== 3) {
            throw new RuntimeException('Jeton JWT invalide.');
        }

        [$enTeteEncode, $payloadEncode, $signatureEncodee] = $segments;

        $signatureAttendue = hash_hmac('sha256', $enTeteEncode.'.'.$payloadEncode, $this->cleSecrete, true);
        $signatureRecue    = $this->decoderBase64Url($signatureEncodee);

        if (! hash_equals($signatureAttendue, $signatureRecue)) {
            throw new RuntimeException('Signature JWT invalide.');
        }

        $payloadDecode = json_decode($this->decoderBase64UrlVersTexte($payloadEncode), true);

        if (! is_array($payloadDecode)) {
            throw new RuntimeException('Payload JWT invalide.');
        }

        if (isset($payloadDecode['exp']) && CarbonImmutable::now()->timestamp >= (int) $payloadDecode['exp']) {
            throw new RuntimeException('Jeton JWT expiré.');
        }

        return $payloadDecode;
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

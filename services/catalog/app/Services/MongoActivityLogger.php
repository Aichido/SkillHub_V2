<?php

/**
 * Fichier : MongoActivityLogger.php
 * Rôle    : Enregistre les événements métier dans MongoDB pour traçabilité et audit.
 * Modifié : 2026-04-21
 */

namespace App\Services;

use Carbon\CarbonImmutable;
use Throwable;

class MongoActivityLogger
{
    /**
     * Insère un document de log dans la collection MongoDB configurée.
     * Si MongoDB est indisponible ou l'URI absente, le log est silencieusement ignoré.
     */
    public function log(string $evenement, array $donnees = []): void
    {
        if (! \class_exists(\MongoDB\Client::class)) {
            return;
        }

        $uri        = (string) env('MONGODB_URI', '');
        $baseDonnee = (string) env('MONGODB_DATABASE', 'skillhub');
        $collection = (string) env('MONGODB_COLLECTION', 'activity_logs');

        if ($uri === '') {
            return;
        }

        try {
            $client = new \MongoDB\Client($uri);

            // Chaque log inclut automatiquement un horodatage ISO 8601 pour faciliter les tris
            $client->selectDatabase($baseDonnee)
                ->selectCollection($collection)
                ->insertOne([
                    'event'     => $evenement,
                    ...$donnees,
                    'timestamp' => CarbonImmutable::now()->toIso8601String(),
                ]);
        } catch (Throwable $e) {
            error_log('[MongoActivityLogger] ' . $e->getMessage());
        }
    }
}

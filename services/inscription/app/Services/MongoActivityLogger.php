<?php

namespace App\Services;

use Carbon\CarbonImmutable;
use Throwable;

class MongoActivityLogger
{
    public function log(string $event, array $payload = []): void
    {
        if (! class_exists(\MongoDB\Client::class)) {
            return;
        }

        $uri = (string) env('MONGODB_URI', '');
        $database = (string) env('MONGODB_DATABASE', 'skillhub');
        $collection = (string) env('MONGODB_COLLECTION', 'activity_logs');

        if ($uri === '') {
            return;
        }

        try {
            $client = new \MongoDB\Client($uri);
            $client
                ->selectDatabase($database)
                ->selectCollection($collection)
                ->insertOne([
                    'event' => $event,
                    ...$payload,
                    'timestamp' => CarbonImmutable::now()->toIso8601String(),
                ]);
        } catch (Throwable) {
        }
    }
}

<?php

namespace Tests\Unit;

use App\Services\MongoActivityLogger;
use PHPUnit\Framework\TestCase;

class MongoActivityLoggerTest extends TestCase
{
    public function test_log_returns_early_when_no_uri(): void
    {
        putenv('MONGODB_URI=');
        $_ENV['MONGODB_URI'] = '';

        $logger = new MongoActivityLogger();
        $logger->log('test_event', ['user_id' => 1]);

        $this->assertTrue(true);
    }

    public function test_log_catches_exception_on_invalid_uri(): void
    {
        if (! class_exists(\MongoDB\Client::class)) {
            $this->markTestSkipped('Extension MongoDB non disponible.');
        }

        putenv('MONGODB_URI=mongodb://invalid-host-xyz:27017');
        $_ENV['MONGODB_URI'] = 'mongodb://invalid-host-xyz:27017';
        putenv('MONGODB_DATABASE=skillhub_test');
        putenv('MONGODB_COLLECTION=activity_logs_test');

        $logger = new MongoActivityLogger();

        try {
            $logger->log('test_event', ['user_id' => 1]);
            $this->assertTrue(true);
        } finally {
            putenv('MONGODB_URI=');
            $_ENV['MONGODB_URI'] = '';
        }
    }
}

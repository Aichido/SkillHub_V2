<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Symfony\Component\HttpFoundation\Response;

class ValidateServiceToken
{
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->bearerToken();

        if (! $token) {
            return response()->json(['message' => 'Jeton manquant.'], 401);
        }

        $authUrl  = config('services.auth.url');

        $response = Http::withToken($token)
            ->post("{$authUrl}/api/validate-token");

        if (! $response->ok() || ! $response->json('valid')) {
            return response()->json(['message' => 'Non autorisé.'], 401);
        }

        $request->merge(['auth_user' => $response->json('user')]);

        return $next($request);
    }
}

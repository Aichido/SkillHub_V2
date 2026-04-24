<?php

use App\Http\Controllers\ActivityLogController;
use App\Http\Controllers\FormationController;
use App\Http\Controllers\ModuleController;
use Illuminate\Support\Facades\Route;

// Routes publiques
Route::get('/formations',                   [FormationController::class, 'index']);
Route::get('/formations/{formation}',       [FormationController::class, 'show']);
Route::get('/formations/{formation}/modules', [ModuleController::class, 'index']);
Route::get('/formations/{formationId}/logs', [ActivityLogController::class, 'getByFormation']);

// Routes privées — token validé via le service Auth
Route::middleware('auth.service')->group(function (): void {
    Route::get('/my-formations',               [FormationController::class, 'myFormations']);
    Route::post('/formations',                 [FormationController::class, 'store']);
    Route::put('/formations/{formation}',      [FormationController::class, 'update']);
    Route::delete('/formations/{formation}',   [FormationController::class, 'destroy']);

    Route::post('/formations/{formation}/modules', [ModuleController::class, 'store']);
    Route::put('/modules/{module}',            [ModuleController::class, 'update']);
    Route::delete('/modules/{module}',         [ModuleController::class, 'destroy']);
});

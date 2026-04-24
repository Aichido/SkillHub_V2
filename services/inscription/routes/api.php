<?php

use App\Http\Controllers\EnrollmentController;
use Illuminate\Support\Facades\Route;

// Toutes les routes sont privées — inscription requiert un token valide
Route::middleware('auth.service')->group(function (): void {
    Route::post('/formations/{formationId}/inscription',    [EnrollmentController::class, 'store']);
    Route::delete('/formations/{formationId}/inscription',  [EnrollmentController::class, 'destroy']);
    Route::get('/apprenant/formations',                     [EnrollmentController::class, 'myCourses']);
});

<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CandidatController;
use App\Http\Controllers\CandidatureController;
use App\Http\Controllers\CompetenceController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\EntrepriseController;
use App\Http\Controllers\OffreController;
use Illuminate\Support\Facades\Route;

// ----- Routes publiques (Visiteur) -----
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::get('/offres', [OffreController::class, 'index']);
Route::get('/offres/{offre}', [OffreController::class, 'show']);
Route::get('/competences', [CompetenceController::class, 'index']);

// ----- Routes protégées (Sanctum) -----
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    Route::middleware('role:candidat')->prefix('candidat')->group(function () {
        Route::get('/profil', [CandidatController::class, 'show']);
        Route::put('/profil', [CandidatController::class, 'update']);
        Route::post('/cv', [CandidatController::class, 'deposerCv']);
        Route::post('/candidatures', [CandidatureController::class, 'store']);
        Route::get('/candidatures', [CandidatureController::class, 'mesCandidatures']);
    });

    Route::middleware('role:entreprise')->prefix('entreprise')->group(function () {
        Route::get('/profil', [EntrepriseController::class, 'show']);
        Route::put('/profil', [EntrepriseController::class, 'update']);
        Route::get('/offres', [OffreController::class, 'mesOffres']);
        Route::post('/offres', [OffreController::class, 'store']);
        Route::put('/offres/{offre}', [OffreController::class, 'update']);
        Route::patch('/offres/{offre}/cloturer', [OffreController::class, 'cloturer']);
        Route::delete('/offres/{offre}', [OffreController::class, 'destroy']);
        Route::get('/offres/{offre}/candidatures', [CandidatureController::class, 'recues']);
        Route::patch('/candidatures/{candidature}/statut', [CandidatureController::class, 'changerStatut']);
        Route::get('/tableau-de-bord', [DashboardController::class, 'index']);
    });

    Route::middleware('role:admin')->prefix('admin')->group(function () {
        Route::get('/utilisateurs', [AdminController::class, 'utilisateurs']);
        Route::put('/utilisateurs/{user}', [AdminController::class, 'modifierUtilisateur']);
        Route::delete('/utilisateurs/{user}', [AdminController::class, 'supprimerUtilisateur']);
        Route::get('/offres', [AdminController::class, 'offres']);
        Route::patch('/offres/{offre}/cloturer', [AdminController::class, 'cloturerOffre']);
        Route::delete('/offres/{offre}', [AdminController::class, 'supprimerOffre']);
        Route::get('/statistiques', [AdminController::class, 'statistiques']);
        Route::post('/competences', [CompetenceController::class, 'store']);
    });
});

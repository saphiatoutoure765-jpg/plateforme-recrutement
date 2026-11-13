<?php

namespace App\Http\Controllers;

use App\Models\Candidature;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $entreprise = $request->user()->entreprise;
        $offresIds = $entreprise->offres()->pluck('id');

        $candidatures = Candidature::whereIn('offre_id', $offresIds);

        return response()->json([
            'nombre_offres' => $offresIds->count(),
            'nombre_candidatures' => (clone $candidatures)->count(),
            'score_moyen' => round((float) (clone $candidatures)->avg('score_compatibilite'), 2),
            'offres_les_plus_demandees' => $entreprise->offres()
                ->withCount('candidatures')
                ->orderByDesc('candidatures_count')
                ->take(5)
                ->get(),
        ]);
    }
}

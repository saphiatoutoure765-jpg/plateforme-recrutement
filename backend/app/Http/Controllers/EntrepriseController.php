<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EntrepriseController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        return response()->json($request->user()->entreprise);
    }

    public function update(Request $request): JsonResponse
    {
        $donnees = $request->validate([
            'nom_entreprise' => 'sometimes|required|string|max:150',
            'secteur' => 'nullable|string|max:100',
            'description' => 'nullable|string',
        ]);

        $entreprise = $request->user()->entreprise;
        $entreprise->update($donnees);

        return response()->json($entreprise);
    }
}

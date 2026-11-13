<?php

namespace App\Http\Controllers;

use App\Models\Competence;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CompetenceController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(Competence::orderBy('nom_competence')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $donnees = $request->validate([
            'nom_competence' => 'required|string|max:100|unique:competences,nom_competence',
        ]);

        return response()->json(Competence::create($donnees), 201);
    }
}

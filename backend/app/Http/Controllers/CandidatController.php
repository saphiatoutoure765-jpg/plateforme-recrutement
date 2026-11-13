<?php

namespace App\Http\Controllers;

use App\Enums\TypeContrat;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class CandidatController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        return response()->json($request->user()->candidat->load('competences'));
    }

    public function update(Request $request): JsonResponse
    {
        $donnees = $request->validate([
            'nom' => 'sometimes|required|string|max:100',
            'prenom' => 'sometimes|required|string|max:100',
            'niveau_experience' => 'sometimes|integer|min:0',
            'type_contrat_recherche' => ['sometimes', Rule::enum(TypeContrat::class)],
            'competences' => 'sometimes|array',
            'competences.*' => 'integer|exists:competences,id',
        ]);

        $user = $request->user();
        $candidat = $user->candidat;

        $user->update(collect($donnees)->only(['nom', 'prenom'])->all());
        $candidat->update(collect($donnees)->only(['niveau_experience', 'type_contrat_recherche'])->all());

        if (array_key_exists('competences', $donnees)) {
            $candidat->competences()->sync($donnees['competences']);
        }

        return response()->json($candidat->load('competences'));
    }

    public function deposerCv(Request $request): JsonResponse
    {
        $request->validate([
            'cv' => 'required|file|mimes:pdf|max:2048',
        ]);

        $candidat = $request->user()->candidat;

        if ($candidat->chemin_cv) {
            Storage::disk('public')->delete($candidat->chemin_cv);
        }

        // Le fichier est stocké hors de la base : seul son chemin est enregistré.
        $candidat->update([
            'chemin_cv' => $request->file('cv')->store('cvs', 'public'),
        ]);

        return response()->json($candidat);
    }
}

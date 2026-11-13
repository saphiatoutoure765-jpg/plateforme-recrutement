<?php

namespace App\Http\Controllers;

use App\Enums\StatutCandidature;
use App\Models\Candidature;
use App\Models\Offre;
use App\Services\ScoreService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CandidatureController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $donnees = $request->validate([
            'offre_id' => 'required|integer|exists:offres,id',
        ]);

        $offre = Offre::with('competences')->findOrFail($donnees['offre_id']);

        if (! $offre->actif) {
            return response()->json(['message' => "Cette offre n'est plus active."], 422);
        }

        $candidat = $request->user()->candidat()->with('competences')->firstOrFail();

        $dejaPostule = Candidature::where('candidat_id', $candidat->id)
            ->where('offre_id', $offre->id)
            ->exists();

        if ($dejaPostule) {
            return response()->json(['message' => 'Vous avez déjà postulé à cette offre.'], 422);
        }

        $candidature = Candidature::create([
            'candidat_id' => $candidat->id,
            'offre_id' => $offre->id,
            'score_compatibilite' => ScoreService::calculer($candidat, $offre),
            'date_candidature' => now(),
            'statut' => StatutCandidature::EN_ATTENTE->value,
        ]);

        return response()->json($candidature->load('offre'), 201);
    }

    public function mesCandidatures(Request $request): JsonResponse
    {
        $candidatures = $request->user()->candidat->candidatures()
            ->with('offre.entreprise:id,nom_entreprise')
            ->latest('date_candidature')
            ->get();

        return response()->json($candidatures);
    }

    // Entreprise : candidatures reçues pour une offre, classées par score décroissant.
    public function recues(Request $request, Offre $offre): JsonResponse
    {
        $this->verifierProprietaire($request, $offre);

        $candidatures = $offre->candidatures()
            ->with(['candidat.user:id,nom,prenom,email', 'candidat.competences'])
            ->orderByDesc('score_compatibilite')
            ->get();

        return response()->json($candidatures);
    }

    public function changerStatut(Request $request, Candidature $candidature): JsonResponse
    {
        $this->verifierProprietaire($request, $candidature->offre);

        $donnees = $request->validate([
            'statut' => ['required', Rule::in([
                StatutCandidature::ACCEPTEE->value,
                StatutCandidature::REFUSEE->value,
            ])],
        ]);

        $candidature->update($donnees);

        return response()->json($candidature);
    }

    private function verifierProprietaire(Request $request, Offre $offre): void
    {
        abort_unless(
            (int) $offre->entreprise_id === (int) $request->user()->entreprise->id,
            403,
            "Cette offre ne vous appartient pas."
        );
    }
}

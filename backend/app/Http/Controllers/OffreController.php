<?php

namespace App\Http\Controllers;

use App\Enums\Role;
use App\Enums\TypeContrat;
use App\Models\Offre;
use App\Services\ScoreService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class OffreController extends Controller
{
    // Public : le visiteur voit les offres sans score, le candidat connecté voit son score.
    public function index(Request $request): JsonResponse
    {
        $offres = Offre::with(['entreprise:id,nom_entreprise,secteur', 'competences'])
            ->where('actif', true)
            ->latest('date_publication')
            ->get();

        $candidat = $this->candidatConnecte($request);

        if ($candidat) {
            $offres->each(fn ($offre) => $offre->setAttribute(
                'score_compatibilite',
                ScoreService::calculer($candidat, $offre)
            ));
            $offres = $offres->sortByDesc('score_compatibilite')->values();
        }

        return response()->json($offres);
    }

    public function show(Request $request, Offre $offre): JsonResponse
    {
        $offre->load(['entreprise:id,nom_entreprise,secteur,description', 'competences']);

        $candidat = $this->candidatConnecte($request);
        if ($candidat) {
            $offre->setAttribute('score_compatibilite', ScoreService::calculer($candidat, $offre));
        }

        return response()->json($offre);
    }

    public function mesOffres(Request $request): JsonResponse
    {
        $offres = $request->user()->entreprise->offres()
            ->with('competences')
            ->withCount('candidatures')
            ->latest('date_publication')
            ->get();

        return response()->json($offres);
    }

    public function store(Request $request): JsonResponse
    {
        $donnees = $request->validate([
            'titre' => 'required|string|max:150',
            'experience_requise' => 'required|integer|min:0',
            'type_contrat' => ['required', Rule::enum(TypeContrat::class)],
            'competences' => 'nullable|array',
            'competences.*' => 'integer|exists:competences,id',
        ]);

        $offre = $request->user()->entreprise->offres()->create([
            'titre' => $donnees['titre'],
            'experience_requise' => $donnees['experience_requise'],
            'type_contrat' => $donnees['type_contrat'],
            'date_publication' => now(),
            'actif' => true,
        ]);

        $offre->competences()->sync($donnees['competences'] ?? []);

        return response()->json($offre->load('competences'), 201);
    }

    public function update(Request $request, Offre $offre): JsonResponse
    {
        $this->verifierProprietaire($request, $offre);

        $donnees = $request->validate([
            'titre' => 'sometimes|required|string|max:150',
            'experience_requise' => 'sometimes|integer|min:0',
            'type_contrat' => ['sometimes', Rule::enum(TypeContrat::class)],
            'competences' => 'sometimes|array',
            'competences.*' => 'integer|exists:competences,id',
        ]);

        $offre->update(collect($donnees)->except('competences')->all());

        if (array_key_exists('competences', $donnees)) {
            $offre->competences()->sync($donnees['competences']);
        }

        return response()->json($offre->load('competences'));
    }

    public function cloturer(Request $request, Offre $offre): JsonResponse
    {
        $this->verifierProprietaire($request, $offre);
        $offre->update(['actif' => false]);

        return response()->json($offre);
    }

    public function destroy(Request $request, Offre $offre): JsonResponse
    {
        $this->verifierProprietaire($request, $offre);
        $offre->delete();

        return response()->json(['message' => 'Offre supprimée.']);
    }

    private function verifierProprietaire(Request $request, Offre $offre): void
    {
        abort_unless(
            (int) $offre->entreprise_id === (int) $request->user()->entreprise->id,
            403,
            "Cette offre ne vous appartient pas."
        );
    }

    private function candidatConnecte(Request $request)
    {
        $user = $request->user('sanctum');

        if ($user && $user->role === Role::CANDIDAT) {
            return $user->candidat()->with('competences')->first();
        }

        return null;
    }
}

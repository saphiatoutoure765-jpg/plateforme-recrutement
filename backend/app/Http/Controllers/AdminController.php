<?php

namespace App\Http\Controllers;

use App\Models\Candidature;
use App\Models\Offre;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class AdminController extends Controller
{
    public function utilisateurs(Request $request): JsonResponse
    {
        $utilisateurs = User::when(
            $request->query('role'),
            fn ($requete, $role) => $requete->where('role', $role)
        )->latest()->get();

        return response()->json($utilisateurs);
    }

    public function modifierUtilisateur(Request $request, User $user): JsonResponse
    {
        $donnees = $request->validate([
            'nom' => 'sometimes|required|string|max:100',
            'prenom' => 'sometimes|required|string|max:100',
            'email' => ['sometimes', 'required', 'email', 'max:150', Rule::unique('users', 'email')->ignore($user->id)],
        ]);

        $user->update($donnees);

        return response()->json($user);
    }

    public function supprimerUtilisateur(Request $request, User $user): JsonResponse
    {
        if ($user->id === $request->user()->id) {
            return response()->json(['message' => 'Vous ne pouvez pas supprimer votre propre compte.'], 403);
        }

        $user->delete();

        return response()->json(['message' => 'Compte supprimé.']);
    }

    public function offres(): JsonResponse
    {
        return response()->json(Offre::with('entreprise:id,nom_entreprise')->latest()->get());
    }

    public function cloturerOffre(Offre $offre): JsonResponse
    {
        $offre->update(['actif' => false]);

        return response()->json($offre);
    }

    public function supprimerOffre(Offre $offre): JsonResponse
    {
        $offre->delete();

        return response()->json(['message' => 'Offre supprimée.']);
    }

    public function statistiques(): JsonResponse
    {
        return response()->json([
            'utilisateurs_par_role' => User::select('role', DB::raw('COUNT(*) as total'))
                ->groupBy('role')->get(),
            'offres_actives' => Offre::where('actif', true)->count(),
            'total_offres' => Offre::count(),
            'total_candidatures' => Candidature::count(),
            'score_moyen' => round((float) Candidature::avg('score_compatibilite'), 2),
        ]);
    }
}

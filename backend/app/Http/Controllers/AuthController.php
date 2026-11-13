<?php

namespace App\Http\Controllers;

use App\Enums\Role;
use App\Enums\TypeContrat;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $donnees = $request->validate([
            'nom' => 'required|string|max:100',
            'prenom' => 'required|string|max:100',
            'email' => 'required|email|max:150|unique:users,email',
            'password' => 'required|string|min:8|confirmed',
            'role' => ['required', Rule::in([Role::CANDIDAT->value, Role::ENTREPRISE->value])],
            'type_contrat_recherche' => ['required_if:role,candidat', 'nullable', Rule::enum(TypeContrat::class)],
            'niveau_experience' => 'nullable|integer|min:0',
            'nom_entreprise' => 'required_if:role,entreprise|nullable|string|max:150',
            'secteur' => 'nullable|string|max:100',
            'description' => 'nullable|string',
        ]);

        $user = DB::transaction(function () use ($donnees) {
            $user = User::create([
                'nom' => $donnees['nom'],
                'prenom' => $donnees['prenom'],
                'email' => $donnees['email'],
                'password' => Hash::make($donnees['password']),
                'role' => $donnees['role'],
            ]);

            if ($donnees['role'] === Role::CANDIDAT->value) {
                $user->candidat()->create([
                    'niveau_experience' => $donnees['niveau_experience'] ?? 0,
                    'type_contrat_recherche' => $donnees['type_contrat_recherche'],
                ]);
            } else {
                $user->entreprise()->create([
                    'nom_entreprise' => $donnees['nom_entreprise'],
                    'secteur' => $donnees['secteur'] ?? null,
                    'description' => $donnees['description'] ?? null,
                ]);
            }

            return $user;
        });

        return response()->json([
            'user' => $this->avecProfil($user),
            'token' => $user->createToken('auth_token')->plainTextToken,
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $donnees = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $donnees['email'])->first();

        if (! $user || ! Hash::check($donnees['password'], $user->password)) {
            return response()->json(['message' => 'Identifiants incorrects.'], 401);
        }

        return response()->json([
            'user' => $this->avecProfil($user),
            'token' => $user->createToken('auth_token')->plainTextToken,
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Déconnexion réussie.']);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json($this->avecProfil($request->user()));
    }

    private function avecProfil(User $user): User
    {
        return match ($user->role) {
            Role::CANDIDAT => $user->load('candidat.competences'),
            Role::ENTREPRISE => $user->load('entreprise'),
            default => $user,
        };
    }
}

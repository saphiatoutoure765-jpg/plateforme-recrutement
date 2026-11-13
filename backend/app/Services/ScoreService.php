<?php

namespace App\Services;

use App\Models\Candidat;
use App\Models\Offre;

class ScoreService
{
    public const POIDS_COMPETENCES = 0.50;
    public const POIDS_EXPERIENCE = 0.30;
    public const POIDS_CONTRAT = 0.20;

    public static function calculer(Candidat $candidat, Offre $offre): float
    {
        $requises = $offre->competences->pluck('id');
        $possedees = $candidat->competences->pluck('id');

        // Si l'offre ne requiert aucune compétence, le critère vaut 100.
        $scoreCompetences = $requises->count() === 0
            ? 100
            : ($requises->intersect($possedees)->count() / $requises->count()) * 100;

        // Si l'offre ne demande aucune expérience, le critère vaut 100 (pas de division par zéro).
        $experienceRequise = (int) $offre->experience_requise;
        $scoreExperience = $experienceRequise === 0
            ? 100
            : min(100, ((int) $candidat->niveau_experience / $experienceRequise) * 100);

        $scoreContrat = $candidat->type_contrat_recherche === $offre->type_contrat ? 100 : 0;

        $score = $scoreCompetences * self::POIDS_COMPETENCES
            + $scoreExperience * self::POIDS_EXPERIENCE
            + $scoreContrat * self::POIDS_CONTRAT;

        return round($score, 2);
    }
}

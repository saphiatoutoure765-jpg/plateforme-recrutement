import { Offre } from '../models';

export type NiveauScore = 'haut' | 'moyen' | 'bas';

export const COULEURS_SCORE: Record<NiveauScore, string> = {
  haut: '#1FA971',
  moyen: '#E9A23B',
  bas: '#E2574C',
};

export const BADGES_SCORE: Record<NiveauScore, string> = {
  haut: 'bg-menthe-100 text-menthe-800',
  moyen: 'bg-ambre-100 text-ambre-700',
  bas: 'bg-corail-100 text-corail-700',
};

export const LIBELLES_SCORE: Record<NiveauScore, string> = {
  haut: 'Compatibilité élevée',
  moyen: 'Compatibilité moyenne',
  bas: 'Compatibilité faible',
};

export function niveauScore(score: number): NiveauScore {
  if (score >= 70) return 'haut';
  if (score >= 40) return 'moyen';
  return 'bas';
}

export interface DetailScore {
  competences: number;
  experience: number;
  contrat: number;
  total: number;
}

// Même algorithme que le back-end (ScoreService) : 50 % / 30 % / 20 %.
export function calculerScoreDetail(
  requises: number,
  communes: number,
  experienceRequise: number,
  experienceCandidat: number,
  contratIdentique: boolean,
): DetailScore {
  const competences = requises === 0 ? 100 : (communes / requises) * 100;
  const experience =
    experienceRequise === 0 ? 100 : Math.min(100, (experienceCandidat / experienceRequise) * 100);
  const contrat = contratIdentique ? 100 : 0;
  const total = competences * 0.5 + experience * 0.3 + contrat * 0.2;

  return { competences, experience, contrat, total: Math.round(total * 100) / 100 };
}

export function calculerPourOffre(
  competencesCandidat: number[],
  experienceCandidat: number,
  contratCandidat: string,
  offre: Offre,
): DetailScore {
  const requises = offre.competences ?? [];
  const communes = requises.filter((c) => competencesCandidat.includes(c.id)).length;

  return calculerScoreDetail(
    requises.length,
    communes,
    offre.experience_requise,
    experienceCandidat,
    contratCandidat === offre.type_contrat,
  );
}

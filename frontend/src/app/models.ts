export type Role = 'candidat' | 'entreprise' | 'admin';
export type TypeContrat = 'CDI' | 'CDD' | 'Stage' | 'Freelance';
export type StatutCandidature = 'en attente' | 'acceptee' | 'refusee';

export interface Competence {
  id: number;
  nom_competence: string;
}

export interface Candidat {
  id: number;
  user_id: number;
  niveau_experience: number;
  type_contrat_recherche: TypeContrat;
  chemin_cv: string | null;
  competences?: Competence[];
}

export interface Entreprise {
  id: number;
  user_id: number;
  nom_entreprise: string;
  secteur: string | null;
  description: string | null;
}

export interface User {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: Role;
  candidat?: Candidat;
  entreprise?: Entreprise;
}

export interface Offre {
  id: number;
  entreprise_id: number;
  titre: string;
  experience_requise: number;
  type_contrat: TypeContrat;
  date_publication: string;
  actif: boolean;
  score_compatibilite?: number;
  candidatures_count?: number;
  entreprise?: { id: number; nom_entreprise: string; secteur: string | null };
  competences?: Competence[];
}

export interface Candidature {
  id: number;
  candidat_id: number;
  offre_id: number;
  score_compatibilite: number;
  date_candidature: string;
  statut: StatutCandidature;
  offre?: Offre;
  candidat?: Candidat & { user?: { id: number; nom: string; prenom: string; email: string } };
}

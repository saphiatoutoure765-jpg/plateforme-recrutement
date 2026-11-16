import { Routes } from '@angular/router';
import { Accueil } from './pages/accueil';
import { Connexion } from './pages/connexion';
import { Inscription } from './pages/inscription';
import { Offres } from './pages/offres';
import { OffreDetail } from './pages/offre-detail';
import { EspaceProvisoire } from './pages/espace-provisoire';
import { EspaceCandidat } from './pages/espace-candidat';
import { ProfilCandidat } from './pages/profil-candidat';
import { MesCandidatures } from './pages/mes-candidatures';
import { EspaceEntreprise } from './pages/espace-entreprise';
import { MesOffres } from './pages/mes-offres';
import { FormulaireOffre } from './pages/formulaire-offre';
import { CandidaturesRecues } from './pages/candidatures-recues';
import { ProfilEntreprise } from './pages/profil-entreprise';
import { roleGuard, visiteurGuard } from './services/guards';

export const routes: Routes = [
  { path: '', component: Accueil, canActivate: [visiteurGuard], title: 'Accueil' },
  { path: 'connexion', component: Connexion, canActivate: [visiteurGuard], title: 'Connexion' },
  { path: 'inscription', component: Inscription, canActivate: [visiteurGuard], title: 'Inscription' },
  { path: 'offres', component: Offres, title: 'Offres' },
  { path: 'offres/:id', component: OffreDetail, title: "Détail de l'offre" },

  // Espace candidat
  { path: 'candidat', component: EspaceCandidat, canActivate: [roleGuard('candidat')], title: 'Mon espace' },
  { path: 'candidat/profil', component: ProfilCandidat, canActivate: [roleGuard('candidat')], title: 'Mon profil' },
  { path: 'candidat/candidatures', component: MesCandidatures, canActivate: [roleGuard('candidat')], title: 'Mes candidatures' },

  // Espace entreprise
  { path: 'entreprise', component: EspaceEntreprise, canActivate: [roleGuard('entreprise')], title: 'Tableau de bord' },
  { path: 'entreprise/offres', component: MesOffres, canActivate: [roleGuard('entreprise')], title: 'Mes offres' },
  { path: 'entreprise/offres/nouvelle', component: FormulaireOffre, canActivate: [roleGuard('entreprise')], title: 'Publier une offre' },
  { path: 'entreprise/offres/:id/modifier', component: FormulaireOffre, canActivate: [roleGuard('entreprise')], title: "Modifier l'offre" },
  { path: 'entreprise/offres/:id/candidatures', component: CandidaturesRecues, canActivate: [roleGuard('entreprise')], title: 'Candidatures reçues' },
  { path: 'entreprise/profil', component: ProfilEntreprise, canActivate: [roleGuard('entreprise')], title: 'Mon entreprise' },

  // Page provisoire : remplacée dans le lot 5.
  { path: 'admin', component: EspaceProvisoire, canActivate: [roleGuard('admin')], title: 'Administration' },

  { path: '**', redirectTo: '' },
];

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

  // Pages provisoires : remplacées dans les lots 4 et 5.
  { path: 'entreprise', component: EspaceProvisoire, canActivate: [roleGuard('entreprise')], title: 'Espace entreprise' },
  { path: 'admin', component: EspaceProvisoire, canActivate: [roleGuard('admin')], title: 'Administration' },

  { path: '**', redirectTo: '' },
];

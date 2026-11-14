import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { Role } from '../models';

export const connecteGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.estConnecte() ? true : router.createUrlTree(['/connexion']);
};

export const roleGuard = (role: Role): CanActivateFn => () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.estConnecte()) {
    return router.createUrlTree(['/connexion']);
  }
  return auth.role() === role ? true : router.createUrlTree(['/']);
};

// Une personne connectée n'a plus besoin de la vitrine : on l'envoie dans son espace.
export const visiteurGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.estConnecte() ? router.createUrlTree([auth.espacePersonnel()]) : true;
};

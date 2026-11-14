import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-espace-provisoire',
  imports: [RouterLink],
  template: `
    <div class="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
      <span class="badge bg-menthe-100 text-menthe-800">Connecté en tant que {{ auth.role() }}</span>
      <h1 class="mt-5 text-4xl font-bold">Bonjour {{ auth.user()?.prenom }} !</h1>
      <p class="mt-3 text-nuit-500">
        Votre espace personnel sera complété dans les prochains lots. En attendant, vous pouvez
        parcourir les offres.
      </p>
      <div class="mt-8 flex flex-wrap justify-center gap-3">
        <a routerLink="/offres" class="btn btn-primary">Voir les offres</a>
        <button type="button" class="btn btn-outline" (click)="auth.deconnexion()">Se déconnecter</button>
      </div>
    </div>
  `,
})
export class EspaceProvisoire {
  auth = inject(AuthService);
}

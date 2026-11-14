import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-connexion',
  imports: [FormsModule, RouterLink],
  template: `
    <div class="mx-auto my-6 grid max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl shadow-nuit-900/10 lg:grid-cols-2">
      <div
        class="relative hidden flex-col justify-between overflow-hidden bg-[linear-gradient(160deg,#0a1630,#162a4e)] p-10 text-white lg:flex"
      >
        <div class="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-menthe-400/25 blur-3xl"></div>
        <div class="relative">
          <h2 class="font-display text-4xl font-bold leading-tight">Content de vous revoir.</h2>
          <p class="mt-4 text-nuit-100">Retrouvez vos offres, vos scores et vos candidatures.</p>
        </div>
        <ul class="relative space-y-4 text-sm text-nuit-100">
          <li class="flex gap-3"><span class="text-menthe-300">✓</span> Un score de compatibilité sur chaque offre</li>
          <li class="flex gap-3"><span class="text-menthe-300">✓</span> Des candidatures classées automatiquement</li>
          <li class="flex gap-3"><span class="text-menthe-300">✓</span> Un suivi simple de chaque démarche</li>
        </ul>
      </div>

      <div class="p-8 sm:p-12">
        <h1 class="text-3xl font-bold">Connexion</h1>
        <p class="mt-1 text-sm text-nuit-500">Entrez vos identifiants pour accéder à votre espace.</p>

        <form class="mt-8 space-y-5" (ngSubmit)="envoyer()">
          @if (sessionExpiree) {
            <div role="status" class="rounded-xl bg-ambre-100 px-4 py-3 text-sm text-ambre-700">
              Votre session a expiré. Veuillez vous reconnecter.
            </div>
          }
          @if (erreur()) {
            <div role="alert" class="rounded-xl bg-corail-100 px-4 py-3 text-sm text-corail-700">{{ erreur() }}</div>
          }

          <div>
            <label class="etiquette" for="email">Adresse e-mail</label>
            <input id="email" name="email" type="email" class="champ" placeholder="vous@exemple.com" [(ngModel)]="email" required />
          </div>

          <div>
            <label class="etiquette" for="password">Mot de passe</label>
            <div class="relative">
              <input
                id="password"
                name="password"
                class="champ pr-24"
                placeholder="Votre mot de passe"
                [type]="voir() ? 'text' : 'password'"
                [(ngModel)]="password"
                required
              />
              <button
                type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-semibold text-nuit-500 hover:bg-sable-100"
                (click)="voir.set(!voir())"
              >{{ voir() ? 'Masquer' : 'Afficher' }}</button>
            </div>
          </div>

          <button type="submit" class="btn btn-dark w-full" [disabled]="chargement() || !email() || !password()">
            {{ chargement() ? 'Connexion en cours…' : 'Se connecter' }}
          </button>
        </form>

        <p class="mt-6 text-center text-sm text-nuit-500">
          Pas encore de compte ?
          <a routerLink="/inscription" [queryParams]="retour ? { retour: retour } : {}" class="font-semibold text-menthe-700 hover:underline">Créer un compte</a>
        </p>
      </div>
    </div>
  `,
})
export class Connexion {
  private auth = inject(AuthService);
  private route = inject(ActivatedRoute);

  retour = this.route.snapshot.queryParamMap.get('retour');
  sessionExpiree = this.route.snapshot.queryParamMap.get('expiree') === '1';

  email = signal('');
  password = signal('');
  voir = signal(false);
  chargement = signal(false);
  erreur = signal('');

  envoyer(): void {
    this.erreur.set('');
    this.chargement.set(true);

    this.auth.connexion(this.email(), this.password()).subscribe({
      next: () => {
        this.chargement.set(false);
        this.auth.redirigerApresConnexion();
      },
      error: (e: HttpErrorResponse) => {
        this.chargement.set(false);
        if (e.status === 401) {
          this.erreur.set('Adresse e-mail ou mot de passe incorrect.');
        } else if (e.status === 0) {
          this.erreur.set("Impossible de joindre le serveur. Vérifiez que l'API est lancée.");
        } else {
          this.erreur.set(e.error?.message ?? 'Une erreur est survenue.');
        }
      },
    });
  }
}

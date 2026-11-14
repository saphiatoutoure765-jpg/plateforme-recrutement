import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { TypeContrat } from '../models';

@Component({
  selector: 'app-inscription',
  imports: [FormsModule, RouterLink],
  template: `
    <div class="mx-auto my-6 max-w-3xl rounded-3xl bg-white p-8 shadow-2xl shadow-nuit-900/10 sm:p-12">
      <h1 class="text-3xl font-bold">Créer un compte</h1>
      <p class="mt-1 text-sm text-nuit-500">Choisissez votre profil, puis renseignez vos informations.</p>

      <div class="mt-8 grid gap-4 sm:grid-cols-2">
        <button type="button" (click)="role.set('candidat')" [class]="carteRole('candidat')">
          <span class="font-display text-lg font-semibold">Je cherche un emploi</span>
          <span class="mt-1 block text-sm text-nuit-500">Profil de candidat : score de compatibilité sur chaque offre.</span>
        </button>
        <button type="button" (click)="role.set('entreprise')" [class]="carteRole('entreprise')">
          <span class="font-display text-lg font-semibold">Je recrute</span>
          <span class="mt-1 block text-sm text-nuit-500">Profil d'entreprise : publiez des offres, recevez des candidatures classées.</span>
        </button>
      </div>

      <form class="mt-8 space-y-5" (ngSubmit)="envoyer()">
        @if (erreurGenerale()) {
          <div role="alert" class="rounded-xl bg-corail-100 px-4 py-3 text-sm text-corail-700">{{ erreurGenerale() }}</div>
        }

        <div class="grid gap-5 sm:grid-cols-2">
          <div>
            <label class="etiquette" for="nom">Nom</label>
            <input id="nom" name="nom" class="champ" [(ngModel)]="nom" required />
            @if (erreurDe('nom')) { <p class="mt-1 text-xs text-corail-700">{{ erreurDe('nom') }}</p> }
          </div>
          <div>
            <label class="etiquette" for="prenom">Prénom</label>
            <input id="prenom" name="prenom" class="champ" [(ngModel)]="prenom" required />
            @if (erreurDe('prenom')) { <p class="mt-1 text-xs text-corail-700">{{ erreurDe('prenom') }}</p> }
          </div>
        </div>

        <div>
          <label class="etiquette" for="email">Adresse e-mail</label>
          <input id="email" name="email" type="email" class="champ" placeholder="vous@exemple.com" [(ngModel)]="email" required />
          @if (erreurDe('email')) { <p class="mt-1 text-xs text-corail-700">{{ erreurDe('email') }}</p> }
        </div>

        <div class="grid gap-5 sm:grid-cols-2">
          <div>
            <label class="etiquette" for="password">Mot de passe</label>
            <input id="password" name="password" type="password" class="champ" placeholder="8 caractères minimum" [(ngModel)]="password" required />
            <div class="mt-2 flex gap-1.5">
              @for (i of segments; track i) {
                <span [class]="segment(i)"></span>
              }
            </div>
            <p class="mt-1 text-xs text-nuit-400">{{ libelleForce() }}</p>
            @if (erreurDe('password')) { <p class="mt-1 text-xs text-corail-700">{{ erreurDe('password') }}</p> }
          </div>
          <div>
            <label class="etiquette" for="confirmation">Confirmation</label>
            <input id="confirmation" name="confirmation" type="password" class="champ" [(ngModel)]="confirmation" required />
            @if (confirmation() && confirmation() !== password()) {
              <p class="mt-1 text-xs text-corail-700">Les mots de passe ne correspondent pas.</p>
            }
          </div>
        </div>

        @if (role() === 'candidat') {
          <div class="grid gap-5 rounded-2xl bg-sable-50 p-5 sm:grid-cols-2">
            <div>
              <label class="etiquette" for="contrat">Type de contrat recherché</label>
              <select id="contrat" name="contrat" class="champ" [(ngModel)]="typeContrat">
                @for (c of contrats; track c) {
                  <option [value]="c">{{ c }}</option>
                }
              </select>
              @if (erreurDe('type_contrat_recherche')) {
                <p class="mt-1 text-xs text-corail-700">{{ erreurDe('type_contrat_recherche') }}</p>
              }
            </div>
            <div>
              <label class="etiquette" for="experience">Années d'expérience</label>
              <input id="experience" name="experience" type="number" min="0" class="champ" [(ngModel)]="experience" />
            </div>
          </div>
        } @else {
          <div class="space-y-5 rounded-2xl bg-sable-50 p-5">
            <div class="grid gap-5 sm:grid-cols-2">
              <div>
                <label class="etiquette" for="entreprise">Nom de l'entreprise</label>
                <input id="entreprise" name="entreprise" class="champ" [(ngModel)]="nomEntreprise" />
                @if (erreurDe('nom_entreprise')) { <p class="mt-1 text-xs text-corail-700">{{ erreurDe('nom_entreprise') }}</p> }
              </div>
              <div>
                <label class="etiquette" for="secteur">Secteur d'activité</label>
                <input id="secteur" name="secteur" class="champ" placeholder="Informatique, banque…" [(ngModel)]="secteur" />
              </div>
            </div>
            <div>
              <label class="etiquette" for="description">Description (facultatif)</label>
              <textarea id="description" name="description" rows="3" class="champ" [(ngModel)]="description"></textarea>
            </div>
          </div>
        }

        <button type="submit" class="btn btn-dark w-full" [disabled]="chargement() || !formulaireValide()">
          {{ chargement() ? 'Création du compte…' : 'Créer mon compte' }}
        </button>
      </form>

      <p class="mt-6 text-center text-sm text-nuit-500">
        Déjà inscrit ?
        <a routerLink="/connexion" [queryParams]="retour ? { retour: retour } : {}" class="font-semibold text-menthe-700 hover:underline">Se connecter</a>
      </p>
    </div>
  `,
})
export class Inscription {
  private auth = inject(AuthService);
  private route = inject(ActivatedRoute);

  retour = this.route.snapshot.queryParamMap.get('retour');

  contrats: TypeContrat[] = ['CDI', 'CDD', 'Stage', 'Freelance'];
  segments = [0, 1, 2, 3];

  role = signal<'candidat' | 'entreprise'>('candidat');
  nom = signal('');
  prenom = signal('');
  email = signal('');
  password = signal('');
  confirmation = signal('');
  typeContrat = signal<TypeContrat>('CDI');
  experience = signal(0);
  nomEntreprise = signal('');
  secteur = signal('');
  description = signal('');

  chargement = signal(false);
  erreurGenerale = signal('');
  erreurs = signal<Record<string, string[]>>({});

  force = computed(() => {
    const p = this.password();
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p) && /[a-z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    return score;
  });

  libelleForce = computed(() => {
    if (!this.password()) return 'Utilisez au moins 8 caractères.';
    return ['Très faible', 'Faible', 'Correct', 'Bon', 'Excellent'][this.force()];
  });

  formulaireValide = computed(() => {
    const commun =
      this.nom().trim() !== '' &&
      this.prenom().trim() !== '' &&
      this.email().trim() !== '' &&
      this.password().length >= 8 &&
      this.password() === this.confirmation();

    return this.role() === 'candidat' ? commun : commun && this.nomEntreprise().trim() !== '';
  });

  carteRole(r: 'candidat' | 'entreprise'): string {
    const base = 'rounded-2xl border-2 p-5 text-left transition duration-200 ';
    return this.role() === r
      ? base + 'border-menthe-400 bg-menthe-50 shadow-lg shadow-menthe-500/10'
      : base + 'border-sable-200 bg-white hover:border-menthe-300';
  }

  segment(i: number): string {
    const couleurs = ['', 'bg-corail-500', 'bg-ambre-500', 'bg-menthe-300', 'bg-menthe-500'];
    return 'h-1.5 flex-1 rounded-full ' + (i < this.force() ? couleurs[this.force()] : 'bg-sable-200');
  }

  erreurDe(champ: string): string {
    const message = this.erreurs()[champ]?.[0] ?? '';
    return this.traduire(message);
  }

  private traduire(message: string): string {
    if (message.includes('already been taken')) return 'Cette adresse e-mail est déjà utilisée.';
    if (message.includes('confirmation does not match')) return 'Les mots de passe ne correspondent pas.';
    if (message.includes('at least 8')) return 'Le mot de passe doit contenir au moins 8 caractères.';
    if (message.includes('required')) return 'Ce champ est obligatoire.';
    return message;
  }

  envoyer(): void {
    this.erreurGenerale.set('');
    this.erreurs.set({});
    this.chargement.set(true);

    const donnees: Record<string, unknown> = {
      nom: this.nom().trim(),
      prenom: this.prenom().trim(),
      email: this.email().trim(),
      password: this.password(),
      password_confirmation: this.confirmation(),
      role: this.role(),
    };

    if (this.role() === 'candidat') {
      donnees['type_contrat_recherche'] = this.typeContrat();
      donnees['niveau_experience'] = Number(this.experience()) || 0;
    } else {
      donnees['nom_entreprise'] = this.nomEntreprise().trim();
      donnees['secteur'] = this.secteur().trim() || null;
      donnees['description'] = this.description().trim() || null;
    }

    this.auth.inscription(donnees).subscribe({
      next: () => {
        this.chargement.set(false);
        this.auth.redirigerApresConnexion();
      },
      error: (e: HttpErrorResponse) => {
        this.chargement.set(false);
        if (e.status === 422) {
          this.erreurs.set(e.error?.errors ?? {});
          this.erreurGenerale.set('Veuillez corriger les champs signalés.');
        } else if (e.status === 0) {
          this.erreurGenerale.set("Impossible de joindre le serveur. Vérifiez que l'API est lancée.");
        } else {
          this.erreurGenerale.set(e.error?.message ?? 'Une erreur est survenue.');
        }
      },
    });
  }
}

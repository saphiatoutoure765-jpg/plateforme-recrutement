import { Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { API_URL, STORAGE_URL } from '../config';
import { Candidat, Competence, TypeContrat } from '../models';
import { AuthService } from '../services/auth.service';
import { CandidatNav } from '../components/candidat-nav';

function normaliser(texte: string): string {
  return texte.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

@Component({
  selector: 'app-profil-candidat',
  imports: [FormsModule, DecimalPipe, CandidatNav],
  template: `
    <app-candidat-nav />

    <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 class="text-3xl font-bold">Mon profil</h1>
      <p class="mt-1 text-nuit-500">Plus votre profil est précis, plus vos scores de compatibilité sont justes.</p>

      @if (chargement()) {
        <div class="mt-8 h-96 animate-pulse rounded-2xl bg-sable-100"></div>
      } @else {
        <div class="mt-8 grid gap-8 lg:grid-cols-3">
          <div class="space-y-6 lg:col-span-2">
            <form class="space-y-6" (ngSubmit)="enregistrer()">
              @if (message()) {
                <div role="status" class="rounded-xl bg-menthe-50 px-4 py-3 text-sm font-semibold text-menthe-800">{{ message() }}</div>
              }
              @if (erreur()) {
                <div role="alert" class="rounded-xl bg-corail-100 px-4 py-3 text-sm text-corail-700">{{ erreur() }}</div>
              }

              <!-- Informations personnelles -->
              <div class="carte p-6">
                <h2 class="text-xl font-semibold">Informations personnelles</h2>
                <div class="mt-5 grid gap-5 sm:grid-cols-2">
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
                  <div class="sm:col-span-2">
                    <label class="etiquette" for="email">Adresse e-mail</label>
                    <input id="email" name="email" class="champ cursor-not-allowed bg-sable-50" [value]="auth.user()?.email" disabled />
                  </div>
                </div>
              </div>

              <!-- Recherche d'emploi -->
              <div class="carte p-6">
                <h2 class="text-xl font-semibold">Votre recherche</h2>
                <div class="mt-5 grid gap-5 sm:grid-cols-2">
                  <div>
                    <label class="etiquette" for="contrat">Type de contrat recherché</label>
                    <select id="contrat" name="contrat" class="champ" [(ngModel)]="contrat">
                      @for (c of contrats; track c) {
                        <option [value]="c">{{ c }}</option>
                      }
                    </select>
                  </div>
                  <div>
                    <label class="etiquette" for="experience">Années d'expérience</label>
                    <div class="flex items-center gap-2">
                      <button type="button" class="btn btn-outline !px-4" (click)="changerExperience(-1)" aria-label="Moins">−</button>
                      <input id="experience" name="experience" type="number" min="0" max="50" class="champ text-center" [(ngModel)]="experience" />
                      <button type="button" class="btn btn-outline !px-4" (click)="changerExperience(1)" aria-label="Plus">+</button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Compétences -->
              <div class="carte p-6">
                <div class="flex flex-wrap items-center justify-between gap-3">
                  <h2 class="text-xl font-semibold">Vos compétences</h2>
                  <span class="badge bg-menthe-100 text-menthe-800">{{ choisies().length }} sélectionnée(s)</span>
                </div>
                <p class="mt-1 text-sm text-nuit-500">Cliquez pour ajouter ou retirer une compétence. Elles servent à 50 % du score.</p>

                <input
                  name="rechercheCompetence"
                  type="search"
                  class="champ mt-4"
                  placeholder="Rechercher une compétence…"
                  [(ngModel)]="recherche"
                />

                <div class="mt-4 flex flex-wrap gap-2">
                  @for (c of filtrees(); track c.id) {
                    <button type="button" [class]="classeChip(c.id)" (click)="basculer(c.id)">
                      {{ estChoisie(c.id) ? '✓ ' : '' }}{{ c.nom_competence }}
                    </button>
                  } @empty {
                    <p class="text-sm text-nuit-400">Aucune compétence ne correspond à votre recherche.</p>
                  }
                </div>
              </div>

              <button type="submit" class="btn btn-dark w-full sm:w-auto" [disabled]="enregistrement() || !formulaireValide()">
                {{ enregistrement() ? 'Enregistrement…' : 'Enregistrer mon profil' }}
              </button>
            </form>

            <!-- CV -->
            <div class="carte p-6">
              <h2 class="text-xl font-semibold">Votre CV</h2>
              <p class="mt-1 text-sm text-nuit-500">Format PDF uniquement, 2 Mo maximum. Les entreprises pourront le télécharger.</p>

              @if (candidat()?.chemin_cv) {
                <div class="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-menthe-50 p-4">
                  <div class="flex items-center gap-3">
                    <span class="flex h-10 w-10 items-center justify-center rounded-lg bg-menthe-400 text-sm font-bold text-nuit-900">PDF</span>
                    <div>
                      <p class="text-sm font-semibold text-menthe-800">CV déposé</p>
                      <p class="text-xs text-nuit-500">Vous pouvez le remplacer en déposant un nouveau fichier.</p>
                    </div>
                  </div>
                  <a [href]="lienCv()" target="_blank" rel="noopener" class="btn btn-outline !py-2">Ouvrir mon CV</a>
                </div>
              }

              <label
                class="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-sable-300 bg-sable-50 p-8 text-center transition hover:border-menthe-400 hover:bg-menthe-50"
                (dragover)="survol($event)"
                (drop)="deposer($event)"
              >
                <span class="font-display text-lg font-semibold">Glissez votre CV ici</span>
                <span class="mt-1 text-sm text-nuit-500">ou cliquez pour choisir un fichier</span>
                <input type="file" accept="application/pdf,.pdf" class="hidden" (change)="choisirFichier($event)" />
              </label>

              @if (fichier()) {
                <div class="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-sable-200 p-4">
                  <div>
                    <p class="text-sm font-semibold">{{ fichier()?.name }}</p>
                    <p class="text-xs text-nuit-400">{{ tailleFichier() | number: '1.0-0' }} Ko</p>
                  </div>
                  <button type="button" class="btn btn-primary !py-2" [disabled]="envoiCv()" (click)="envoyerCv()">
                    {{ envoiCv() ? 'Envoi…' : 'Déposer ce CV' }}
                  </button>
                </div>
              }

              @if (messageCv()) {
                <p role="status" class="mt-4 rounded-xl bg-menthe-50 p-3 text-sm font-semibold text-menthe-800">{{ messageCv() }}</p>
              }
              @if (erreurCv()) {
                <p role="alert" class="mt-4 rounded-xl bg-corail-100 p-3 text-sm text-corail-700">{{ erreurCv() }}</p>
              }
            </div>
          </div>

          <aside class="lg:col-span-1">
            <div class="carte sticky top-24 p-6">
              <h2 class="font-display text-lg font-semibold">Complétion du profil</h2>
              <p class="font-display mt-3 text-5xl font-bold text-menthe-600">{{ completion() }} %</p>
              <div class="mt-3 h-2.5 rounded-full bg-sable-100">
                <div class="h-2.5 rounded-full bg-menthe-400 transition-all duration-700" [style.width.%]="completion()"></div>
              </div>

              <ul class="mt-5 space-y-3 text-sm">
                <li class="flex items-center gap-2 text-menthe-700"><span>✓</span> Compte et type de contrat <span class="ml-auto text-xs text-nuit-400">30 %</span></li>
                <li [class]="'flex items-center gap-2 ' + (choisies().length > 0 ? 'text-menthe-700' : 'text-nuit-400')">
                  <span>{{ choisies().length > 0 ? '✓' : '○' }}</span> Compétences <span class="ml-auto text-xs text-nuit-400">40 %</span>
                </li>
                <li [class]="'flex items-center gap-2 ' + (candidat()?.chemin_cv ? 'text-menthe-700' : 'text-nuit-400')">
                  <span>{{ candidat()?.chemin_cv ? '✓' : '○' }}</span> CV déposé <span class="ml-auto text-xs text-nuit-400">30 %</span>
                </li>
              </ul>

              <p class="mt-5 rounded-xl bg-sable-50 p-3 text-xs text-nuit-500">
                Rappel : votre score sur une offre dépend de vos compétences (50 %), de votre expérience (30 %)
                et du type de contrat (20 %).
              </p>
            </div>
          </aside>
        </div>
      }
    </div>
  `,
})
export class ProfilCandidat {
  private http = inject(HttpClient);
  auth = inject(AuthService);

  contrats: TypeContrat[] = ['CDI', 'CDD', 'Stage', 'Freelance'];

  chargement = signal(true);
  candidat = signal<Candidat | null>(null);
  toutes = signal<Competence[]>([]);

  nom = signal('');
  prenom = signal('');
  contrat = signal<TypeContrat>('CDI');
  experience = signal(0);
  choisies = signal<number[]>([]);
  recherche = signal('');

  enregistrement = signal(false);
  message = signal('');
  erreur = signal('');
  erreurs = signal<Record<string, string[]>>({});

  fichier = signal<File | null>(null);
  envoiCv = signal(false);
  messageCv = signal('');
  erreurCv = signal('');

  filtrees = computed(() => {
    const terme = normaliser(this.recherche().trim());
    return this.toutes().filter((c) => !terme || normaliser(c.nom_competence).includes(terme));
  });

  completion = computed(() => {
    const c = this.candidat();
    let pourcentage = 30;
    if (this.choisies().length > 0) pourcentage += 40;
    if (c?.chemin_cv) pourcentage += 30;
    return pourcentage;
  });

  formulaireValide = computed(() => this.nom().trim() !== '' && this.prenom().trim() !== '');

  tailleFichier = computed(() => (this.fichier()?.size ?? 0) / 1024);

  lienCv = computed(() => `${STORAGE_URL}/${this.candidat()?.chemin_cv}`);

  constructor() {
    const u = this.auth.user();
    this.nom.set(u?.nom ?? '');
    this.prenom.set(u?.prenom ?? '');

    forkJoin({
      profil: this.http.get<Candidat>(`${API_URL}/candidat/profil`),
      competences: this.http.get<Competence[]>(`${API_URL}/competences`),
    }).subscribe({
      next: (r) => {
        this.candidat.set(r.profil);
        this.toutes.set(r.competences);
        this.contrat.set(r.profil.type_contrat_recherche);
        this.experience.set(r.profil.niveau_experience);
        this.choisies.set((r.profil.competences ?? []).map((c) => c.id));
        this.chargement.set(false);
      },
      error: () => {
        this.erreur.set("Impossible de charger votre profil. Vérifiez que l'API est lancée.");
        this.chargement.set(false);
      },
    });
  }

  changerExperience(delta: number): void {
    const valeur = (Number(this.experience()) || 0) + delta;
    this.experience.set(Math.max(0, Math.min(50, valeur)));
  }

  estChoisie(id: number): boolean {
    return this.choisies().includes(id);
  }

  basculer(id: number): void {
    const actuelles = this.choisies();
    this.choisies.set(actuelles.includes(id) ? actuelles.filter((x) => x !== id) : [...actuelles, id]);
  }

  classeChip(id: number): string {
    const base = 'rounded-full border px-4 py-2 text-sm font-semibold transition ';
    return this.estChoisie(id)
      ? base + 'border-menthe-400 bg-menthe-400 text-nuit-900 shadow-sm'
      : base + 'border-sable-300 bg-white text-nuit-600 hover:border-menthe-300';
  }

  erreurDe(champ: string): string {
    const m = this.erreurs()[champ]?.[0] ?? '';
    if (m.includes('required')) return 'Ce champ est obligatoire.';
    return m;
  }

  enregistrer(): void {
    this.message.set('');
    this.erreur.set('');
    this.erreurs.set({});
    this.enregistrement.set(true);

    const donnees = {
      nom: this.nom().trim(),
      prenom: this.prenom().trim(),
      niveau_experience: Number(this.experience()) || 0,
      type_contrat_recherche: this.contrat(),
      competences: this.choisies(),
    };

    this.http.put<Candidat>(`${API_URL}/candidat/profil`, donnees).subscribe({
      next: (c) => {
        this.candidat.set(c);
        this.enregistrement.set(false);
        this.message.set('Profil enregistré. Vos scores sont recalculés sur toutes les offres.');
      },
      error: (e: HttpErrorResponse) => {
        this.enregistrement.set(false);
        if (e.status === 422) {
          this.erreurs.set(e.error?.errors ?? {});
          this.erreur.set('Veuillez corriger les champs signalés.');
        } else if (e.status === 0) {
          this.erreur.set("Impossible de joindre le serveur. Vérifiez que l'API est lancée.");
        } else {
          this.erreur.set(e.error?.message ?? 'Une erreur est survenue.');
        }
      },
    });
  }

  survol(evt: Event): void {
    evt.preventDefault();
  }

  deposer(evt: DragEvent): void {
    evt.preventDefault();
    this.preparer(evt.dataTransfer?.files?.[0] ?? null);
  }

  choisirFichier(evt: Event): void {
    const input = evt.target as HTMLInputElement;
    this.preparer(input.files?.[0] ?? null);
  }

  private preparer(f: File | null): void {
    this.messageCv.set('');
    this.erreurCv.set('');
    this.fichier.set(null);
    if (!f) return;

    const estPdf = f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf');
    if (!estPdf) {
      this.erreurCv.set('Seuls les fichiers PDF sont acceptés.');
      return;
    }
    if (f.size > 2 * 1024 * 1024) {
      this.erreurCv.set('Le fichier dépasse 2 Mo.');
      return;
    }
    this.fichier.set(f);
  }

  envoyerCv(): void {
    const f = this.fichier();
    if (!f) return;

    this.envoiCv.set(true);
    this.messageCv.set('');
    this.erreurCv.set('');

    const donnees = new FormData();
    donnees.append('cv', f);

    this.http.post<Candidat>(`${API_URL}/candidat/cv`, donnees).subscribe({
      next: (c) => {
        this.envoiCv.set(false);
        this.fichier.set(null);
        this.candidat.update((actuel) => (actuel ? { ...actuel, chemin_cv: c.chemin_cv } : c));
        this.messageCv.set('CV déposé avec succès.');
      },
      error: (e: HttpErrorResponse) => {
        this.envoiCv.set(false);
        this.erreurCv.set(
          e.status === 422
            ? 'Fichier refusé : PDF uniquement, 2 Mo maximum.'
            : "Le dépôt a échoué. Vérifiez que l'API est lancée.",
        );
      },
    });
  }
}

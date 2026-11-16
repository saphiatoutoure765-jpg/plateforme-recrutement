import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { API_URL } from '../config';
import { Competence, Offre, TypeContrat } from '../models';
import { AuthService } from '../services/auth.service';
import { EntrepriseNav } from '../components/entreprise-nav';
import { OffreCarte } from '../components/offre-carte';

function normaliser(texte: string): string {
  return texte.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

@Component({
  selector: 'app-formulaire-offre',
  imports: [FormsModule, RouterLink, EntrepriseNav, OffreCarte],
  template: `
    <app-entreprise-nav />

    <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <a routerLink="/entreprise/offres" class="text-sm font-semibold text-nuit-500 hover:text-menthe-700">← Retour à mes offres</a>
      <h1 class="mt-3 text-3xl font-bold">{{ edition ? "Modifier l'offre" : 'Publier une offre' }}</h1>
      <p class="mt-1 text-nuit-500">Plus l'offre est précise, plus le classement des candidatures est pertinent.</p>

      @if (chargement()) {
        <div class="mt-8 h-96 animate-pulse rounded-2xl bg-sable-100"></div>
      } @else if (introuvable()) {
        <div class="carte mt-8 p-10 text-center">
          <p class="font-display text-xl font-semibold">Offre introuvable</p>
          <a routerLink="/entreprise/offres" class="btn btn-primary mt-6">Retour à mes offres</a>
        </div>
      } @else {
        <div class="mt-8 grid gap-8 lg:grid-cols-3">
          <form class="space-y-6 lg:col-span-2" (ngSubmit)="envoyer()">
            @if (erreurGenerale()) {
              <div role="alert" class="rounded-xl bg-corail-100 px-4 py-3 text-sm text-corail-700">{{ erreurGenerale() }}</div>
            }

            <div class="carte p-6">
              <h2 class="text-xl font-semibold">Le poste</h2>
              <div class="mt-5 space-y-5">
                <div>
                  <label class="etiquette" for="titre">Intitulé du poste</label>
                  <input id="titre" name="titre" class="champ" placeholder="Ex. : Développeur Laravel" [(ngModel)]="titre" required />
                  @if (erreurDe('titre')) { <p class="mt-1 text-xs text-corail-700">{{ erreurDe('titre') }}</p> }
                </div>

                <div>
                  <p class="etiquette">Type de contrat</p>
                  <div class="flex flex-wrap gap-2">
                    @for (c of contrats; track c) {
                      <button type="button" [class]="classeContrat(c)" (click)="contrat.set(c)">{{ c }}</button>
                    }
                  </div>
                </div>

                <div>
                  <label class="etiquette" for="experience">Expérience minimale demandée (années)</label>
                  <div class="flex max-w-xs items-center gap-2">
                    <button type="button" class="btn btn-outline !px-4" (click)="changerExperience(-1)" aria-label="Moins">−</button>
                    <input id="experience" name="experience" type="number" min="0" max="50" class="champ text-center" [(ngModel)]="experience" />
                    <button type="button" class="btn btn-outline !px-4" (click)="changerExperience(1)" aria-label="Plus">+</button>
                  </div>
                  <p class="mt-1 text-xs text-nuit-400">0 = débutant accepté : tout candidat obtient alors 100 % sur ce critère.</p>
                </div>
              </div>
            </div>

            <div class="carte p-6">
              <div class="flex flex-wrap items-center justify-between gap-3">
                <h2 class="text-xl font-semibold">Compétences requises</h2>
                <span class="badge bg-menthe-100 text-menthe-800">{{ choisies().length }} sélectionnée(s)</span>
              </div>
              <p class="mt-1 text-sm text-nuit-500">Elles pèsent pour 50 % du score de chaque candidat.</p>

              <input name="rechercheCompetence" type="search" class="champ mt-4" placeholder="Rechercher une compétence…" [(ngModel)]="recherche" />

              <div class="mt-4 flex flex-wrap gap-2">
                @for (c of filtrees(); track c.id) {
                  <button type="button" [class]="classeChip(c.id)" (click)="basculer(c.id)">
                    {{ estChoisie(c.id) ? '✓ ' : '' }}{{ c.nom_competence }}
                  </button>
                } @empty {
                  <p class="text-sm text-nuit-400">Aucune compétence ne correspond.</p>
                }
              </div>
              @if (erreurDe('competences')) { <p class="mt-2 text-xs text-corail-700">{{ erreurDe('competences') }}</p> }
            </div>

            <div class="flex flex-wrap gap-3">
              <button type="submit" class="btn btn-dark" [disabled]="envoi() || !valide()">
                {{ envoi() ? 'Enregistrement…' : (edition ? 'Enregistrer les modifications' : "Publier l'offre") }}
              </button>
              <a routerLink="/entreprise/offres" class="btn btn-outline">Annuler</a>
            </div>
          </form>

          <aside class="lg:col-span-1">
            <div class="sticky top-24 space-y-5">
              <div>
                <p class="mb-2 text-sm font-semibold uppercase tracking-widest text-menthe-600">Aperçu pour les candidats</p>
                <div class="pointer-events-none">
                  <app-offre-carte [offre]="apercu()" />
                </div>
              </div>

              <div class="carte p-5 text-sm text-nuit-600">
                <p class="font-semibold text-nuit-900">Ce que cela change pour le score</p>
                <p class="mt-2">{{ conseil() }}</p>
              </div>
            </div>
          </aside>
        </div>
      }
    </div>
  `,
})
export class FormulaireOffre {
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private auth = inject(AuthService);

  id = Number(this.route.snapshot.paramMap.get('id')) || 0;
  edition = this.id > 0;

  contrats: TypeContrat[] = ['CDI', 'CDD', 'Stage', 'Freelance'];

  toutes = signal<Competence[]>([]);
  chargement = signal(true);
  introuvable = signal(false);

  titre = signal('');
  contrat = signal<TypeContrat>('CDI');
  experience = signal(0);
  choisies = signal<number[]>([]);
  recherche = signal('');

  envoi = signal(false);
  erreurGenerale = signal('');
  erreurs = signal<Record<string, string[]>>({});

  valide = computed(() => this.titre().trim().length >= 3);

  filtrees = computed(() => {
    const terme = normaliser(this.recherche().trim());
    return this.toutes().filter((c) => !terme || normaliser(c.nom_competence).includes(terme));
  });

  apercu = computed<Offre>(() => ({
    id: 0,
    entreprise_id: 0,
    titre: this.titre().trim() || "Intitulé du poste",
    experience_requise: Number(this.experience()) || 0,
    type_contrat: this.contrat(),
    date_publication: new Date().toISOString(),
    actif: true,
    entreprise: {
      id: 0,
      nom_entreprise: this.auth.user()?.entreprise?.nom_entreprise ?? 'Votre entreprise',
      secteur: this.auth.user()?.entreprise?.secteur ?? null,
    },
    competences: this.toutes().filter((c) => this.choisies().includes(c.id)),
  }));

  conseil = computed(() => {
    const n = this.choisies().length;
    const exp = Number(this.experience()) || 0;
    const parties: string[] = [];

    if (n === 0) {
      parties.push("Sans compétence exigée, tous les candidats obtiennent 50 points sur 50 pour ce critère : le classement se jouera sur l'expérience et le contrat.");
    } else {
      const unite = Math.round((50 / n) * 10) / 10;
      parties.push(`Chaque compétence que possède un candidat lui rapporte ${unite} point(s) sur 50.`);
    }
    if (exp === 0) {
      parties.push("Aucune expérience exigée : les débutants ne sont pas pénalisés.");
    } else {
      parties.push(`Un candidat avec moins de ${exp} an(s) d'expérience perd des points (30 au maximum).`);
    }
    return parties.join(' ');
  });

  constructor() {
    forkJoin({
      competences: this.http.get<Competence[]>(`${API_URL}/competences`),
      offres: this.edition ? this.http.get<Offre[]>(`${API_URL}/entreprise/offres`) : of([] as Offre[]),
    }).subscribe({
      next: (r) => {
        this.toutes.set(r.competences);

        if (this.edition) {
          const offre = r.offres.find((o) => o.id === this.id);
          if (!offre) {
            this.introuvable.set(true);
          } else {
            this.titre.set(offre.titre);
            this.contrat.set(offre.type_contrat);
            this.experience.set(offre.experience_requise);
            this.choisies.set((offre.competences ?? []).map((c) => c.id));
          }
        }
        this.chargement.set(false);
      },
      error: () => {
        this.erreurGenerale.set("Impossible de charger le formulaire. Vérifiez que l'API est lancée.");
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

  classeContrat(c: TypeContrat): string {
    const base = 'rounded-xl border-2 px-5 py-2.5 text-sm font-semibold transition ';
    return this.contrat() === c
      ? base + 'border-menthe-400 bg-menthe-50 text-nuit-900'
      : base + 'border-sable-200 bg-white text-nuit-500 hover:border-menthe-300';
  }

  erreurDe(champ: string): string {
    const m = this.erreurs()[champ]?.[0] ?? '';
    if (m.includes('required')) return 'Ce champ est obligatoire.';
    return m;
  }

  envoyer(): void {
    this.erreurGenerale.set('');
    this.erreurs.set({});
    this.envoi.set(true);

    const donnees = {
      titre: this.titre().trim(),
      experience_requise: Number(this.experience()) || 0,
      type_contrat: this.contrat(),
      competences: this.choisies(),
    };

    const requete = this.edition
      ? this.http.put<Offre>(`${API_URL}/entreprise/offres/${this.id}`, donnees)
      : this.http.post<Offre>(`${API_URL}/entreprise/offres`, donnees);

    requete.subscribe({
      next: () => {
        this.envoi.set(false);
        this.router.navigate(['/entreprise/offres']);
      },
      error: (e: HttpErrorResponse) => {
        this.envoi.set(false);
        if (e.status === 422) {
          this.erreurs.set(e.error?.errors ?? {});
          this.erreurGenerale.set('Veuillez corriger les champs signalés.');
        } else if (e.status === 403) {
          this.erreurGenerale.set("Cette offre ne vous appartient pas.");
        } else if (e.status === 0) {
          this.erreurGenerale.set("Impossible de joindre le serveur. Vérifiez que l'API est lancée.");
        } else {
          this.erreurGenerale.set(e.error?.message ?? 'Une erreur est survenue.');
        }
      },
    });
  }
}

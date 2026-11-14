import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { API_URL } from '../config';
import { Offre, TypeContrat } from '../models';
import { AuthService } from '../services/auth.service';
import { OffreCarte } from '../components/offre-carte';

type Tri = 'score' | 'recent' | 'experience';

function normaliser(texte: string): string {
  return texte.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

@Component({
  selector: 'app-offres',
  imports: [FormsModule, RouterLink, OffreCarte],
  template: `
    <section class="relative overflow-hidden bg-[linear-gradient(135deg,#060d20,#0a1630_55%,#162a4e)] text-white">
      <div class="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-menthe-400/25 blur-3xl"></div>
      <div class="relative mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <p class="text-sm font-semibold uppercase tracking-widest text-menthe-300">Offres d'emploi</p>
        <h1 class="mt-2 text-4xl font-bold sm:text-5xl">Trouvez votre prochaine opportunité</h1>
        <div class="relative mt-8 max-w-2xl">
          <svg class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-nuit-300" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
          </svg>
          <input
            type="search"
            class="champ !rounded-2xl !py-4 pl-12 text-base"
            placeholder="Poste, entreprise, compétence…"
            [(ngModel)]="recherche"
          />
        </div>
      </div>
    </section>

    <div class="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      @if (!auth.estConnecte()) {
        <div class="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-menthe-200 bg-menthe-50 p-5">
          <p class="text-sm text-nuit-700">
            <strong>Découvrez votre score.</strong> Connectez-vous en tant que candidat pour voir votre taux de
            compatibilité sur chaque offre.
          </p>
          <div class="flex gap-2">
            <a routerLink="/connexion" [queryParams]="{ retour: '/offres' }" class="btn btn-dark !py-2">Connexion</a>
            <a routerLink="/inscription" [queryParams]="{ retour: '/offres' }" class="btn btn-outline !py-2">Inscription</a>
          </div>
        </div>
      }

      <div class="grid gap-8 lg:grid-cols-4">
        <aside class="lg:col-span-1">
          <div class="carte sticky top-24 space-y-6 p-6">
            <div class="flex items-center justify-between">
              <h2 class="font-display text-lg font-semibold">Filtres</h2>
              <button type="button" class="text-xs font-semibold text-menthe-700 hover:underline" (click)="reinitialiser()">
                Réinitialiser
              </button>
            </div>

            <div>
              <p class="etiquette">Type de contrat</p>
              <div class="flex flex-wrap gap-2">
                @for (c of contrats; track c) {
                  <button type="button" [class]="chipContrat(c)" (click)="basculerContrat(c)">{{ c }}</button>
                }
              </div>
            </div>

            <div>
              <label class="etiquette" for="exp">Expérience demandée</label>
              <select id="exp" class="champ" [(ngModel)]="experienceMax">
                @for (n of niveauxExperience; track n.valeur) {
                  <option [ngValue]="n.valeur">{{ n.libelle }}</option>
                }
              </select>
            </div>

            @if (estCandidat()) {
              <div>
                <div class="flex items-center justify-between">
                  <label class="etiquette !mb-0" for="scoremin">Score minimum</label>
                  <span class="badge bg-menthe-100 text-menthe-800">{{ scoreMin() }} %</span>
                </div>
                <input id="scoremin" type="range" min="0" max="100" step="5" class="mt-3 w-full accent-menthe-500" [(ngModel)]="scoreMin" />
              </div>
            }

            <div>
              <label class="etiquette" for="tri">Trier par</label>
              <select id="tri" class="champ" [(ngModel)]="tri">
                @if (estCandidat()) {
                  <option value="score">Meilleur score</option>
                }
                <option value="recent">Plus récentes</option>
                <option value="experience">Expérience demandée</option>
              </select>
            </div>
          </div>
        </aside>

        <section class="lg:col-span-3">
          @if (chargement()) {
            <div class="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              @for (i of [1, 2, 3, 4, 5, 6]; track i) {
                <div class="h-56 animate-pulse rounded-2xl bg-sable-100"></div>
              }
            </div>
          } @else if (erreur()) {
            <div role="alert" class="rounded-2xl bg-corail-100 p-6 text-corail-700">{{ erreur() }}</div>
          } @else {
            <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
              <p class="text-sm text-nuit-500">
                <strong class="text-nuit-900">{{ filtrees().length }}</strong>
                offre{{ filtrees().length > 1 ? 's' : '' }} trouvée{{ filtrees().length > 1 ? 's' : '' }}
              </p>
              @if (estCandidat() && filtrees().length > 0) {
                <span class="badge bg-menthe-100 text-menthe-800">Meilleur score : {{ meilleurScore() }} %</span>
              }
            </div>

            @if (filtrees().length === 0) {
              <div class="carte p-10 text-center">
                <p class="font-display text-xl font-semibold">Aucune offre ne correspond à votre recherche</p>
                <p class="mt-2 text-sm text-nuit-500">Essayez d'élargir vos filtres.</p>
                <button type="button" class="btn btn-outline mt-5" (click)="reinitialiser()">Réinitialiser les filtres</button>
              </div>
            } @else {
              <div class="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                @for (o of filtrees(); track o.id) {
                  <app-offre-carte [offre]="o" />
                }
              </div>
            }
          }
        </section>
      </div>
    </div>
  `,
})
export class Offres {
  private http = inject(HttpClient);
  auth = inject(AuthService);

  contrats: TypeContrat[] = ['CDI', 'CDD', 'Stage', 'Freelance'];
  niveauxExperience = [
    { valeur: 99, libelle: 'Tous niveaux' },
    { valeur: 0, libelle: 'Débutant accepté' },
    { valeur: 1, libelle: "Jusqu'à 1 an" },
    { valeur: 2, libelle: "Jusqu'à 2 ans" },
    { valeur: 3, libelle: "Jusqu'à 3 ans" },
    { valeur: 5, libelle: "Jusqu'à 5 ans" },
  ];

  offres = signal<Offre[]>([]);
  chargement = signal(true);
  erreur = signal('');

  recherche = signal('');
  contratsChoisis = signal<TypeContrat[]>([]);
  experienceMax = signal(99);
  scoreMin = signal(0);
  tri = signal<Tri>(this.auth.role() === 'candidat' ? 'score' : 'recent');

  estCandidat = computed(() => this.auth.role() === 'candidat');

  filtrees = computed(() => {
    const terme = normaliser(this.recherche().trim());
    const contrats = this.contratsChoisis();
    const expMax = Number(this.experienceMax());
    const scoreMin = Number(this.scoreMin());
    const candidat = this.estCandidat();

    const liste = this.offres().filter((o) => {
      if (terme) {
        const texte = normaliser(
          [
            o.titre,
            o.entreprise?.nom_entreprise ?? '',
            o.entreprise?.secteur ?? '',
            ...(o.competences ?? []).map((c) => c.nom_competence),
          ].join(' '),
        );
        if (!texte.includes(terme)) return false;
      }
      if (contrats.length > 0 && !contrats.includes(o.type_contrat)) return false;
      if (o.experience_requise > expMax) return false;
      if (candidat && (o.score_compatibilite ?? 0) < scoreMin) return false;
      return true;
    });

    const tri = this.tri();
    return [...liste].sort((a, b) => {
      if (tri === 'score') return (b.score_compatibilite ?? 0) - (a.score_compatibilite ?? 0);
      if (tri === 'experience') return a.experience_requise - b.experience_requise;
      return new Date(b.date_publication).getTime() - new Date(a.date_publication).getTime();
    });
  });

  meilleurScore = computed(() =>
    this.filtrees().reduce((max, o) => Math.max(max, o.score_compatibilite ?? 0), 0),
  );

  constructor() {
    this.http.get<Offre[]>(`${API_URL}/offres`).subscribe({
      next: (liste) => {
        this.offres.set(liste);
        this.chargement.set(false);
      },
      error: () => {
        this.erreur.set("Impossible de charger les offres. Vérifiez que l'API est lancée.");
        this.chargement.set(false);
      },
    });
  }

  basculerContrat(c: TypeContrat): void {
    this.contratsChoisis.update((liste) =>
      liste.includes(c) ? liste.filter((x) => x !== c) : [...liste, c],
    );
  }

  chipContrat(c: TypeContrat): string {
    const base = 'rounded-full border px-3 py-1.5 text-xs font-semibold transition ';
    return this.contratsChoisis().includes(c)
      ? base + 'border-menthe-400 bg-menthe-400 text-nuit-900'
      : base + 'border-sable-300 bg-white text-nuit-600 hover:border-menthe-300';
  }

  reinitialiser(): void {
    this.recherche.set('');
    this.contratsChoisis.set([]);
    this.experienceMax.set(99);
    this.scoreMin.set(0);
    this.tri.set(this.estCandidat() ? 'score' : 'recent');
  }
}

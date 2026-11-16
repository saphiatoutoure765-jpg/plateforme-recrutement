import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { API_URL } from '../config';
import { Candidature } from '../models';
import { CandidatNav } from '../components/candidat-nav';
import { ScoreGauge } from '../components/score-gauge';
import { statutClasse, statutLibelle } from '../utils/statut';

type Filtre = 'toutes' | 'en attente' | 'acceptee' | 'refusee';

@Component({
  selector: 'app-mes-candidatures',
  imports: [RouterLink, DatePipe, DecimalPipe, CandidatNav, ScoreGauge],
  template: `
    <app-candidat-nav />

    <div class="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <h1 class="text-3xl font-bold">Mes candidatures</h1>
      <p class="mt-1 text-nuit-500">Suivez l'état de chacune de vos démarches.</p>

      @if (chargement()) {
        <div class="mt-8 h-64 animate-pulse rounded-2xl bg-sable-100"></div>
      } @else if (erreur()) {
        <div role="alert" class="mt-8 rounded-2xl bg-corail-100 p-6 text-corail-700">{{ erreur() }}</div>
      } @else {
        <div class="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          <div class="carte p-5">
            <p class="text-xs font-semibold uppercase tracking-wider text-nuit-400">Envoyées</p>
            <p class="mt-1 font-display text-3xl font-bold">{{ candidatures().length }}</p>
          </div>
          <div class="carte p-5">
            <p class="text-xs font-semibold uppercase tracking-wider text-nuit-400">En attente</p>
            <p class="mt-1 font-display text-3xl font-bold text-ambre-500">{{ compter('en attente') }}</p>
          </div>
          <div class="carte p-5">
            <p class="text-xs font-semibold uppercase tracking-wider text-nuit-400">Acceptées</p>
            <p class="mt-1 font-display text-3xl font-bold text-menthe-600">{{ compter('acceptee') }}</p>
          </div>
          <div class="carte p-5">
            <p class="text-xs font-semibold uppercase tracking-wider text-nuit-400">Score moyen</p>
            <p class="mt-1 font-display text-3xl font-bold">{{ scoreMoyen() | number: '1.0-0' }}%</p>
          </div>
        </div>

        <div class="mt-8 flex flex-wrap gap-2">
          @for (f of filtres; track f.valeur) {
            <button type="button" [class]="classeFiltre(f.valeur)" (click)="filtre.set(f.valeur)">
              {{ f.libelle }} ({{ compter(f.valeur) }})
            </button>
          }
        </div>

        @if (affichees().length === 0) {
          <div class="carte mt-6 p-10 text-center">
            @if (candidatures().length === 0) {
              <p class="font-display text-xl font-semibold">Vous n'avez pas encore postulé</p>
              <p class="mt-2 text-sm text-nuit-500">Parcourez les offres et postulez à celles qui vous correspondent.</p>
              <a routerLink="/offres" class="btn btn-primary mt-6">Découvrir les offres</a>
            } @else {
              <p class="font-display text-xl font-semibold">Aucune candidature dans cette catégorie</p>
            }
          </div>
        } @else {
          <ul class="mt-6 space-y-4">
            @for (c of affichees(); track c.id) {
              <li class="carte flex flex-wrap items-center gap-5 p-5">
                <app-score-gauge [score]="c.score_compatibilite" [taille]="72" />
                <div class="min-w-0 flex-1">
                  <a [routerLink]="['/offres', c.offre_id]" class="font-display text-lg font-semibold hover:text-menthe-700">{{ c.offre?.titre }}</a>
                  <p class="text-sm text-nuit-500">
                    {{ c.offre?.entreprise?.nom_entreprise }} · {{ c.offre?.type_contrat }}
                  </p>
                  <p class="mt-1 text-xs text-nuit-400">Candidature du {{ c.date_candidature | date: 'dd/MM/yyyy' }}</p>
                </div>
                <div class="flex flex-col items-end gap-2">
                  <span [class]="'badge ' + statutClasse(c.statut)">{{ statutLibelle(c.statut) }}</span>
                  <a [routerLink]="['/offres', c.offre_id]" class="text-sm font-semibold text-menthe-700 hover:underline">Voir l'offre</a>
                </div>
              </li>
            }
          </ul>
        }
      }
    </div>
  `,
})
export class MesCandidatures {
  private http = inject(HttpClient);

  statutLibelle = statutLibelle;
  statutClasse = statutClasse;

  filtres: { valeur: Filtre; libelle: string }[] = [
    { valeur: 'toutes', libelle: 'Toutes' },
    { valeur: 'en attente', libelle: 'En attente' },
    { valeur: 'acceptee', libelle: 'Acceptées' },
    { valeur: 'refusee', libelle: 'Refusées' },
  ];

  candidatures = signal<Candidature[]>([]);
  chargement = signal(true);
  erreur = signal('');
  filtre = signal<Filtre>('toutes');

  affichees = computed(() => {
    const f = this.filtre();
    return f === 'toutes' ? this.candidatures() : this.candidatures().filter((c) => c.statut === f);
  });

  scoreMoyen = computed(() => {
    const liste = this.candidatures();
    if (liste.length === 0) return 0;
    return liste.reduce((somme, c) => somme + c.score_compatibilite, 0) / liste.length;
  });

  constructor() {
    this.http.get<Candidature[]>(`${API_URL}/candidat/candidatures`).subscribe({
      next: (liste) => {
        this.candidatures.set(liste);
        this.chargement.set(false);
      },
      error: () => {
        this.erreur.set("Impossible de charger vos candidatures. Vérifiez que l'API est lancée.");
        this.chargement.set(false);
      },
    });
  }

  compter(f: Filtre): number {
    return f === 'toutes' ? this.candidatures().length : this.candidatures().filter((c) => c.statut === f).length;
  }

  classeFiltre(f: Filtre): string {
    const base = 'rounded-full border px-4 py-2 text-sm font-semibold transition ';
    return this.filtre() === f
      ? base + 'border-nuit-900 bg-nuit-900 text-sable-50'
      : base + 'border-sable-300 bg-white text-nuit-600 hover:border-menthe-300';
  }
}

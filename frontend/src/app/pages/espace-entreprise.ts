import { Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { forkJoin, map, of, switchMap } from 'rxjs';
import { API_URL } from '../config';
import { Candidature, Offre } from '../models';
import { AuthService } from '../services/auth.service';
import { EntrepriseNav } from '../components/entreprise-nav';
import { ScoreGauge } from '../components/score-gauge';

interface TableauDeBord {
  nombre_offres: number;
  nombre_candidatures: number;
  score_moyen: number;
}

@Component({
  selector: 'app-espace-entreprise',
  imports: [RouterLink, DecimalPipe, EntrepriseNav, ScoreGauge],
  template: `
    <app-entreprise-nav />

    <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div class="relative overflow-hidden rounded-3xl bg-[linear-gradient(135deg,#060d20,#0a1630_55%,#162a4e)] p-8 text-white">
        <div class="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-menthe-400/25 blur-3xl"></div>
        <div class="relative flex flex-wrap items-center justify-between gap-6">
          <div>
            <p class="text-sm font-semibold uppercase tracking-widest text-menthe-300">Espace recruteur</p>
            <h1 class="mt-2 text-3xl font-bold sm:text-4xl">Bonjour {{ auth.user()?.prenom }} 👋</h1>
            <p class="mt-2 text-nuit-100">{{ auth.user()?.entreprise?.nom_entreprise }} · vos candidatures arrivent déjà classées par score.</p>
          </div>
          <div class="flex flex-wrap gap-3">
            <a routerLink="/entreprise/offres/nouvelle" class="btn btn-primary">+ Publier une offre</a>
            <a routerLink="/entreprise/offres" class="btn btn-outline-light">Mes offres</a>
          </div>
        </div>
      </div>

      @if (chargement()) {
        <div class="mt-8 grid gap-4 md:grid-cols-4">
          @for (i of [1, 2, 3, 4]; track i) {
            <div class="h-28 animate-pulse rounded-2xl bg-sable-100"></div>
          }
        </div>
        <div class="mt-6 h-72 animate-pulse rounded-2xl bg-sable-100"></div>
      } @else if (erreur()) {
        <div role="alert" class="mt-8 rounded-2xl bg-corail-100 p-6 text-corail-700">{{ erreur() }}</div>
      } @else {
        <!-- CHIFFRES CLES -->
        <div class="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          <div class="carte p-5">
            <p class="text-xs font-semibold uppercase tracking-wider text-nuit-400">Offres actives</p>
            <p class="mt-1 font-display text-4xl font-bold">{{ offresActives() }}</p>
            <p class="mt-1 text-xs text-nuit-400">sur {{ stats()?.nombre_offres }} publiée(s)</p>
          </div>
          <div class="carte p-5">
            <p class="text-xs font-semibold uppercase tracking-wider text-nuit-400">Candidatures reçues</p>
            <p class="mt-1 font-display text-4xl font-bold">{{ stats()?.nombre_candidatures }}</p>
            <p class="mt-1 text-xs text-nuit-400">toutes offres confondues</p>
          </div>
          <div class="carte p-5">
            <p class="text-xs font-semibold uppercase tracking-wider text-nuit-400">À traiter</p>
            <p class="mt-1 font-display text-4xl font-bold text-ambre-500">{{ enAttente() }}</p>
            <p class="mt-1 text-xs text-nuit-400">en attente de réponse</p>
          </div>
          <div class="carte p-5">
            <p class="text-xs font-semibold uppercase tracking-wider text-nuit-400">Score moyen</p>
            <p class="mt-1 font-display text-4xl font-bold text-menthe-600">{{ stats()?.score_moyen | number: '1.0-0' }}%</p>
            <p class="mt-1 text-xs text-nuit-400">qualité des candidats</p>
          </div>
        </div>

        @if (offres().length === 0) {
          <div class="carte mt-8 p-10 text-center">
            <p class="font-display text-2xl font-semibold">Publiez votre première offre</p>
            <p class="mt-2 text-nuit-500">Dès qu'un candidat postulera, vous verrez ici ses statistiques et son score.</p>
            <a routerLink="/entreprise/offres/nouvelle" class="btn btn-primary mt-6">Publier une offre</a>
          </div>
        } @else {
          <div class="mt-8 grid gap-6 lg:grid-cols-3">
            <!-- CANDIDATURES PAR OFFRE -->
            <section class="carte p-6 lg:col-span-2">
              <h2 class="text-xl font-semibold">Candidatures par offre</h2>
              <ul class="mt-5 space-y-4">
                @for (o of parOffre(); track o.id) {
                  <li>
                    <div class="flex items-center justify-between gap-3 text-sm">
                      <a [routerLink]="['/entreprise/offres', o.id, 'candidatures']" class="truncate font-semibold hover:text-menthe-700">{{ o.titre }}</a>
                      <span class="shrink-0 text-nuit-500">{{ o.candidatures_count ?? 0 }} candidature(s)</span>
                    </div>
                    <div class="mt-1.5 h-3 rounded-full bg-sable-100">
                      <div
                        class="h-3 rounded-full bg-[linear-gradient(90deg,#1fb37f,#72e2b5)] transition-all duration-700"
                        [style.width.%]="largeur(o)"
                      ></div>
                    </div>
                  </li>
                }
              </ul>
            </section>

            <!-- REPARTITION DES SCORES -->
            <section class="carte p-6">
              <h2 class="text-xl font-semibold">Qualité des candidatures</h2>
              @if (repartition().total === 0) {
                <p class="mt-5 text-sm text-nuit-500">Aucune candidature pour l'instant.</p>
              } @else {
                <div class="mt-5 flex h-5 overflow-hidden rounded-full bg-sable-100">
                  <div class="bg-menthe-500 transition-all duration-700" [style.width.%]="repartition().pHaut"></div>
                  <div class="bg-ambre-500 transition-all duration-700" [style.width.%]="repartition().pMoyen"></div>
                  <div class="bg-corail-500 transition-all duration-700" [style.width.%]="repartition().pBas"></div>
                </div>
                <ul class="mt-5 space-y-3 text-sm">
                  <li class="flex items-center justify-between">
                    <span class="flex items-center gap-2"><span class="h-3 w-3 rounded-full bg-menthe-500"></span> Élevée (70 % et plus)</span>
                    <strong>{{ repartition().haut }}</strong>
                  </li>
                  <li class="flex items-center justify-between">
                    <span class="flex items-center gap-2"><span class="h-3 w-3 rounded-full bg-ambre-500"></span> Moyenne (40 à 69 %)</span>
                    <strong>{{ repartition().moyen }}</strong>
                  </li>
                  <li class="flex items-center justify-between">
                    <span class="flex items-center gap-2"><span class="h-3 w-3 rounded-full bg-corail-500"></span> Faible (moins de 40 %)</span>
                    <strong>{{ repartition().bas }}</strong>
                  </li>
                </ul>
              }
            </section>
          </div>

          <!-- MEILLEURES CANDIDATURES -->
          @if (meilleures().length > 0) {
            <section class="carte mt-6 p-6">
              <h2 class="text-xl font-semibold">Meilleures candidatures</h2>
              <ul class="mt-4 divide-y divide-sable-200">
                @for (c of meilleures(); track c.id) {
                  <li class="flex flex-wrap items-center gap-4 py-4">
                    <app-score-gauge [score]="c.score_compatibilite" [taille]="56" />
                    <div class="min-w-0 flex-1">
                      <p class="font-semibold">{{ c.candidat?.user?.prenom }} {{ c.candidat?.user?.nom }}</p>
                      <p class="truncate text-sm text-nuit-500">pour « {{ titreDe(c.offre_id) }} »</p>
                    </div>
                    <a [routerLink]="['/entreprise/offres', c.offre_id, 'candidatures']" class="btn btn-outline !py-2">Voir</a>
                  </li>
                }
              </ul>
            </section>
          }
        }
      }
    </div>
  `,
})
export class EspaceEntreprise {
  private http = inject(HttpClient);
  auth = inject(AuthService);

  stats = signal<TableauDeBord | null>(null);
  offres = signal<Offre[]>([]);
  candidatures = signal<Candidature[]>([]);
  chargement = signal(true);
  erreur = signal('');

  offresActives = computed(() => this.offres().filter((o) => o.actif).length);

  enAttente = computed(() => this.candidatures().filter((c) => c.statut === 'en attente').length);

  parOffre = computed(() =>
    [...this.offres()].sort((a, b) => (b.candidatures_count ?? 0) - (a.candidatures_count ?? 0)).slice(0, 6),
  );

  maxCandidatures = computed(() => Math.max(1, ...this.offres().map((o) => o.candidatures_count ?? 0)));

  repartition = computed(() => {
    const liste = this.candidatures();
    const total = liste.length;
    const haut = liste.filter((c) => c.score_compatibilite >= 70).length;
    const moyen = liste.filter((c) => c.score_compatibilite >= 40 && c.score_compatibilite < 70).length;
    const bas = total - haut - moyen;
    const pct = (n: number) => (total === 0 ? 0 : (n / total) * 100);
    return { total, haut, moyen, bas, pHaut: pct(haut), pMoyen: pct(moyen), pBas: pct(bas) };
  });

  meilleures = computed(() =>
    [...this.candidatures()].sort((a, b) => b.score_compatibilite - a.score_compatibilite).slice(0, 5),
  );

  titres = computed(() => new Map(this.offres().map((o) => [o.id, o.titre] as [number, string])));

  constructor() {
    forkJoin({
      stats: this.http.get<TableauDeBord>(`${API_URL}/entreprise/tableau-de-bord`),
      offres: this.http.get<Offre[]>(`${API_URL}/entreprise/offres`),
    })
      .pipe(
        switchMap((r) => {
          const avecCandidatures = r.offres.filter((o) => (o.candidatures_count ?? 0) > 0);
          const requetes = avecCandidatures.map((o) =>
            this.http.get<Candidature[]>(`${API_URL}/entreprise/offres/${o.id}/candidatures`),
          );
          const suite = requetes.length > 0 ? forkJoin(requetes) : of([] as Candidature[][]);
          return suite.pipe(map((listes) => ({ ...r, candidatures: listes.flat() })));
        }),
      )
      .subscribe({
        next: (r) => {
          this.stats.set(r.stats);
          this.offres.set(r.offres);
          this.candidatures.set(r.candidatures);
          this.chargement.set(false);
        },
        error: () => {
          this.erreur.set("Impossible de charger votre tableau de bord. Vérifiez que l'API est lancée.");
          this.chargement.set(false);
        },
      });
  }

  largeur(o: Offre): number {
    return ((o.candidatures_count ?? 0) / this.maxCandidatures()) * 100;
  }

  titreDe(id: number): string {
    return this.titres().get(id) ?? 'Offre';
  }
}

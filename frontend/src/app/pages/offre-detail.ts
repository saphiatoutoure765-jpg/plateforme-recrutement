import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { API_URL } from '../config';
import { Candidat, Candidature, Offre, StatutCandidature } from '../models';
import { AuthService } from '../services/auth.service';
import { ScoreGauge } from '../components/score-gauge';
import { BADGES_SCORE, LIBELLES_SCORE, calculerPourOffre, niveauScore } from '../utils/score';

const BADGES_CONTRAT: Record<string, string> = {
  CDI: 'bg-menthe-100 text-menthe-800',
  CDD: 'bg-nuit-100 text-nuit-700',
  Stage: 'bg-sable-200 text-sable-600',
  Freelance: 'bg-ambre-100 text-ambre-700',
};

@Component({
  selector: 'app-offre-detail',
  imports: [RouterLink, DatePipe, DecimalPipe, ScoreGauge],
  template: `
    <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      @if (offre(); as o) {
        <a routerLink="/offres" class="inline-flex items-center gap-2 text-sm font-semibold text-nuit-500 hover:text-menthe-700">
          ← Retour aux offres
        </a>

        <div class="mt-4 grid gap-8 lg:grid-cols-3">
          <div class="lg:col-span-2">
            <div class="carte p-7">
              <div class="flex flex-wrap items-start gap-5">
                <span class="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-nuit-900 font-display text-3xl font-bold text-menthe-300">{{ initiale(o) }}</span>
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-semibold text-nuit-500">
                    {{ o.entreprise?.nom_entreprise }}
                    @if (o.entreprise?.secteur) {
                      <span class="text-nuit-300">· {{ o.entreprise?.secteur }}</span>
                    }
                  </p>
                  <h1 class="mt-1 text-3xl font-bold sm:text-4xl">{{ o.titre }}</h1>
                  <div class="mt-4 flex flex-wrap items-center gap-2">
                    <span [class]="'badge ' + badgeContrat(o.type_contrat)">{{ o.type_contrat }}</span>
                    <span class="badge bg-sable-100 text-nuit-600">{{ experienceTexte(o.experience_requise) }}</span>
                    <span class="badge bg-sable-100 text-nuit-600">Publiée le {{ o.date_publication | date: 'dd/MM/yyyy' }}</span>
                    @if (!o.actif) {
                      <span class="badge bg-corail-100 text-corail-700">Offre clôturée</span>
                    }
                  </div>
                </div>
              </div>
            </div>

            <div class="carte mt-6 p-7">
              <h2 class="text-xl font-semibold">Compétences requises</h2>
              @if ((o.competences ?? []).length === 0) {
                <p class="mt-3 text-nuit-500">Aucune compétence particulière n'est exigée pour cette offre.</p>
              } @else {
                <div class="mt-4 flex flex-wrap gap-2">
                  @for (c of o.competences ?? []; track c.id) {
                    <span [class]="classeCompetence(c.id)">
                      @if (candidat()) {
                        {{ possede(c.id) ? '✓' : '○' }}
                      }
                      {{ c.nom_competence }}
                    </span>
                  }
                </div>
                @if (candidat() && manquantes().length > 0) {
                  <p class="mt-5 rounded-xl bg-sable-50 p-4 text-sm text-nuit-600">
                    <strong>Pour améliorer votre score,</strong> il vous manque :
                    {{ nomsManquants() }}.
                  </p>
                }
                @if (candidat() && (candidat()?.competences ?? []).length === 0) {
                  <p class="mt-5 rounded-xl bg-ambre-100 p-4 text-sm text-ambre-700">
                    Votre profil ne contient encore aucune compétence : renseignez-les pour obtenir un score plus juste.
                  </p>
                }
              }
            </div>

            <div class="carte mt-6 p-7">
              <h2 class="text-xl font-semibold">Détails du poste</h2>
              <dl class="mt-4 grid gap-4 sm:grid-cols-2">
                <div class="rounded-xl bg-sable-50 p-4">
                  <dt class="text-xs font-semibold uppercase tracking-wider text-nuit-400">Type de contrat</dt>
                  <dd class="mt-1 font-semibold">{{ o.type_contrat }}</dd>
                </div>
                <div class="rounded-xl bg-sable-50 p-4">
                  <dt class="text-xs font-semibold uppercase tracking-wider text-nuit-400">Expérience demandée</dt>
                  <dd class="mt-1 font-semibold">{{ experienceTexte(o.experience_requise) }}</dd>
                </div>
              </dl>
            </div>

            @if (description(o)) {
              <div class="carte mt-6 p-7">
                <h2 class="text-xl font-semibold">À propos de l'entreprise</h2>
                <p class="mt-3 leading-relaxed text-nuit-600">{{ description(o) }}</p>
              </div>
            }
          </div>

          <aside class="lg:col-span-1">
            <div class="sticky top-24 space-y-5">
              @if (auth.role() === 'candidat') {
                <div class="carte p-6 text-center">
                  <p class="text-sm font-semibold uppercase tracking-widest text-menthe-600">Votre compatibilité</p>
                  @if (scoreAffiche() !== null) {
                    <div class="mt-3 flex justify-center">
                      <app-score-gauge [score]="scoreAffiche() ?? 0" [taille]="170" />
                    </div>
                    <span [class]="'badge mt-3 ' + badgeScore()">{{ libelleScore() }}</span>
                  } @else {
                    <p class="mt-4 text-sm text-nuit-400">Calcul du score…</p>
                  }

                  @if (barres().length > 0) {
                    <div class="mt-6 space-y-4 text-left">
                      @for (b of barres(); track b.nom) {
                        <div>
                          <div class="flex items-center justify-between text-sm">
                            <span class="font-semibold text-nuit-700">{{ b.nom }} <span class="font-normal text-nuit-400">({{ b.poids }} %)</span></span>
                            <span class="font-semibold">+{{ b.points | number: '1.0-1' }} pts</span>
                          </div>
                          <div class="mt-1.5 h-2.5 rounded-full bg-sable-100">
                            <div class="h-2.5 rounded-full transition-all duration-500" [class]="b.couleur" [style.width.%]="b.valeur"></div>
                          </div>
                          <p class="mt-1 text-xs text-nuit-400">{{ b.info }}</p>
                        </div>
                      }
                    </div>
                  }
                </div>

                <div class="carte p-6">
                  @if (candidature(); as cand) {
                    <div class="rounded-xl bg-menthe-50 p-4 text-sm">
                      <p class="font-semibold text-menthe-800">Candidature envoyée</p>
                      <p class="mt-1 text-nuit-600">
                        Le {{ cand.date_candidature | date: 'dd/MM/yyyy' }} · score {{ cand.score_compatibilite }} %
                      </p>
                      <span [class]="'badge mt-2 ' + statutClasse(cand.statut)">{{ statutLibelle(cand.statut) }}</span>
                    </div>
                  } @else if (!o.actif) {
                    <p class="text-sm text-corail-700">Cette offre est clôturée : il n'est plus possible de postuler.</p>
                  } @else {
                    <button type="button" class="btn btn-primary w-full" [disabled]="envoi()" (click)="postuler()">
                      {{ envoi() ? 'Envoi en cours…' : 'Postuler à cette offre' }}
                    </button>
                  }

                  @if (messageAction()) {
                    <p role="status" class="mt-3 rounded-xl bg-menthe-50 p-3 text-sm text-menthe-800">{{ messageAction() }}</p>
                  }
                  @if (erreurAction()) {
                    <p role="alert" class="mt-3 rounded-xl bg-corail-100 p-3 text-sm text-corail-700">{{ erreurAction() }}</p>
                  }
                </div>
              } @else if (auth.role() === null) {
                <div class="carte p-6 text-center">
                  <p class="text-sm font-semibold uppercase tracking-widest text-menthe-600">Votre compatibilité</p>
                  <div class="mx-auto mt-4 flex h-28 w-28 items-center justify-center rounded-full border-4 border-dashed border-sable-300 font-display text-3xl font-bold text-sable-400">?</div>
                  <p class="mt-4 text-sm text-nuit-600">
                    Connectez-vous en tant que candidat pour découvrir votre score pour cette offre, et postuler.
                  </p>
                  <div class="mt-5 space-y-2">
                    <a routerLink="/connexion" [queryParams]="{ retour: '/offres/' + o.id }" class="btn btn-primary w-full">Se connecter pour postuler</a>
                    <a routerLink="/inscription" [queryParams]="{ retour: '/offres/' + o.id }" class="btn btn-outline w-full">Créer un compte</a>
                  </div>
                </div>
              } @else {
                <div class="carte p-6 text-sm text-nuit-600">
                  <p class="font-semibold text-nuit-900">Espace {{ auth.role() }}</p>
                  <p class="mt-2">Seuls les candidats peuvent postuler aux offres.</p>
                </div>
              }
            </div>
          </aside>
        </div>
      } @else if (erreur()) {
        <div class="carte mx-auto max-w-xl p-10 text-center">
          <p class="font-display text-2xl font-semibold">Offre introuvable</p>
          <p class="mt-2 text-nuit-500">{{ erreur() }}</p>
          <a routerLink="/offres" class="btn btn-primary mt-6">Voir les offres</a>
        </div>
      } @else {
        <div class="grid gap-8 lg:grid-cols-3">
          <div class="h-80 animate-pulse rounded-2xl bg-sable-100 lg:col-span-2"></div>
          <div class="h-80 animate-pulse rounded-2xl bg-sable-100"></div>
        </div>
      }
    </div>
  `,
})
export class OffreDetail {
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  auth = inject(AuthService);

  id = Number(this.route.snapshot.paramMap.get('id'));

  offre = signal<Offre | null>(null);
  candidat = signal<Candidat | null>(null);
  candidature = signal<Candidature | null>(null);

  erreur = signal('');
  messageAction = signal('');
  erreurAction = signal('');
  envoi = signal(false);

  idsPossedes = computed(() => new Set((this.candidat()?.competences ?? []).map((c) => c.id)));

  manquantes = computed(() => (this.offre()?.competences ?? []).filter((c) => !this.idsPossedes().has(c.id)));

  nomsManquants = computed(() => this.manquantes().map((c) => c.nom_competence).join(', '));

  detail = computed(() => {
    const c = this.candidat();
    const o = this.offre();
    if (!c || !o) return null;
    return calculerPourOffre([...this.idsPossedes()], c.niveau_experience, c.type_contrat_recherche, o);
  });

  scoreAffiche = computed(() => this.offre()?.score_compatibilite ?? this.detail()?.total ?? null);

  badgeScore = computed(() => BADGES_SCORE[niveauScore(this.scoreAffiche() ?? 0)]);
  libelleScore = computed(() => LIBELLES_SCORE[niveauScore(this.scoreAffiche() ?? 0)]);

  barres = computed(() => {
    const d = this.detail();
    const o = this.offre();
    const c = this.candidat();
    if (!d || !o || !c) return [];

    const requises = o.competences?.length ?? 0;
    const communes = requises - this.manquantes().length;

    return [
      {
        nom: 'Compétences',
        poids: 50,
        valeur: d.competences,
        points: d.competences * 0.5,
        couleur: 'bg-menthe-400',
        info: requises === 0 ? "L'offre n'exige aucune compétence." : `${communes} compétence(s) sur ${requises} requise(s).`,
      },
      {
        nom: 'Expérience',
        poids: 30,
        valeur: d.experience,
        points: d.experience * 0.3,
        couleur: 'bg-nuit-300',
        info:
          o.experience_requise === 0
            ? 'Aucune expérience exigée.'
            : `Vous avez ${c.niveau_experience} an(s) pour ${o.experience_requise} demandé(s).`,
      },
      {
        nom: 'Contrat',
        poids: 20,
        valeur: d.contrat,
        points: d.contrat * 0.2,
        couleur: 'bg-sable-400',
        info:
          d.contrat === 100
            ? `Vous recherchez un ${o.type_contrat}.`
            : `Vous recherchez un ${c.type_contrat_recherche}, l'offre est un ${o.type_contrat}.`,
      },
    ];
  });

  constructor() {
    this.http.get<Offre>(`${API_URL}/offres/${this.id}`).subscribe({
      next: (o) => {
        this.offre.set(o);
        this.chargerProfilCandidat();
      },
      error: (e: HttpErrorResponse) =>
        this.erreur.set(
          e.status === 404 ? "Cette offre n'existe pas ou n'est plus disponible." : "Impossible de charger l'offre.",
        ),
    });
  }

  private chargerProfilCandidat(): void {
    if (this.auth.role() !== 'candidat') return;

    this.http.get<Candidat>(`${API_URL}/candidat/profil`).subscribe({
      next: (c) => this.candidat.set(c),
      error: () => {},
    });

    this.http.get<Candidature[]>(`${API_URL}/candidat/candidatures`).subscribe({
      next: (liste) => this.candidature.set(liste.find((c) => c.offre_id === this.id) ?? null),
      error: () => {},
    });
  }

  postuler(): void {
    this.messageAction.set('');
    this.erreurAction.set('');
    this.envoi.set(true);

    this.http.post<Candidature>(`${API_URL}/candidat/candidatures`, { offre_id: this.id }).subscribe({
      next: (c) => {
        this.envoi.set(false);
        this.candidature.set(c);
        this.messageAction.set(`Candidature envoyée ! Votre score pour cette offre : ${c.score_compatibilite} %.`);
      },
      error: (e: HttpErrorResponse) => {
        this.envoi.set(false);
        if (e.status === 422) {
          this.erreurAction.set(e.error?.message ?? 'Candidature impossible.');
        } else if (e.status === 0) {
          this.erreurAction.set('Impossible de joindre le serveur.');
        } else {
          this.erreurAction.set('Une erreur est survenue.');
        }
      },
    });
  }

  initiale(o: Offre): string {
    return (o.entreprise?.nom_entreprise ?? '?').charAt(0).toUpperCase();
  }

  description(o: Offre): string | null {
    return (o.entreprise as { description?: string | null } | undefined)?.description ?? null;
  }

  badgeContrat(contrat: string): string {
    return BADGES_CONTRAT[contrat] ?? 'bg-sable-100 text-nuit-600';
  }

  experienceTexte(n: number): string {
    if (n === 0) return 'Débutant accepté';
    return n + (n > 1 ? ' ans' : ' an') + " d'expérience min.";
  }

  possede(id: number): boolean {
    return this.idsPossedes().has(id);
  }

  classeCompetence(id: number): string {
    const base = 'rounded-xl px-3 py-1.5 text-sm font-medium ';
    if (!this.candidat()) return base + 'bg-sable-100 text-nuit-700';
    return this.possede(id)
      ? base + 'bg-menthe-100 text-menthe-800'
      : base + 'border border-dashed border-sable-300 bg-white text-nuit-500';
  }

  statutLibelle(s: StatutCandidature): string {
    return { 'en attente': 'En attente', acceptee: 'Acceptée', refusee: 'Refusée' }[s];
  }

  statutClasse(s: StatutCandidature): string {
    return {
      'en attente': 'bg-ambre-100 text-ambre-700',
      acceptee: 'bg-menthe-100 text-menthe-800',
      refusee: 'bg-corail-100 text-corail-700',
    }[s];
  }
}

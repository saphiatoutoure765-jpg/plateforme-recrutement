import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { API_URL } from '../config';
import { Candidat, Candidature, Offre } from '../models';
import { AuthService } from '../services/auth.service';
import { CandidatNav } from '../components/candidat-nav';
import { OffreCarte } from '../components/offre-carte';
import { statutClasse, statutLibelle } from '../utils/statut';

@Component({
  selector: 'app-espace-candidat',
  imports: [RouterLink, DatePipe, DecimalPipe, CandidatNav, OffreCarte],
  template: `
    <app-candidat-nav />

    <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      @if (chargement()) {
        <div class="grid gap-6 lg:grid-cols-12">
          <div class="h-96 animate-pulse rounded-2xl bg-sable-100 lg:col-span-3"></div>
          <div class="h-96 animate-pulse rounded-2xl bg-sable-100 lg:col-span-6"></div>
          <div class="h-96 animate-pulse rounded-2xl bg-sable-100 lg:col-span-3"></div>
        </div>
      } @else if (erreur()) {
        <div role="alert" class="rounded-2xl bg-corail-100 p-6 text-corail-700">{{ erreur() }}</div>
      } @else {
        <div class="grid gap-6 lg:grid-cols-12">
          <!-- COLONNE GAUCHE : PROFIL -->
          <aside class="lg:col-span-3">
            <div class="carte overflow-hidden lg:sticky lg:top-24">
              <div class="h-20 bg-[linear-gradient(135deg,#0a1630,#1fb37f)]"></div>
              <div class="-mt-10 px-5 pb-6 text-center">
                <span
                  class="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-menthe-400 font-display text-2xl font-bold text-nuit-900"
                >{{ initiales() }}</span>
                <h2 class="mt-3 text-xl font-semibold">{{ auth.user()?.prenom }} {{ auth.user()?.nom }}</h2>
                <p class="text-sm text-nuit-500">Candidat · recherche un {{ candidat()?.type_contrat_recherche }}</p>
                <p class="mt-1 text-xs text-nuit-400">{{ experienceTexte() }}</p>

                <div class="mt-5 text-left">
                  <div class="flex items-center justify-between text-xs font-semibold">
                    <span class="text-nuit-600">Profil complété</span>
                    <span class="text-menthe-700">{{ completion() }} %</span>
                  </div>
                  <div class="mt-1.5 h-2.5 rounded-full bg-sable-100">
                    <div class="h-2.5 rounded-full bg-menthe-400 transition-all duration-700" [style.width.%]="completion()"></div>
                  </div>
                </div>

                @if (manquants().length > 0) {
                  <ul class="mt-4 space-y-2 text-left text-sm">
                    @for (m of manquants(); track m) {
                      <li class="flex items-start gap-2 text-nuit-600">
                        <span class="mt-0.5 text-ambre-500">○</span> {{ m }}
                      </li>
                    }
                  </ul>
                  <a routerLink="/candidat/profil" class="btn btn-primary mt-5 w-full !py-2">Compléter mon profil</a>
                } @else {
                  <p class="mt-4 rounded-xl bg-menthe-50 p-3 text-sm font-semibold text-menthe-800">Profil complet, bravo !</p>
                }
              </div>

              <div class="grid grid-cols-3 divide-x divide-sable-200 border-t border-sable-200 text-center">
                <div class="p-3">
                  <p class="font-display text-xl font-bold">{{ candidatures().length }}</p>
                  <p class="text-[11px] text-nuit-400">candidatures</p>
                </div>
                <div class="p-3">
                  <p class="font-display text-xl font-bold">{{ offresFortes() }}</p>
                  <p class="text-[11px] text-nuit-400">offres &gt; 70 %</p>
                </div>
                <div class="p-3">
                  <p class="font-display text-xl font-bold">{{ meilleurScore() | number: '1.0-0' }}%</p>
                  <p class="text-[11px] text-nuit-400">meilleur score</p>
                </div>
              </div>
            </div>
          </aside>

          <!-- COLONNE CENTRALE : FIL D'OFFRES -->
          <section class="lg:col-span-6">
            <div class="rounded-2xl bg-[linear-gradient(135deg,#0a1630,#162a4e)] p-6 text-white">
              <h1 class="text-2xl font-bold">Bonjour {{ auth.user()?.prenom }} 👋</h1>
              @if (completion() < 100) {
                <p class="mt-1 text-sm text-nuit-100">
                  Votre profil est complété à {{ completion() }} %. Plus il est complet, plus vos scores sont justes.
                </p>
              } @else {
                <p class="mt-1 text-sm text-nuit-100">Voici les offres qui vous correspondent le mieux aujourd'hui.</p>
              }
            </div>

            <div class="mt-6 flex items-end justify-between">
              <h2 class="font-display text-xl font-semibold">Offres recommandées pour vous</h2>
              <a routerLink="/offres" class="text-sm font-semibold text-menthe-700 hover:underline">Tout voir</a>
            </div>

            @if (recommandees().length === 0) {
              <div class="carte mt-4 p-8 text-center">
                @if ((candidat()?.competences ?? []).length === 0) {
                  <p class="font-display text-lg font-semibold">Ajoutez vos compétences</p>
                  <p class="mt-1 text-sm text-nuit-500">Sans compétences dans votre profil, la plateforme ne peut pas calculer des scores pertinents.</p>
                  <a routerLink="/candidat/profil" class="btn btn-primary mt-5">Renseigner mes compétences</a>
                } @else {
                  <p class="font-display text-lg font-semibold">Aucune nouvelle offre pour le moment</p>
                  <p class="mt-1 text-sm text-nuit-500">Vous avez déjà postulé à toutes les offres disponibles.</p>
                }
              </div>
            } @else {
              <div class="mt-4 grid gap-5 md:grid-cols-2">
                @for (o of recommandees(); track o.id) {
                  <app-offre-carte [offre]="o" />
                }
              </div>
            }
          </section>

          <!-- COLONNE DROITE : CONSEILS -->
          <aside class="space-y-6 lg:col-span-3">
            <div class="carte p-5">
              <h2 class="font-display text-lg font-semibold">Compétences à développer</h2>
              <p class="mt-1 text-xs text-nuit-400">Les plus demandées dans les offres, que vous n'avez pas encore.</p>

              @if (aApprendre().length === 0) {
                <p class="mt-4 text-sm text-nuit-500">Rien à signaler : vous couvrez les compétences demandées.</p>
              } @else {
                <ul class="mt-4 space-y-3">
                  @for (c of aApprendre(); track c.nom) {
                    <li>
                      <div class="flex items-center justify-between text-sm">
                        <span class="font-semibold text-nuit-700">{{ c.nom }}</span>
                        <span class="text-xs text-nuit-400">{{ c.n }} offre{{ c.n > 1 ? 's' : '' }}</span>
                      </div>
                      <div class="mt-1 h-1.5 rounded-full bg-sable-100">
                        <div class="h-1.5 rounded-full bg-menthe-400" [style.width.%]="(c.n / maxDemande()) * 100"></div>
                      </div>
                    </li>
                  }
                </ul>
              }
            </div>

            <div class="carte p-5">
              <div class="flex items-center justify-between">
                <h2 class="font-display text-lg font-semibold">Dernières candidatures</h2>
                <a routerLink="/candidat/candidatures" class="text-xs font-semibold text-menthe-700 hover:underline">Voir tout</a>
              </div>

              @if (dernieres().length === 0) {
                <p class="mt-4 text-sm text-nuit-500">Vous n'avez pas encore postulé.</p>
              } @else {
                <ul class="mt-4 space-y-4">
                  @for (c of dernieres(); track c.id) {
                    <li>
                      <a [routerLink]="['/offres', c.offre_id]" class="block rounded-xl p-2 transition hover:bg-sable-50">
                        <p class="truncate text-sm font-semibold">{{ c.offre?.titre }}</p>
                        <p class="truncate text-xs text-nuit-400">{{ c.offre?.entreprise?.nom_entreprise }} · {{ c.date_candidature | date: 'dd/MM/yyyy' }}</p>
                        <span [class]="'badge mt-1.5 ' + statutClasse(c.statut)">{{ statutLibelle(c.statut) }}</span>
                      </a>
                    </li>
                  }
                </ul>
              }
            </div>
          </aside>
        </div>
      }
    </div>
  `,
})
export class EspaceCandidat {
  private http = inject(HttpClient);
  auth = inject(AuthService);

  statutLibelle = statutLibelle;
  statutClasse = statutClasse;

  candidat = signal<Candidat | null>(null);
  offres = signal<Offre[]>([]);
  candidatures = signal<Candidature[]>([]);
  chargement = signal(true);
  erreur = signal('');

  initiales = computed(() => {
    const u = this.auth.user();
    return ((u?.prenom ?? '').charAt(0) + (u?.nom ?? '').charAt(0)).toUpperCase() || '?';
  });

  completion = computed(() => {
    const c = this.candidat();
    if (!c) return 0;
    let pourcentage = 30;
    if ((c.competences ?? []).length > 0) pourcentage += 40;
    if (c.chemin_cv) pourcentage += 30;
    return pourcentage;
  });

  manquants = computed(() => {
    const c = this.candidat();
    const liste: string[] = [];
    if (!c) return liste;
    if ((c.competences ?? []).length === 0) liste.push('Ajouter vos compétences');
    if (!c.chemin_cv) liste.push('Déposer votre CV (PDF)');
    return liste;
  });

  experienceTexte = computed(() => {
    const n = this.candidat()?.niveau_experience ?? 0;
    if (n === 0) return 'Profil débutant';
    return n + (n > 1 ? " ans d'expérience" : " an d'expérience");
  });

  idsPostules = computed(() => new Set(this.candidatures().map((c) => c.offre_id)));

  recommandees = computed(() => {
    const deja = this.idsPostules();
    return this.offres()
      .filter((o) => !deja.has(o.id))
      .slice(0, 6);
  });

  offresFortes = computed(() => this.offres().filter((o) => (o.score_compatibilite ?? 0) >= 70).length);

  meilleurScore = computed(() =>
    this.offres().reduce((max, o) => Math.max(max, o.score_compatibilite ?? 0), 0),
  );

  dernieres = computed(() => this.candidatures().slice(0, 3));

  aApprendre = computed(() => {
    const possedees = new Set((this.candidat()?.competences ?? []).map((c) => c.id));
    const compteur = new Map<number, { nom: string; n: number }>();

    for (const offre of this.offres()) {
      for (const comp of offre.competences ?? []) {
        if (possedees.has(comp.id)) continue;
        const actuel = compteur.get(comp.id);
        if (actuel) {
          actuel.n++;
        } else {
          compteur.set(comp.id, { nom: comp.nom_competence, n: 1 });
        }
      }
    }
    return [...compteur.values()].sort((a, b) => b.n - a.n).slice(0, 5);
  });

  maxDemande = computed(() => Math.max(1, ...this.aApprendre().map((c) => c.n)));

  constructor() {
    forkJoin({
      profil: this.http.get<Candidat>(`${API_URL}/candidat/profil`),
      offres: this.http.get<Offre[]>(`${API_URL}/offres`),
      candidatures: this.http.get<Candidature[]>(`${API_URL}/candidat/candidatures`),
    }).subscribe({
      next: (r) => {
        this.candidat.set(r.profil);
        this.offres.set(r.offres);
        this.candidatures.set(r.candidatures);
        this.chargement.set(false);
      },
      error: () => {
        this.erreur.set("Impossible de charger votre espace. Vérifiez que l'API est lancée.");
        this.chargement.set(false);
      },
    });
  }
}

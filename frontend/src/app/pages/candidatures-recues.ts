import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { API_URL, STORAGE_URL } from '../config';
import { Candidature, Offre, StatutCandidature } from '../models';
import { EntrepriseNav } from '../components/entreprise-nav';
import { ScoreGauge } from '../components/score-gauge';
import { statutClasse, statutLibelle } from '../utils/statut';

type Filtre = 'toutes' | StatutCandidature;

@Component({
  selector: 'app-candidatures-recues',
  imports: [RouterLink, DatePipe, EntrepriseNav, ScoreGauge],
  template: `
    <app-entreprise-nav />

    <div class="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <a routerLink="/entreprise/offres" class="text-sm font-semibold text-nuit-500 hover:text-menthe-700">← Retour à mes offres</a>

      @if (chargement()) {
        <div class="mt-6 h-72 animate-pulse rounded-2xl bg-sable-100"></div>
      } @else if (erreur()) {
        <div role="alert" class="mt-6 rounded-2xl bg-corail-100 p-6 text-corail-700">{{ erreur() }}</div>
      } @else if (offre(); as o) {
        <div class="mt-4 rounded-3xl bg-[linear-gradient(135deg,#0a1630,#162a4e)] p-7 text-white">
          <p class="text-sm font-semibold uppercase tracking-widest text-menthe-300">Candidatures reçues</p>
          <h1 class="mt-2 text-3xl font-bold">{{ o.titre }}</h1>
          <div class="mt-3 flex flex-wrap items-center gap-2 text-sm">
            <span class="badge bg-menthe-400/20 text-menthe-200">{{ o.type_contrat }}</span>
            <span class="text-nuit-100">{{ experienceTexte(o.experience_requise) }}</span>
            @if (!o.actif) {
              <span class="badge bg-white/15 text-white">Offre clôturée</span>
            }
          </div>
          @if ((o.competences ?? []).length > 0) {
            <div class="mt-4 flex flex-wrap gap-2">
              @for (c of o.competences ?? []; track c.id) {
                <span class="rounded-lg bg-white/10 px-2.5 py-1 text-xs font-medium">{{ c.nom_competence }}</span>
              }
            </div>
          }
        </div>

        @if (message()) {
          <div role="status" class="mt-6 rounded-xl bg-menthe-50 px-4 py-3 text-sm font-semibold text-menthe-800">{{ message() }}</div>
        }
        @if (erreurAction()) {
          <div role="alert" class="mt-6 rounded-xl bg-corail-100 px-4 py-3 text-sm text-corail-700">{{ erreurAction() }}</div>
        }

        <div class="mt-6 flex flex-wrap items-center gap-2">
          @for (f of filtres; track f.valeur) {
            <button type="button" [class]="classeFiltre(f.valeur)" (click)="filtre.set(f.valeur)">
              {{ f.libelle }} ({{ compter(f.valeur) }})
            </button>
          }
        </div>

        @if (affichees().length === 0) {
          <div class="carte mt-6 p-10 text-center">
            <p class="font-display text-xl font-semibold">
              {{ candidatures().length === 0 ? "Aucune candidature pour l'instant" : 'Aucune candidature dans cette catégorie' }}
            </p>
            @if (candidatures().length === 0) {
              <p class="mt-2 text-sm text-nuit-500">Les candidatures apparaîtront ici, classées de la plus compatible à la moins compatible.</p>
            }
          </div>
        } @else {
          <ol class="mt-6 space-y-5">
            @for (c of affichees(); track c.id; let i = $index) {
              <li class="carte p-6">
                <div class="flex flex-wrap items-start gap-5">
                  <div class="flex flex-col items-center gap-2">
                    <span [class]="classeRang(i)">{{ i + 1 }}</span>
                  </div>
                  <app-score-gauge [score]="c.score_compatibilite" [taille]="88" />

                  <div class="min-w-0 flex-1">
                    <div class="flex flex-wrap items-center gap-2">
                      <h2 class="font-display text-xl font-semibold">{{ c.candidat?.user?.prenom }} {{ c.candidat?.user?.nom }}</h2>
                      <span [class]="'badge ' + statutClasse(c.statut)">{{ statutLibelle(c.statut) }}</span>
                    </div>
                    <p class="mt-1 text-sm text-nuit-500">
                      <a [href]="'mailto:' + c.candidat?.user?.email" class="hover:text-menthe-700 hover:underline">{{ c.candidat?.user?.email }}</a>
                      · candidature du {{ c.date_candidature | date: 'dd/MM/yyyy' }}
                    </p>

                    <ul class="mt-4 space-y-1.5 text-sm text-nuit-600">
                      <li><strong>Compétences :</strong> {{ resumeCompetences(c) }}</li>
                      <li><strong>Expérience :</strong> {{ resumeExperience(c) }}</li>
                      <li><strong>Contrat :</strong> {{ resumeContrat(c) }}</li>
                    </ul>

                    @if ((offre()?.competences ?? []).length > 0) {
                      <div class="mt-4 flex flex-wrap gap-2">
                        @for (comp of offre()?.competences ?? []; track comp.id) {
                          <span [class]="classeCompetence(c, comp.id)">{{ possede(c, comp.id) ? '✓' : '○' }} {{ comp.nom_competence }}</span>
                        }
                      </div>
                    }
                  </div>
                </div>

                <div class="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-sable-200 pt-4">
                  <div>
                    @if (c.candidat?.chemin_cv) {
                      <a [href]="lienCv(c)" target="_blank" rel="noopener" class="btn btn-outline !py-2">Télécharger le CV</a>
                    } @else {
                      <span class="text-sm text-nuit-400">CV non fourni</span>
                    }
                  </div>

                  <div class="flex flex-wrap gap-2">
                    @if (c.statut === 'en attente') {
                      <button type="button" class="btn btn-primary !py-2" [disabled]="enCours() === c.id" (click)="changer(c, 'acceptee')">Accepter</button>
                      <button type="button" class="btn btn-danger !py-2" [disabled]="enCours() === c.id" (click)="changer(c, 'refusee')">Refuser</button>
                    } @else if (c.statut === 'acceptee') {
                      <button type="button" class="btn btn-outline !py-2" [disabled]="enCours() === c.id" (click)="changer(c, 'refusee')">Passer en refusée</button>
                    } @else {
                      <button type="button" class="btn btn-outline !py-2" [disabled]="enCours() === c.id" (click)="changer(c, 'acceptee')">Passer en acceptée</button>
                    }
                  </div>
                </div>
              </li>
            }
          </ol>

          <p class="mt-6 rounded-xl bg-sable-100 p-4 text-xs text-nuit-500">
            Le score affiché est celui calculé au moment de la candidature. Les détails ci-dessus reflètent le profil actuel du candidat.
          </p>
        }
      }
    </div>
  `,
})
export class CandidaturesRecues {
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);

  statutLibelle = statutLibelle;
  statutClasse = statutClasse;

  id = Number(this.route.snapshot.paramMap.get('id'));

  filtres: { valeur: Filtre; libelle: string }[] = [
    { valeur: 'toutes', libelle: 'Toutes' },
    { valeur: 'en attente', libelle: 'En attente' },
    { valeur: 'acceptee', libelle: 'Acceptées' },
    { valeur: 'refusee', libelle: 'Refusées' },
  ];

  offre = signal<Offre | null>(null);
  candidatures = signal<Candidature[]>([]);
  chargement = signal(true);
  erreur = signal('');
  filtre = signal<Filtre>('toutes');

  enCours = signal<number | null>(null);
  message = signal('');
  erreurAction = signal('');

  affichees = computed(() => {
    const f = this.filtre();
    return f === 'toutes' ? this.candidatures() : this.candidatures().filter((c) => c.statut === f);
  });

  constructor() {
    forkJoin({
      offres: this.http.get<Offre[]>(`${API_URL}/entreprise/offres`),
      candidatures: this.http.get<Candidature[]>(`${API_URL}/entreprise/offres/${this.id}/candidatures`),
    }).subscribe({
      next: (r) => {
        const o = r.offres.find((x) => x.id === this.id) ?? null;
        if (!o) {
          this.erreur.set("Cette offre n'existe pas ou ne vous appartient pas.");
        } else {
          this.offre.set(o);
          this.candidatures.set(r.candidatures);
        }
        this.chargement.set(false);
      },
      error: (e: HttpErrorResponse) => {
        this.erreur.set(
          e.status === 403 || e.status === 404
            ? "Cette offre n'existe pas ou ne vous appartient pas."
            : "Impossible de charger les candidatures. Vérifiez que l'API est lancée.",
        );
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

  classeRang(i: number): string {
    const base = 'flex h-9 w-9 items-center justify-center rounded-full font-display text-lg font-bold ';
    return i === 0 ? base + 'bg-menthe-400 text-nuit-900' : base + 'bg-sable-100 text-nuit-600';
  }

  experienceTexte(n: number): string {
    if (n === 0) return 'Débutant accepté';
    return n + (n > 1 ? ' ans' : ' an') + " d'expérience min.";
  }

  idsCandidat(c: Candidature): number[] {
    return (c.candidat?.competences ?? []).map((x) => x.id);
  }

  possede(c: Candidature, idCompetence: number): boolean {
    return this.idsCandidat(c).includes(idCompetence);
  }

  classeCompetence(c: Candidature, idCompetence: number): string {
    const base = 'rounded-lg px-2.5 py-1 text-xs font-semibold ';
    return this.possede(c, idCompetence)
      ? base + 'bg-menthe-100 text-menthe-800'
      : base + 'border border-dashed border-sable-300 bg-white text-nuit-400';
  }

  resumeCompetences(c: Candidature): string {
    const requises = this.offre()?.competences ?? [];
    if (requises.length === 0) return "aucune exigée par l'offre";
    const communes = requises.filter((r) => this.possede(c, r.id)).length;
    return `${communes} sur ${requises.length} requise(s)`;
  }

  resumeExperience(c: Candidature): string {
    const n = c.candidat?.niveau_experience ?? 0;
    const demande = this.offre()?.experience_requise ?? 0;
    const texte = n + (n > 1 ? ' ans' : ' an');
    return demande === 0 ? `${texte} (aucune exigée)` : `${texte} pour ${demande} demandé(s)`;
  }

  resumeContrat(c: Candidature): string {
    const recherche = c.candidat?.type_contrat_recherche ?? '—';
    const propose = this.offre()?.type_contrat;
    return recherche === propose ? `${recherche} recherché, correspond à l'offre` : `${recherche} recherché, l'offre est un ${propose}`;
  }

  lienCv(c: Candidature): string {
    return `${STORAGE_URL}/${c.candidat?.chemin_cv}`;
  }

  changer(c: Candidature, statut: 'acceptee' | 'refusee'): void {
    this.message.set('');
    this.erreurAction.set('');
    this.enCours.set(c.id);

    this.http.patch<Candidature>(`${API_URL}/entreprise/candidatures/${c.id}/statut`, { statut }).subscribe({
      next: () => {
        this.enCours.set(null);
        this.candidatures.update((liste) => liste.map((x) => (x.id === c.id ? { ...x, statut } : x)));
        this.message.set(statut === 'acceptee' ? 'Candidature acceptée.' : 'Candidature refusée.');
      },
      error: (e: HttpErrorResponse) => {
        this.enCours.set(null);
        this.erreurAction.set(e.error?.message ?? 'Le changement de statut a échoué.');
      },
    });
  }
}

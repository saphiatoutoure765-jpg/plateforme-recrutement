import { Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { API_URL } from '../config';
import { Offre, TypeContrat } from '../models';
import { AuthService } from '../services/auth.service';
import { ScoreGauge } from '../components/score-gauge';
import { OffreCarte } from '../components/offre-carte';
import { calculerScoreDetail, niveauScore } from '../utils/score';

@Component({
  selector: 'app-accueil',
  imports: [RouterLink, FormsModule, DecimalPipe, ScoreGauge, OffreCarte],
  template: `
    <!-- HERO -->
    <section
      class="relative isolate overflow-hidden bg-[linear-gradient(135deg,#060d20_0%,#0a1630_45%,#162a4e_100%)] text-white"
    >
      <div class="pointer-events-none absolute -right-32 -top-24 h-[28rem] w-[28rem] rounded-full bg-menthe-400/25 blur-3xl"></div>
      <div class="pointer-events-none absolute -bottom-40 -left-24 h-96 w-96 rounded-full bg-sable-300/15 blur-3xl"></div>

      <div class="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:py-28">
        <div class="animate-apparition">
          <span class="badge border border-menthe-300/40 bg-menthe-400/10 text-menthe-200">
            Recrutement intelligent · score de compatibilité
          </span>
          <h1 class="mt-6 text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
            Le bon talent, le bon poste,
            <span class="text-menthe-300">au bon score.</span>
          </h1>
          <p class="mt-6 max-w-xl text-lg leading-relaxed text-nuit-100">
            Chaque offre affiche votre taux de compatibilité, calculé automatiquement à partir de vos
            compétences, de votre expérience et du type de contrat recherché. Les entreprises reçoivent
            leurs candidatures déjà classées.
          </p>
          <div class="mt-8 flex flex-wrap gap-3">
            <a routerLink="/offres" class="btn btn-primary">Découvrir les offres</a>
            @if (auth.estConnecte()) {
              <a [routerLink]="auth.espacePersonnel()" class="btn btn-outline-light">Mon espace</a>
            } @else {
              <a routerLink="/inscription" class="btn btn-outline-light">Créer mon compte</a>
            }
          </div>
          <dl class="mt-12 grid max-w-md grid-cols-3 gap-6">
            <div>
              <dt class="font-display text-3xl font-bold text-menthe-300">3</dt>
              <dd class="text-xs text-nuit-200">critères pondérés</dd>
            </div>
            <div>
              <dt class="font-display text-3xl font-bold text-menthe-300">100 %</dt>
              <dd class="text-xs text-nuit-200">calcul automatique</dd>
            </div>
            <div>
              <dt class="font-display text-3xl font-bold text-menthe-300">0</dt>
              <dd class="text-xs text-nuit-200">tri manuel</dd>
            </div>
          </dl>
        </div>

        <div class="relative mx-auto w-full max-w-md animate-flotte">
          <div class="rounded-3xl border border-white/15 bg-white/10 p-6 shadow-2xl backdrop-blur-xl">
            <div class="flex items-start justify-between gap-4">
              <div>
                <span class="badge bg-menthe-400/20 text-menthe-200">CDI</span>
                <h3 class="mt-3 text-xl font-semibold">Développeur Laravel</h3>
                <p class="text-sm text-nuit-200">Entreprise exemple · Dakar</p>
              </div>
              <app-score-gauge [score]="90" [taille]="96" [sombre]="true" />
            </div>
            <div class="mt-6 space-y-3 text-sm">
              <div>
                <div class="flex justify-between text-nuit-100"><span>Compétences</span><span>80 %</span></div>
                <div class="mt-1 h-2 rounded-full bg-white/10"><div class="h-2 w-[80%] rounded-full bg-menthe-400"></div></div>
              </div>
              <div>
                <div class="flex justify-between text-nuit-100"><span>Expérience</span><span>100 %</span></div>
                <div class="mt-1 h-2 rounded-full bg-white/10"><div class="h-2 w-full rounded-full bg-menthe-300"></div></div>
              </div>
              <div>
                <div class="flex justify-between text-nuit-100"><span>Contrat</span><span>100 %</span></div>
                <div class="mt-1 h-2 rounded-full bg-white/10"><div class="h-2 w-full rounded-full bg-sable-300"></div></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- COMMENT CA MARCHE -->
    <section class="mx-auto max-w-7xl px-4 py-20 sm:px-6">
      <p class="text-sm font-semibold uppercase tracking-widest text-menthe-600">Comment ça marche</p>
      <h2 class="titre-section mt-2">Trois étapes, zéro hasard</h2>
      <div class="mt-10 grid gap-6 md:grid-cols-3">
        @for (e of etapes; track e.numero) {
          <article class="carte p-7 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-nuit-900/10">
            <span class="font-display text-5xl font-bold text-menthe-400">{{ e.numero }}</span>
            <h3 class="mt-4 text-xl font-semibold">{{ e.titre }}</h3>
            <p class="mt-2 leading-relaxed text-nuit-500">{{ e.texte }}</p>
          </article>
        }
      </div>
    </section>

    <!-- LE SCORE EN 3 CRITERES -->
    <section class="bg-nuit-900 py-20 text-white">
      <div class="mx-auto max-w-7xl px-4 sm:px-6">
        <p class="text-sm font-semibold uppercase tracking-widest text-menthe-300">L'algorithme</p>
        <h2 class="mt-2 font-display text-3xl font-bold sm:text-4xl">Un score en trois critères pondérés</h2>
        <div class="mt-10 grid gap-6 md:grid-cols-3">
          @for (p of piliers; track p.nom) {
            <article class="rounded-2xl border border-white/10 bg-white/5 p-7">
              <span class="font-display text-5xl font-bold text-menthe-300">{{ p.poids }}</span>
              <h3 class="mt-4 text-xl font-semibold">{{ p.nom }}</h3>
              <p class="mt-2 leading-relaxed text-nuit-100">{{ p.texte }}</p>
            </article>
          }
        </div>
        <p class="mt-8 rounded-2xl border border-menthe-300/30 bg-menthe-400/10 p-5 text-center font-display text-lg text-menthe-100">
          Score final = compétences × 0,50 + expérience × 0,30 + contrat × 0,20
        </p>
        <p class="mt-3 text-center text-sm text-nuit-200">
          Quand une offre n'exige rien sur un critère, tout candidat obtient 100 % sur ce critère.
        </p>
      </div>
    </section>

    <!-- SIMULATEUR -->
    <section class="mx-auto max-w-7xl px-4 py-20 sm:px-6" id="simulateur">
      <p class="text-sm font-semibold uppercase tracking-widest text-menthe-600">Simulateur</p>
      <h2 class="titre-section mt-2">Calculez un score en direct</h2>
      <p class="mt-3 max-w-2xl text-nuit-500">
        Déplacez les curseurs : le score se recalcule instantanément, exactement comme le fait la plateforme.
      </p>

      <div class="mt-10 grid gap-8 lg:grid-cols-5">
        <div class="carte p-7 lg:col-span-3">
          <div class="flex flex-wrap gap-2">
            <button type="button" class="btn btn-outline !py-2" (click)="appliquer('ideal')">Profil idéal</button>
            <button type="button" class="btn btn-outline !py-2" (click)="appliquer('debutant')">Profil débutant</button>
            <button type="button" class="btn btn-outline !py-2" (click)="appliquer('libre')">Offre sans exigences</button>
          </div>

          <div class="mt-8 space-y-7">
            <div>
              <div class="flex items-center justify-between">
                <label class="text-sm font-semibold text-nuit-700">Compétences demandées par l'offre</label>
                <span class="badge bg-menthe-100 text-menthe-800">{{ requises() }}</span>
              </div>
              <input type="range" min="0" max="10" step="1" [(ngModel)]="requises" class="mt-3 w-full accent-menthe-500" />
            </div>

            <div>
              <div class="flex items-center justify-between">
                <label class="text-sm font-semibold text-nuit-700">Compétences du candidat parmi celles demandées</label>
                <span class="badge bg-menthe-100 text-menthe-800">{{ communes() }} / {{ requises() }}</span>
              </div>
              <input type="range" min="0" [max]="requises()" step="1" [(ngModel)]="possedees" class="mt-3 w-full accent-menthe-500" />
            </div>

            <div class="grid gap-7 sm:grid-cols-2">
              <div>
                <div class="flex items-center justify-between">
                  <label class="text-sm font-semibold text-nuit-700">Expérience demandée</label>
                  <span class="badge bg-nuit-100 text-nuit-700">{{ expRequise() }} an(s)</span>
                </div>
                <input type="range" min="0" max="10" step="1" [(ngModel)]="expRequise" class="mt-3 w-full accent-nuit-500" />
              </div>
              <div>
                <div class="flex items-center justify-between">
                  <label class="text-sm font-semibold text-nuit-700">Expérience du candidat</label>
                  <span class="badge bg-nuit-100 text-nuit-700">{{ expCandidat() }} an(s)</span>
                </div>
                <input type="range" min="0" max="15" step="1" [(ngModel)]="expCandidat" class="mt-3 w-full accent-nuit-500" />
              </div>
            </div>

            <div class="grid gap-5 sm:grid-cols-2">
              <div>
                <label class="etiquette">Contrat proposé par l'offre</label>
                <select class="champ" [(ngModel)]="contratOffre">
                  @for (c of contrats; track c) {
                    <option [value]="c">{{ c }}</option>
                  }
                </select>
              </div>
              <div>
                <label class="etiquette">Contrat recherché par le candidat</label>
                <select class="champ" [(ngModel)]="contratCandidat">
                  @for (c of contrats; track c) {
                    <option [value]="c">{{ c }}</option>
                  }
                </select>
              </div>
            </div>
          </div>
        </div>

        <div class="flex flex-col items-center rounded-3xl bg-nuit-900 p-8 text-white shadow-xl shadow-nuit-900/20 lg:col-span-2">
          <app-score-gauge [score]="detail().total" [taille]="190" [sombre]="true" />
          <p class="mt-4 font-display text-xl font-semibold">{{ verdict().titre }}</p>
          <p class="mt-1 text-center text-sm text-nuit-100">{{ verdict().texte }}</p>

          <div class="mt-7 w-full space-y-4">
            @for (b of barres(); track b.nom) {
              <div>
                <div class="flex items-center justify-between text-sm">
                  <span class="text-nuit-100">{{ b.nom }} <span class="text-nuit-300">({{ b.poids }} %)</span></span>
                  <span class="font-semibold">{{ b.valeur | number: '1.0-0' }} % · +{{ b.points | number: '1.0-1' }} pts</span>
                </div>
                <div class="mt-1.5 h-2.5 rounded-full bg-white/10">
                  <div
                    class="h-2.5 rounded-full transition-all duration-500"
                    [class]="b.couleur"
                    [style.width.%]="b.valeur"
                  ></div>
                </div>
              </div>
            }
          </div>

          <p class="mt-7 w-full rounded-xl bg-white/5 p-3 text-center text-xs text-nuit-100">
            Score = {{ detail().competences | number: '1.0-0' }} × 0,50 + {{ detail().experience | number: '1.0-0' }} × 0,30
            + {{ detail().contrat | number: '1.0-0' }} × 0,20 = <strong class="text-menthe-300">{{ detail().total | number: '1.0-2' }} %</strong>
          </p>
        </div>
      </div>
    </section>

    <!-- DERNIERES OFFRES -->
    @if (offres().length > 0) {
      <section class="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        <div class="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p class="text-sm font-semibold uppercase tracking-widest text-menthe-600">À la une</p>
            <h2 class="titre-section mt-2">Dernières offres</h2>
          </div>
          <a routerLink="/offres" class="btn btn-outline">Voir toutes les offres</a>
        </div>
        <div class="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          @for (o of offres(); track o.id) {
            <app-offre-carte [offre]="o" />
          }
        </div>
      </section>
    }

    <!-- APPEL A L'ACTION -->
    <section class="bg-[linear-gradient(135deg,#0a1630,#162a4e)] py-16 text-white">
      <div class="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-6 px-4 sm:px-6">
        <div>
          <h2 class="font-display text-3xl font-bold">Prêt à trouver votre prochain poste ?</h2>
          <p class="mt-2 text-nuit-100">Candidats et entreprises : créez votre compte en moins d'une minute.</p>
        </div>
        @if (auth.estConnecte()) {
          <a [routerLink]="auth.espacePersonnel()" class="btn btn-primary">Accéder à mon espace</a>
        } @else {
          <a routerLink="/inscription" class="btn btn-primary">Créer mon compte</a>
        }
      </div>
    </section>
  `,
})
export class Accueil {
  private http = inject(HttpClient);
  auth = inject(AuthService);

  contrats: TypeContrat[] = ['CDI', 'CDD', 'Stage', 'Freelance'];

  etapes = [
    {
      numero: '01',
      titre: 'Créez votre profil',
      texte: "Renseignez vos compétences, votre expérience et le type de contrat recherché. Déposez votre CV en PDF.",
    },
    {
      numero: '02',
      titre: 'Découvrez votre score',
      texte: "Sur chaque offre, un pourcentage de compatibilité vous indique en un coup d'œil vos meilleures opportunités.",
    },
    {
      numero: '03',
      titre: 'Postulez, suivez, soyez classé',
      texte: "Votre candidature arrive chez l'entreprise déjà classée selon votre score. Suivez son état depuis votre espace.",
    },
  ];

  piliers = [
    { poids: '50 %', nom: 'Compétences', texte: "La part des compétences demandées par l'offre que vous maîtrisez." },
    { poids: '30 %', nom: 'Expérience', texte: "Votre expérience comparée à celle demandée, plafonnée à 100 %." },
    { poids: '20 %', nom: 'Type de contrat', texte: "CDI, CDD, stage ou freelance : tout ou rien selon la correspondance." },
  ];

  // Simulateur
  requises = signal(4);
  possedees = signal(3);
  expRequise = signal(2);
  expCandidat = signal(1);
  contratOffre = signal<TypeContrat>('CDI');
  contratCandidat = signal<TypeContrat>('CDI');

  communes = computed(() => Math.min(Number(this.possedees()) || 0, Number(this.requises()) || 0));

  detail = computed(() =>
    calculerScoreDetail(
      Number(this.requises()) || 0,
      this.communes(),
      Number(this.expRequise()) || 0,
      Number(this.expCandidat()) || 0,
      this.contratOffre() === this.contratCandidat(),
    ),
  );

  barres = computed(() => {
    const d = this.detail();
    return [
      { nom: 'Compétences', poids: 50, valeur: d.competences, points: d.competences * 0.5, couleur: 'bg-menthe-400' },
      { nom: 'Expérience', poids: 30, valeur: d.experience, points: d.experience * 0.3, couleur: 'bg-nuit-300' },
      { nom: 'Contrat', poids: 20, valeur: d.contrat, points: d.contrat * 0.2, couleur: 'bg-sable-300' },
    ];
  });

  verdict = computed(() => {
    const niveau = niveauScore(this.detail().total);
    if (niveau === 'haut') {
      return { titre: 'Excellent match', texte: 'Ce profil serait classé parmi les premiers par l\'entreprise.' };
    }
    if (niveau === 'moyen') {
      return { titre: 'Bon potentiel', texte: 'Quelques compétences ou années d\'expérience à acquérir.' };
    }
    return { titre: 'Compatibilité faible', texte: 'L\'offre demande nettement plus que ce profil.' };
  });

  offres = signal<Offre[]>([]);

  constructor() {
    this.http.get<Offre[]>(`${API_URL}/offres`).subscribe({
      next: (liste) => this.offres.set(liste.slice(0, 3)),
      error: () => this.offres.set([]),
    });
  }

  appliquer(profil: 'ideal' | 'debutant' | 'libre'): void {
    if (profil === 'ideal') {
      this.requises.set(4);
      this.possedees.set(4);
      this.expRequise.set(2);
      this.expCandidat.set(3);
      this.contratOffre.set('CDI');
      this.contratCandidat.set('CDI');
    } else if (profil === 'debutant') {
      this.requises.set(5);
      this.possedees.set(1);
      this.expRequise.set(3);
      this.expCandidat.set(0);
      this.contratOffre.set('CDI');
      this.contratCandidat.set('Stage');
    } else {
      this.requises.set(0);
      this.possedees.set(0);
      this.expRequise.set(0);
      this.expCandidat.set(0);
      this.contratOffre.set('CDI');
      this.contratCandidat.set('CDI');
    }
  }
}

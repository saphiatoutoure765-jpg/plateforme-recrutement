import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { API_URL } from '../config';
import { Offre } from '../models';
import { EntrepriseNav } from '../components/entreprise-nav';

type Filtre = 'toutes' | 'actives' | 'cloturees';

interface Confirmation {
  action: 'cloturer' | 'supprimer';
  offre: Offre;
}

function normaliser(texte: string): string {
  return texte.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

@Component({
  selector: 'app-mes-offres',
  imports: [RouterLink, DatePipe, FormsModule, EntrepriseNav],
  template: `
    <app-entreprise-nav />

    <div class="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold">Mes offres</h1>
          <p class="mt-1 text-nuit-500">Gérez vos offres et consultez les candidatures reçues.</p>
        </div>
        <a routerLink="/entreprise/offres/nouvelle" class="btn btn-primary">+ Publier une offre</a>
      </div>

      @if (message()) {
        <div role="status" class="mt-6 rounded-xl bg-menthe-50 px-4 py-3 text-sm font-semibold text-menthe-800">{{ message() }}</div>
      }
      @if (erreur()) {
        <div role="alert" class="mt-6 rounded-xl bg-corail-100 px-4 py-3 text-sm text-corail-700">{{ erreur() }}</div>
      }

      @if (chargement()) {
        <div class="mt-8 space-y-4">
          @for (i of [1, 2, 3]; track i) {
            <div class="h-32 animate-pulse rounded-2xl bg-sable-100"></div>
          }
        </div>
      } @else {
        <div class="mt-8 flex flex-wrap items-center gap-3">
          <input type="search" class="champ max-w-xs" placeholder="Rechercher une offre…" [(ngModel)]="recherche" />
          @for (f of filtres; track f.valeur) {
            <button type="button" [class]="classeFiltre(f.valeur)" (click)="filtre.set(f.valeur)">
              {{ f.libelle }} ({{ compter(f.valeur) }})
            </button>
          }
        </div>

        @if (affichees().length === 0) {
          <div class="carte mt-6 p-10 text-center">
            @if (offres().length === 0) {
              <p class="font-display text-xl font-semibold">Vous n'avez pas encore publié d'offre</p>
              <a routerLink="/entreprise/offres/nouvelle" class="btn btn-primary mt-6">Publier ma première offre</a>
            } @else {
              <p class="font-display text-xl font-semibold">Aucune offre ne correspond</p>
            }
          </div>
        } @else {
          <ul class="mt-6 space-y-4">
            @for (o of affichees(); track o.id) {
              <li class="carte p-5">
                <div class="flex flex-wrap items-start justify-between gap-4">
                  <div class="min-w-0 flex-1">
                    <div class="flex flex-wrap items-center gap-2">
                      <h2 class="font-display text-xl font-semibold">{{ o.titre }}</h2>
                      @if (o.actif) {
                        <span class="badge bg-menthe-100 text-menthe-800">Active</span>
                      } @else {
                        <span class="badge bg-sable-200 text-nuit-600">Clôturée</span>
                      }
                    </div>
                    <p class="mt-1 text-sm text-nuit-500">
                      {{ o.type_contrat }} · {{ experienceTexte(o.experience_requise) }} · publiée le {{ o.date_publication | date: 'dd/MM/yyyy' }}
                    </p>
                    <div class="mt-3 flex flex-wrap gap-2">
                      @for (c of o.competences ?? []; track c.id) {
                        <span class="rounded-lg bg-sable-100 px-2.5 py-1 text-xs font-medium text-nuit-600">{{ c.nom_competence }}</span>
                      } @empty {
                        <span class="text-xs text-nuit-400">Aucune compétence exigée</span>
                      }
                    </div>
                  </div>

                  <a
                    [routerLink]="['/entreprise/offres', o.id, 'candidatures']"
                    class="rounded-2xl bg-nuit-900 px-6 py-4 text-center text-white transition hover:bg-nuit-700"
                  >
                    <span class="block font-display text-3xl font-bold text-menthe-300">{{ o.candidatures_count ?? 0 }}</span>
                    <span class="text-xs">candidature(s)</span>
                  </a>
                </div>

                <div class="mt-4 flex flex-wrap gap-2 border-t border-sable-200 pt-4">
                  <a [routerLink]="['/entreprise/offres', o.id, 'candidatures']" class="btn btn-dark !py-2">Voir les candidatures</a>
                  <a [routerLink]="['/entreprise/offres', o.id, 'modifier']" class="btn btn-outline !py-2">Modifier</a>
                  @if (o.actif) {
                    <button type="button" class="btn btn-outline !py-2" (click)="demander('cloturer', o)">Clôturer</button>
                  }
                  <button type="button" class="btn btn-danger !py-2" (click)="demander('supprimer', o)">Supprimer</button>
                </div>
              </li>
            }
          </ul>
        }
      }
    </div>

    <!-- CONFIRMATION -->
    @if (aConfirmer(); as conf) {
      <div class="fixed inset-0 z-[60] flex items-center justify-center bg-nuit-950/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
        <div class="carte w-full max-w-md p-7">
          <h2 class="text-xl font-semibold">
            {{ conf.action === 'cloturer' ? 'Clôturer cette offre ?' : 'Supprimer cette offre ?' }}
          </h2>
          <p class="mt-3 text-sm text-nuit-600">
            « {{ conf.offre.titre }} »
          </p>
          <p class="mt-2 text-sm text-nuit-500">
            @if (conf.action === 'cloturer') {
              Elle ne sera plus visible des candidats et on ne pourra plus y postuler. Les candidatures déjà reçues sont conservées.
            } @else {
              Cette action est définitive : l'offre et toutes ses candidatures seront supprimées.
            }
          </p>
          <div class="mt-6 flex justify-end gap-3">
            <button type="button" class="btn btn-outline !py-2" [disabled]="enCours()" (click)="annuler()">Annuler</button>
            <button
              type="button"
              [class]="conf.action === 'supprimer' ? 'btn btn-danger !py-2' : 'btn btn-dark !py-2'"
              [disabled]="enCours()"
              (click)="confirmer()"
            >{{ enCours() ? 'Patientez…' : (conf.action === 'cloturer' ? 'Clôturer' : 'Supprimer') }}</button>
          </div>
        </div>
      </div>
    }
  `,
})
export class MesOffres {
  private http = inject(HttpClient);

  filtres: { valeur: Filtre; libelle: string }[] = [
    { valeur: 'toutes', libelle: 'Toutes' },
    { valeur: 'actives', libelle: 'Actives' },
    { valeur: 'cloturees', libelle: 'Clôturées' },
  ];

  offres = signal<Offre[]>([]);
  chargement = signal(true);
  erreur = signal('');
  message = signal('');

  recherche = signal('');
  filtre = signal<Filtre>('toutes');

  aConfirmer = signal<Confirmation | null>(null);
  enCours = signal(false);

  affichees = computed(() => {
    const terme = normaliser(this.recherche().trim());
    const f = this.filtre();
    return this.offres().filter((o) => {
      if (f === 'actives' && !o.actif) return false;
      if (f === 'cloturees' && o.actif) return false;
      return !terme || normaliser(o.titre).includes(terme);
    });
  });

  constructor() {
    this.http.get<Offre[]>(`${API_URL}/entreprise/offres`).subscribe({
      next: (liste) => {
        this.offres.set(liste);
        this.chargement.set(false);
      },
      error: () => {
        this.erreur.set("Impossible de charger vos offres. Vérifiez que l'API est lancée.");
        this.chargement.set(false);
      },
    });
  }

  compter(f: Filtre): number {
    const liste = this.offres();
    if (f === 'actives') return liste.filter((o) => o.actif).length;
    if (f === 'cloturees') return liste.filter((o) => !o.actif).length;
    return liste.length;
  }

  classeFiltre(f: Filtre): string {
    const base = 'rounded-full border px-4 py-2 text-sm font-semibold transition ';
    return this.filtre() === f
      ? base + 'border-nuit-900 bg-nuit-900 text-sable-50'
      : base + 'border-sable-300 bg-white text-nuit-600 hover:border-menthe-300';
  }

  experienceTexte(n: number): string {
    if (n === 0) return 'débutant accepté';
    return n + (n > 1 ? ' ans' : ' an') + " d'expérience min.";
  }

  demander(action: 'cloturer' | 'supprimer', offre: Offre): void {
    this.message.set('');
    this.erreur.set('');
    this.aConfirmer.set({ action, offre });
  }

  annuler(): void {
    this.aConfirmer.set(null);
  }

  confirmer(): void {
    const conf = this.aConfirmer();
    if (!conf) return;

    this.enCours.set(true);
    const id = conf.offre.id;

    if (conf.action === 'cloturer') {
      this.http.patch<Offre>(`${API_URL}/entreprise/offres/${id}/cloturer`, {}).subscribe({
        next: () => {
          this.offres.update((liste) => liste.map((o) => (o.id === id ? { ...o, actif: false } : o)));
          this.terminer('Offre clôturée.');
        },
        error: (e: HttpErrorResponse) => this.echec(e),
      });
    } else {
      this.http.delete(`${API_URL}/entreprise/offres/${id}`).subscribe({
        next: () => {
          this.offres.update((liste) => liste.filter((o) => o.id !== id));
          this.terminer('Offre supprimée.');
        },
        error: (e: HttpErrorResponse) => this.echec(e),
      });
    }
  }

  private terminer(message: string): void {
    this.enCours.set(false);
    this.aConfirmer.set(null);
    this.message.set(message);
  }

  private echec(e: HttpErrorResponse): void {
    this.enCours.set(false);
    this.aConfirmer.set(null);
    this.erreur.set(e.error?.message ?? "L'opération a échoué.");
  }
}

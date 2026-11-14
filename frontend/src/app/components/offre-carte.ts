import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Offre } from '../models';
import { ScoreGauge } from './score-gauge';

const BADGES_CONTRAT: Record<string, string> = {
  CDI: 'bg-menthe-100 text-menthe-800',
  CDD: 'bg-nuit-100 text-nuit-700',
  Stage: 'bg-sable-200 text-sable-600',
  Freelance: 'bg-ambre-100 text-ambre-700',
};

@Component({
  selector: 'app-offre-carte',
  imports: [RouterLink, ScoreGauge],
  template: `
    <a
      [routerLink]="['/offres', offre().id]"
      class="carte group flex h-full flex-col gap-4 p-5 transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-nuit-900/10"
    >
      <div class="flex items-start justify-between gap-3">
        <div class="flex items-center gap-3">
          <span
            class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-nuit-900 font-display text-lg font-bold text-menthe-300"
          >{{ initiale() }}</span>
          <div>
            <p class="text-sm font-semibold text-nuit-700">{{ offre().entreprise?.nom_entreprise }}</p>
            <p class="text-xs text-nuit-400">{{ offre().entreprise?.secteur }}</p>
          </div>
        </div>
        @if (offre().score_compatibilite !== undefined) {
          <app-score-gauge [score]="offre().score_compatibilite ?? 0" [taille]="64" />
        }
      </div>

      <h3 class="font-display text-xl font-semibold text-nuit-900 transition group-hover:text-menthe-700">
        {{ offre().titre }}
      </h3>

      <div class="flex flex-wrap items-center gap-2">
        <span [class]="'badge ' + badgeContrat()">{{ offre().type_contrat }}</span>
        <span class="text-xs text-nuit-400">{{ experience() }}</span>
      </div>

      <div class="mt-auto flex flex-wrap gap-2">
        @for (c of competencesVisibles(); track c.id) {
          <span class="rounded-lg bg-sable-100 px-2.5 py-1 text-xs font-medium text-nuit-600">{{ c.nom_competence }}</span>
        }
        @if (reste() > 0) {
          <span class="rounded-lg bg-sable-100 px-2.5 py-1 text-xs font-medium text-nuit-400">+{{ reste() }}</span>
        }
      </div>
    </a>
  `,
})
export class OffreCarte {
  offre = input.required<Offre>();

  initiale = computed(() => (this.offre().entreprise?.nom_entreprise ?? '?').charAt(0).toUpperCase());
  badgeContrat = computed(() => BADGES_CONTRAT[this.offre().type_contrat] ?? 'bg-sable-100 text-nuit-600');
  competencesVisibles = computed(() => (this.offre().competences ?? []).slice(0, 4));
  reste = computed(() => Math.max(0, (this.offre().competences ?? []).length - 4));
  experience = computed(() => {
    const n = this.offre().experience_requise;
    if (n === 0) return 'Débutant accepté';
    return n + (n > 1 ? ' ans' : ' an') + " d'expérience min.";
  });
}

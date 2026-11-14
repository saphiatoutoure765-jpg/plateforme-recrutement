import { Component, computed, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { COULEURS_SCORE, niveauScore } from '../utils/score';

@Component({
  selector: 'app-score-gauge',
  imports: [DecimalPipe],
  template: `
    <svg
      [attr.width]="taille()"
      [attr.height]="taille()"
      viewBox="0 0 120 120"
      role="img"
      [attr.aria-label]="'Compatibilité ' + borne() + ' pour cent'"
    >
      <circle
        cx="60"
        cy="60"
        r="52"
        fill="none"
        stroke="currentColor"
        stroke-width="10"
        [class]="sombre() ? 'text-white/15' : 'text-sable-200'"
      />
      <circle
        cx="60"
        cy="60"
        r="52"
        fill="none"
        stroke-width="10"
        stroke-linecap="round"
        transform="rotate(-90 60 60)"
        [attr.stroke]="couleur()"
        [attr.stroke-dasharray]="circonference"
        [attr.stroke-dashoffset]="decalage()"
        style="transition: stroke-dashoffset 0.8s ease, stroke 0.4s ease"
      />
      <text
        x="60"
        y="69"
        text-anchor="middle"
        style="font-size: 30px; font-weight: 700"
        [class]="sombre() ? 'fill-white font-display' : 'fill-nuit-900 font-display'"
      >{{ borne() | number: '1.0-0' }}%</text>
    </svg>
  `,
})
export class ScoreGauge {
  score = input.required<number>();
  taille = input(120);
  sombre = input(false);

  circonference = 2 * Math.PI * 52;

  borne = computed(() => Math.max(0, Math.min(100, this.score())));
  decalage = computed(() => this.circonference * (1 - this.borne() / 100));
  couleur = computed(() => COULEURS_SCORE[niveauScore(this.borne())]);
}

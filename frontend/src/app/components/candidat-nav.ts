import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-candidat-nav',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="border-b border-sable-200 bg-white">
      <div class="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 sm:px-6">
        @for (l of liens; track l.chemin) {
          <a
            [routerLink]="l.chemin"
            routerLinkActive="border-menthe-500 text-nuit-900"
            [routerLinkActiveOptions]="{ exact: true }"
            class="whitespace-nowrap border-b-2 border-transparent px-4 py-4 text-sm font-semibold text-nuit-400 transition hover:text-nuit-800"
          >{{ l.libelle }}</a>
        }
      </div>
    </nav>
  `,
})
export class CandidatNav {
  liens = [
    { chemin: '/candidat', libelle: 'Tableau de bord' },
    { chemin: '/candidat/profil', libelle: 'Mon profil' },
    { chemin: '/candidat/candidatures', libelle: 'Mes candidatures' },
    { chemin: '/offres', libelle: 'Toutes les offres' },
  ];
}

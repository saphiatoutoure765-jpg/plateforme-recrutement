import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { API_URL } from '../config';
import { Entreprise } from '../models';
import { EntrepriseNav } from '../components/entreprise-nav';

@Component({
  selector: 'app-profil-entreprise',
  imports: [FormsModule, EntrepriseNav],
  template: `
    <app-entreprise-nav />

    <div class="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 class="text-3xl font-bold">Mon entreprise</h1>
      <p class="mt-1 text-nuit-500">Ces informations s'affichent sur vos offres.</p>

      @if (chargement()) {
        <div class="mt-8 h-72 animate-pulse rounded-2xl bg-sable-100"></div>
      } @else {
        <form class="carte mt-8 space-y-5 p-6" (ngSubmit)="enregistrer()">
          @if (message()) {
            <div role="status" class="rounded-xl bg-menthe-50 px-4 py-3 text-sm font-semibold text-menthe-800">{{ message() }}</div>
          }
          @if (erreur()) {
            <div role="alert" class="rounded-xl bg-corail-100 px-4 py-3 text-sm text-corail-700">{{ erreur() }}</div>
          }

          <div>
            <label class="etiquette" for="nom">Nom de l'entreprise</label>
            <input id="nom" name="nom" class="champ" [(ngModel)]="nom" required />
          </div>
          <div>
            <label class="etiquette" for="secteur">Secteur d'activité</label>
            <input id="secteur" name="secteur" class="champ" placeholder="Informatique, banque, commerce…" [(ngModel)]="secteur" />
          </div>
          <div>
            <label class="etiquette" for="description">Description</label>
            <textarea id="description" name="description" rows="5" class="champ" placeholder="Présentez votre entreprise aux candidats…" [(ngModel)]="description"></textarea>
          </div>

          <button type="submit" class="btn btn-dark" [disabled]="enregistrement() || nom().trim() === ''">
            {{ enregistrement() ? 'Enregistrement…' : 'Enregistrer' }}
          </button>
        </form>
      }
    </div>
  `,
})
export class ProfilEntreprise {
  private http = inject(HttpClient);

  chargement = signal(true);
  enregistrement = signal(false);
  message = signal('');
  erreur = signal('');

  nom = signal('');
  secteur = signal('');
  description = signal('');

  constructor() {
    this.http.get<Entreprise>(`${API_URL}/entreprise/profil`).subscribe({
      next: (e) => {
        this.nom.set(e.nom_entreprise);
        this.secteur.set(e.secteur ?? '');
        this.description.set(e.description ?? '');
        this.chargement.set(false);
      },
      error: () => {
        this.erreur.set("Impossible de charger le profil. Vérifiez que l'API est lancée.");
        this.chargement.set(false);
      },
    });
  }

  enregistrer(): void {
    this.message.set('');
    this.erreur.set('');
    this.enregistrement.set(true);

    this.http
      .put<Entreprise>(`${API_URL}/entreprise/profil`, {
        nom_entreprise: this.nom().trim(),
        secteur: this.secteur().trim() || null,
        description: this.description().trim() || null,
      })
      .subscribe({
        next: () => {
          this.enregistrement.set(false);
          this.message.set('Informations enregistrées.');
        },
        error: (e: HttpErrorResponse) => {
          this.enregistrement.set(false);
          this.erreur.set(e.status === 422 ? 'Veuillez vérifier les champs.' : "L'enregistrement a échoué.");
        },
      });
  }
}

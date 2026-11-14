import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { API_URL } from '../config';
import { User } from '../models';

interface ReponseAuth {
  user: User;
  token: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private utilisateur = signal<User | null>(this.lireUtilisateur());

  user = this.utilisateur.asReadonly();
  estConnecte = computed(() => this.utilisateur() !== null);
  role = computed(() => this.utilisateur()?.role ?? null);

  inscription(donnees: Record<string, unknown>): Observable<ReponseAuth> {
    return this.http
      .post<ReponseAuth>(`${API_URL}/register`, donnees)
      .pipe(tap((reponse) => this.enregistrer(reponse)));
  }

  connexion(email: string, password: string): Observable<ReponseAuth> {
    return this.http
      .post<ReponseAuth>(`${API_URL}/login`, { email, password })
      .pipe(tap((reponse) => this.enregistrer(reponse)));
  }

  deconnexion(): void {
    this.http.post(`${API_URL}/logout`, {}).subscribe({ error: () => {} });
    this.vider();
    this.router.navigate(['/']);
  }

  // Appelée quand l'API répond 401 alors qu'un jeton était enregistré.
  expirerSession(): void {
    if (!this.estConnecte()) return;
    this.vider();
    this.router.navigate(['/connexion'], { queryParams: { expiree: 1 } });
  }

  // Après connexion ou inscription : retour à la page demandée, sinon espace personnel.
  redirigerApresConnexion(): void {
    const retour = this.router.parseUrl(this.router.url).queryParams['retour'] as string | undefined;
    const sur = !!retour && retour.startsWith('/') && !retour.startsWith('//');

    if (this.role() === 'admin' || !sur) {
      this.router.navigateByUrl(this.espacePersonnel());
    } else {
      this.router.navigateByUrl(retour as string);
    }
  }

  token(): string | null {
    return localStorage.getItem('token');
  }

  espacePersonnel(): string {
    switch (this.role()) {
      case 'candidat':
        return '/candidat';
      case 'entreprise':
        return '/entreprise';
      case 'admin':
        return '/admin';
      default:
        return '/';
    }
  }

  private enregistrer(reponse: ReponseAuth): void {
    localStorage.setItem('token', reponse.token);
    localStorage.setItem('user', JSON.stringify(reponse.user));
    this.utilisateur.set(reponse.user);
  }

  private vider(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.utilisateur.set(null);
  }

  private lireUtilisateur(): User | null {
    const brut = localStorage.getItem('user');
    return brut ? (JSON.parse(brut) as User) : null;
  }
}

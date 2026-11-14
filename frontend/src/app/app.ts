import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth.service';
import { LOGO_LETTRE, NOM_PLATEFORME } from './config';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  auth = inject(AuthService);
  nom = NOM_PLATEFORME;
  logo = LOGO_LETTRE;
  menuOuvert = signal(false);

  basculer(): void {
    this.menuOuvert.update((v) => !v);
  }

  fermer(): void {
    this.menuOuvert.set(false);
  }
}

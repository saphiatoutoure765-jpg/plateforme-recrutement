import { StatutCandidature } from '../models';

export function statutLibelle(s: StatutCandidature): string {
  return { 'en attente': 'En attente', acceptee: 'Acceptée', refusee: 'Refusée' }[s];
}

export function statutClasse(s: StatutCandidature): string {
  return {
    'en attente': 'bg-ambre-100 text-ambre-700',
    acceptee: 'bg-menthe-100 text-menthe-800',
    refusee: 'bg-corail-100 text-corail-700',
  }[s];
}

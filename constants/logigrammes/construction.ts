import type { ProcessusId } from './pourTouteIntervention';
import type { ChoixLogigramme, EtapeLogigramme, LienLogigramme } from '@/types/logigrammes';

export const vers = (libelle: string, etape: string): ChoixLogigramme => ({ libelle, action: { type: 'etape', etape } });
export const appeler = (
  libelle: string, processus: ProcessusId, reprise?: string, etape?: string, arretAvant?: string,
): ChoixLogigramme & LienLogigramme => ({ libelle, action: { type: 'appel', processus, reprise, etape, arretAvant } });
export const aller = (libelle: string, processus: ProcessusId, etape: string): ChoixLogigramme => ({
  libelle, action: { type: 'aller', processus, etape },
});
export const reprendre: ChoixLogigramme = { libelle: 'Poursuivre l’intervention', action: { type: 'retour' } };
export function question(titre: string, choix: readonly ChoixLogigramme[], points: readonly string[] = [], phase = 'Évaluation'): EtapeLogigramme {
  return { titre, choix, points, phase };
}
export function action(titre: string, suite: string, points: readonly string[] = [], phase = 'Prise en charge'): EtapeLogigramme {
  return question(titre, [vers('Poursuivre', suite)], points, phase);
}
export const fin = (points: readonly string[] = []): EtapeLogigramme => question('Poursuivre l’intervention', [reprendre], points, 'Suite de l’intervention');

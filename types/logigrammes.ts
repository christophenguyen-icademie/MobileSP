import type { ProcessusId } from '@/constants/logigrammes/pourTouteIntervention';

export type AppelLogigramme = {
  type: 'appel'; processus: ProcessusId; etape?: string;
  reprise?: string; arretAvant?: string;
};
export type ActionLogigramme =
  | { type: 'etape'; etape: string }
  | AppelLogigramme
  | { type: 'aller'; processus: ProcessusId; etape: string }
  | { type: 'retour' };
export type ChoixLogigramme = { libelle: string; action: ActionLogigramme };
export type LienLogigramme = { libelle: string; action: AppelLogigramme };
export type EtapeLogigramme = {
  titre: string; phase: string; description?: string; points?: readonly string[];
  choix: readonly ChoixLogigramme[]; liens?: readonly LienLogigramme[];
};
export type DefinitionLogigramme = { debut: string; etapes: Record<string, EtapeLogigramme> };

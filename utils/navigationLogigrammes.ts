import { LOGIGRAMMES, REPRISES } from '@/constants/logigrammes/parcoursPse';
import type { ProcessusId } from '@/constants/logigrammes/pourTouteIntervention';
import type { ActionLogigramme, AppelLogigramme } from '@/types/logigrammes';

type Reprise = {
  processus: ProcessusId; etape: string; reponse: number | null;
  appele: ProcessusId; reprise?: string; arretAvant?: string;
};
export type PassageLogigramme = {
  processus: ProcessusId; etape: string; reponse: number | null; retours: readonly Reprise[];
};
export type NavigationLogigrammes =
  | { type: 'repondre'; reponse: number }
  | { type: 'avancer' }
  | { type: 'ouvrir'; action: AppelLogigramme }
  | { type: 'fermer' }
  | { type: 'recommencer'; processus: ProcessusId }
  | { type: 'precedent' };

export function creerParcours(processus: ProcessusId): PassageLogigramme[] {
  return [{ processus, etape: LOGIGRAMMES[processus].debut, reponse: null, retours: [] }];
}

// Les snapshots conservent aussi la pile d'appels : Précédent annule une entrée,
// une reprise ou un changement de branche sans conserver de réponse en aval.
function reprendre(actuel: PassageLogigramme, annuler = false): PassageLogigramme {
  const origine = actuel.retours.at(-1);
  if (!origine) return { processus: '00', etape: REPRISES[actuel.processus], reponse: null, retours: [] };
  const cible = {
    processus: origine.processus,
    etape: !annuler && origine.reprise ? origine.reprise : origine.etape,
    reponse: !annuler && origine.reprise ? null : origine.reponse,
    retours: actuel.retours.slice(0, -1),
  };
  return annuler ? cible : verifierLimite(cible);
}

function verifierLimite(cible: PassageLogigramme): PassageLogigramme {
  const retour = cible.retours.at(-1);
  return retour?.appele === cible.processus && retour.arretAvant === cible.etape ? reprendre(cible) : cible;
}

function executer(actuel: PassageLogigramme, action: ActionLogigramme): PassageLogigramme {
  switch (action.type) {
    case 'etape': return verifierLimite({ ...actuel, etape: action.etape, reponse: null });
    case 'aller': return { processus: action.processus, etape: action.etape, reponse: null, retours: [] };
    case 'retour': return reprendre(actuel);
    case 'appel': return {
      processus: action.processus, etape: action.etape ?? LOGIGRAMMES[action.processus].debut, reponse: null,
      retours: [...actuel.retours, {
        processus: actuel.processus, etape: actuel.etape, reponse: actuel.reponse,
        appele: action.processus, reprise: action.reprise, arretAvant: action.arretAvant,
      }],
    };
  }
}

export function naviguerLogigrammes(parcours: PassageLogigramme[], action: NavigationLogigrammes): PassageLogigramme[] {
  const actuel = parcours[parcours.length - 1];
  const etape = LOGIGRAMMES[actuel.processus].etapes[actuel.etape];
  switch (action.type) {
    case 'recommencer': return creerParcours(action.processus);
    case 'repondre':
      return etape.choix[action.reponse] ? [...parcours.slice(0, -1), { ...actuel, reponse: action.reponse }] : parcours;
    case 'avancer': {
      const choix = actuel.reponse === null ? undefined : etape.choix[actuel.reponse];
      return choix ? [...parcours, executer(actuel, choix.action)] : parcours;
    }
    case 'ouvrir': return [...parcours, executer(actuel, action.action)];
    case 'fermer': return actuel.retours.length ? [...parcours, reprendre(actuel, true)] : parcours;
    case 'precedent': return parcours.length > 1 ? parcours.slice(0, -1) : parcours;
  }
}

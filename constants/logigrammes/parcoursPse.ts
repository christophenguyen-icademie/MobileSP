import type { DefinitionLogigramme } from '@/types/logigrammes';
import { ETAPES, type ProcessusId } from './pourTouteIntervention';
import { appeler } from './construction';
import { hemorragie, liberer, reperer, securiser } from './securisation';
import { detresse, maintenir, position, reanimer } from './reanimation';
import { brulure, malaise, plaie, traumatisme } from './prisesEnCharge';
import { circonstancielle, surveillance } from './circonstances';

const entrees: Record<string, string> = {
  recuperation: 'fonctions', detresseRespiratoire: 'respiratoire',
  detresseCirculatoire: 'circulatoire', detresseNeurologique: 'neurologique',
  malaise: 'medicament', transporter: 'conditionnement',
};

export const LOGIGRAMMES: Record<ProcessusId, DefinitionLogigramme> = {
  '00': {
    debut: 'depart',
    etapes: Object.fromEntries(Object.entries(ETAPES).map(([id, etape]) => [id, {
      ...etape,
      choix: etape.choix.map(choix => ({ libelle: choix.libelle, action: { type: 'etape' as const, etape: choix.suite } })),
      liens: etape.processus ? [appeler(`Ouvrir le logigramme ${etape.processus}`, etape.processus, undefined, entrees[id])] : undefined,
    }])),
  },
  '01': securiser, '02': reperer, '03': hemorragie, '04': liberer,
  '05': reanimer, '06': maintenir, '07': detresse, '08': position,
  '09': plaie, '10': brulure, '11': traumatisme, '12': malaise,
  '13': circonstancielle, '14': surveillance,
};

/** Reprise du processus général lorsqu’un parcours a été ouvert depuis la liste. */
export const REPRISES: Record<ProcessusId, string> = {
  '00': 'echange', '01': 'victimes', '02': 'informations', '03': 'voiesAeriennes',
  '04': 'conscience', '05': 'echange', '06': 'apprecierRespiration', '07': 'mesurerRespiration',
  '08': 'soins', '09': 'surveiller', '10': 'surveiller', '11': 'surveiller',
  '12': 'surveiller', '13': 'surveiller', '14': 'surveiller',
};

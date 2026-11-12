import { Text } from 'react-native';
import type { Carnet, FormulairePassage } from '@/types/calendriersApi';
import { recusSelectionnables } from '@/utils/calendriersServeur';
import { Selecteur, s } from './CalendriersUi';

export default function RecuForm({ carnets, saisie, onChange, disabled }: { carnets: Carnet[]; saisie: FormulairePassage; onChange: (patch: Partial<FormulairePassage>) => void; disabled: boolean }) {
  const disponibles = recusSelectionnables(carnets.find(c => c.id === saisie.carnetId), saisie);
  return <>
    {!carnets.length && <Text style={s.erreur}>Aucun carnet pour cette tournée. Un responsable doit en ajouter un avant une vente ou un don.</Text>}
    <Selecteur label="Carnet de reçus" value={saisie.carnetId} disabled={disabled} onChange={carnetId => onChange({ carnetId, recuId: '' })}
      options={ [['', 'Choisir un carnet…'], ...carnets.map(c => [c.id, `${c.numero} · ${recusSelectionnables(c, saisie).length} sélectionnables`] as [string, string])] } />
    <Selecteur label="Numéro du reçu" value={saisie.recuId} disabled={disabled || !disponibles.length} onChange={recuId => onChange({ recuId })}
      options={ [['', saisie.carnetId && !disponibles.length ? 'Carnet épuisé' : 'Choisir un reçu…'], ...disponibles.map(r => [r.id, `N° ${r.numero}`] as [string, string])] } />
    <Text style={s.secondaire}>Un reçu utilisé ou annulé ne peut plus être attribué à un autre passage. Le reçu courant reste sélectionnable lors d’une correction.</Text>
  </>;
}

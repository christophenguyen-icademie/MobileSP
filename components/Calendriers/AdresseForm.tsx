import { Text } from 'react-native';
import type { FormulairePassage } from '@/types/calendriersApi';
import { LOGEMENT, rue } from '@/utils/calendriersServeur';
import { Champ, s } from './CalendriersUi';

export default function AdresseForm({ saisie, onChange, disabled }: { saisie: FormulairePassage; onChange: (patch: Partial<FormulairePassage>) => void; disabled: boolean }) {
  return <>
    {saisie.mode === 'new' || saisie.mode === 'same-street' ? <>
      {saisie.mode === 'same-street' ? <>
        <Text style={s.secondaire}>Rue : {rue(saisie.source!)}</Text>
        <Champ label="Numéro" value={saisie.numero} onChange={numero => onChange({ numero })} disabled={disabled} longueur={20} aide="Ex. 12 bis ou 3 ter" />
      </> : <Champ label="Numéro et voie" value={saisie.ligne1} onChange={ligne1 => onChange({ ligne1 })} disabled={disabled} longueur={180} />}
      <Champ label="Code postal" value={saisie.codePostal} onChange={codePostal => onChange({ codePostal })} disabled={disabled} longueur={10} />
      <Champ label="Ville" value={saisie.ville} onChange={ville => onChange({ ville })} disabled={disabled} longueur={120} />
    </> : <Text style={s.secondaire}>{saisie.ligne1} · {saisie.codePostal} {saisie.ville}</Text>}
    {Object.entries(LOGEMENT).map(([key, label]) => <Champ key={key} label={label} value={saisie[key as keyof typeof LOGEMENT]}
      onChange={value => onChange({ [key]: value })} disabled={disabled} longueur={80} />)}
  </>;
}

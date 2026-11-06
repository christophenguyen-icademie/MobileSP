import { Picker } from '@react-native-picker/picker';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { CARNETS_DEMONSTRATION } from '@/constants/calendriers';
import type { DonneesCalendriers, SaisiePassage } from '@/types/calendriers';
import { recusDisponibles } from '@/utils/calendriers';

export default function RecuForm({ donnees, tourneeId, adresseId, saisie, onChange, disabled }: {
  donnees: DonneesCalendriers;
  tourneeId: string;
  adresseId: string;
  saisie: SaisiePassage;
  onChange: (saisie: SaisiePassage) => void;
  disabled: boolean;
}) {
  const disponibles = recusDisponibles(donnees, saisie.numeroCarnet, tourneeId, adresseId);
  const ancienneVente = donnees.passages.some(p => p.tourneeId === tourneeId && p.adresseId === adresseId
    && p.statut === 'VENTE' && !p.numeroCarnet);
  return <>
    {ancienneVente && <Text style={s.aide}>Cette ancienne vente n’a pas de reçu. Complétez le carnet et le reçu avant de l’enregistrer.</Text>}
    <Text style={s.libelle}>Carnet de reçus (obligatoire)</Text>
    <View style={s.selecteur}>
      <Picker accessibilityLabel="Carnet de reçus" selectedValue={saisie.numeroCarnet} enabled={!disabled}
        style={s.picker} onValueChange={numeroCarnet => onChange({ ...saisie, numeroCarnet, numeroRecu: '' })}>
        <Picker.Item label="Choisir un carnet…" value="" />
        {CARNETS_DEMONSTRATION.map(carnet => {
          const restants = recusDisponibles(donnees, carnet.numero, tourneeId, adresseId).length;
          return <Picker.Item key={carnet.numero} label={`${carnet.numero} · ${restants}/25 sélectionnables`} value={carnet.numero} />;
        })}
      </Picker>
    </View>
    <Text style={s.libelle}>Numéro du reçu (5 chiffres, obligatoire)</Text>
    <View style={s.selecteur}>
      <Picker accessibilityLabel="Numéro du reçu" selectedValue={saisie.numeroRecu}
        enabled={!disabled && disponibles.length > 0} style={s.picker}
        onValueChange={numeroRecu => onChange({ ...saisie, numeroRecu })}>
        <Picker.Item label={!saisie.numeroCarnet ? 'Choisir d’abord un carnet…' : disponibles.length ? 'Choisir un reçu…' : 'Carnet épuisé'} value="" />
        {disponibles.map(numero => <Picker.Item key={numero} label={numero} value={numero} />)}
      </Picker>
    </View>
    <Text style={s.aide}>Un reçu utilisé reste indisponible après correction ou annulation de la vente.</Text>
  </>;
}

const s = StyleSheet.create({
  libelle: { fontSize: 13, fontWeight: '700', color: '#33445b', marginTop: 12, marginBottom: 4 },
  selecteur: { borderWidth: 1, borderColor: '#cdd4e0', borderRadius: 9, overflow: 'hidden' },
  picker: {
    color: '#202b45', backgroundColor: '#fff', width: '100%',
    ...Platform.select({ web: { minHeight: 50, fontSize: 16, paddingHorizontal: 12, borderWidth: 0 } }),
  },
  aide: { fontSize: 12, lineHeight: 18, color: '#66748a' },
});

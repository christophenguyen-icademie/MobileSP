import { Text, View } from 'react-native';

import type { Tournee } from '@/types/calendriersApi';
import { s } from './CalendriersUi';

export default function BilanCalendriers({ tournee }: { tournee: Tournee }) {
  const { calendriersDistribues, calendriersVendus, calendriersDonnes, stockCalendriers } = tournee;
  return <View style={s.groupe} testID="bilan-calendriers">
    <Text style={s.libelle}>Calendriers vendus ou donnés</Text>
    <Text style={s.compteur}>{calendriersDistribues} / {stockCalendriers}</Text>
    <Text style={s.secondaire}>{calendriersVendus} vendus · {calendriersDonnes} donnés</Text>
    {stockCalendriers > 0 ? <View accessibilityRole="progressbar"
      accessibilityLabel="Calendriers vendus ou donnés"
      accessibilityValue={{ min: 0, max: stockCalendriers, now: Math.min(calendriersDistribues, stockCalendriers), text: `${calendriersDistribues} sur ${stockCalendriers}` }}
      style={s.progression}><View style={[s.progressionRemplie, { width: `${Math.min(100, Math.max(0, calendriersDistribues / stockCalendriers * 100))}%` }]} /></View>
      : <Text style={s.secondaire}>Stock à renseigner</Text>}
  </View>;
}

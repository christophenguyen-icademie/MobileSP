import { Picker } from '@react-native-picker/picker';
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

export function Bouton({ children, onPress, disabled = false, secondaire = false, compact = false, accessibilityLabel, expanded }: {
  children: string; onPress: () => void; disabled?: boolean; secondaire?: boolean; compact?: boolean; accessibilityLabel?: string; expanded?: boolean;
}) {
  return <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? children} accessibilityState={{ disabled, expanded }} disabled={disabled} onPress={onPress}
    style={[s.bouton, secondaire && s.secondaireBouton, compact && s.boutonCompact, disabled && s.desactive]}><Text style={secondaire ? s.lien : s.texteBouton}>{children}</Text></Pressable>;
}
export function Champ({ label, value, onChange, disabled = false, longueur, clavier = 'default', secret = false, aide }: {
  label: string; value: string; onChange: (value: string) => void; disabled?: boolean; longueur?: number;
  clavier?: 'default' | 'email-address' | 'url' | 'number-pad' | 'decimal-pad'; secret?: boolean; aide?: string;
}) {
  return <View style={s.groupe}><Text style={s.libelle}>{label}</Text><TextInput accessibilityLabel={label} value={value}
    editable={!disabled} onChangeText={onChange} maxLength={longueur} keyboardType={clavier} secureTextEntry={secret}
    autoCapitalize="none" autoCorrect={false} style={s.champ} />{aide && <Text style={s.secondaire}>{aide}</Text>}</View>;
}
export function Selecteur({ label, value, onChange, options, disabled = false }: {
  label: string; value: string; onChange: (value: string) => void; options: [string, string][]; disabled?: boolean;
}) {
  return <View style={s.groupe}><Text style={s.libelle}>{label}</Text><View style={s.selecteur}><Picker accessibilityLabel={label}
    selectedValue={value} onValueChange={onChange} enabled={!disabled} style={s.picker}>
    {options.map(([key, text]) => <Picker.Item key={key} value={key} label={text} />)}
  </Picker></View></View>;
}
export function Carte({ children }: { children: ReactNode }) { return <View style={s.carte}>{children}</View>; }
export function Attente() { return <ActivityIndicator accessibilityLabel="Chargement" color="#1f176a" style={{ padding: 14 }} />; }
export const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f4f6f9' }, flex: { flex: 1 },
  header: { padding: 18, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e5e9f0' },
  contenu: { padding: 16, paddingBottom: 40 }, largeur: { width: '100%', maxWidth: 760, alignSelf: 'center', gap: 12 },
  titre: { fontSize: 26, fontWeight: '800', color: '#1f176a' }, sousTitre: { fontSize: 21, fontWeight: '700', color: '#202b45' },
  nom: { fontSize: 16, fontWeight: '700', color: '#202b45' }, secondaire: { fontSize: 13, lineHeight: 19, color: '#66748a' },
  carte: { backgroundColor: '#fff', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e5e9f0', gap: 12 },
  groupe: { gap: 6 }, ligne: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, alignItems: 'center', justifyContent: 'space-between' },
  libelle: { fontSize: 13, fontWeight: '700', color: '#33445b' },
  compteur: { fontSize: 24, fontWeight: '800', color: '#1f176a' },
  progression: { height: 7, borderRadius: 4, backgroundColor: '#e5e9f0', overflow: 'hidden' },
  progressionRemplie: { height: '100%', backgroundColor: '#1f176a' },
  champ: { borderWidth: 1, borderColor: '#cdd4e0', backgroundColor: '#fff', borderRadius: 9, padding: 12, fontSize: 16, color: '#202b45' },
  selecteur: { borderWidth: 1, borderColor: '#cdd4e0', borderRadius: 9, overflow: 'hidden' },
  picker: { color: '#202b45', backgroundColor: '#fff', width: '100%', minHeight: 48 },
  bouton: { padding: 14, borderRadius: 9, backgroundColor: '#1f176a', alignItems: 'center', justifyContent: 'center' },
  boutonCompact: { minHeight: 44, paddingVertical: 10, paddingHorizontal: 12, flexShrink: 1 },
  actionsAdresse: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  secondaireBouton: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#cdd4e0' },
  texteBouton: { color: '#fff', fontSize: 14, fontWeight: '700' }, lien: { color: '#1f176a', fontSize: 14, fontWeight: '700' },
  desactive: { opacity: 0.5 }, erreur: { color: '#a12532', backgroundColor: '#fff0f1', padding: 12, borderRadius: 8, lineHeight: 20 },
  confirmation: { color: '#276346', backgroundColor: '#e1f1e7', padding: 12, borderRadius: 8, lineHeight: 20 },
});

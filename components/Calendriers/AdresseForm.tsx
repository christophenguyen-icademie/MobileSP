import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import type { SaisieAdresse } from '@/types/calendriers';

const CHAMPS: { cle: keyof SaisieAdresse; label: string; placeholder: string; longueur: number }[] = [
  { cle: 'ligne1', label: 'Numéro et voie', placeholder: 'Ex. 24 rue des Écoles', longueur: 180 },
  { cle: 'ville', label: 'Ville', placeholder: 'Ex. Troyes', longueur: 120 },
  { cle: 'codePostal', label: 'Code postal (facultatif)', placeholder: 'Ex. 10000', longueur: 10 },
  { cle: 'batiment', label: 'Bâtiment (facultatif)', placeholder: 'Ex. A ou Les Tilleuls', longueur: 50 },
  { cle: 'etage', label: 'Étage (facultatif)', placeholder: 'Ex. RDC, 2 ou -1', longueur: 20 },
  { cle: 'appartement', label: 'Appartement (facultatif)', placeholder: 'Ex. 12 ou 3B', longueur: 20 },
];

export default function AdresseForm({ creation, saisie, onChange, onSave, sauvegarde, erreur }: {
  creation: boolean;
  saisie: SaisieAdresse;
  onChange: (saisie: SaisieAdresse) => void;
  onSave: () => void;
  sauvegarde: boolean;
  erreur: string | null;
}) {
  return <>
    <Text accessibilityRole="header" style={s.titre}>{creation ? 'Ajouter une adresse' : 'Modifier l’adresse'}</Text>
    <Text style={s.description}>Précisez le logement pour distinguer les appartements d’une même adresse.</Text>
    <View style={s.carte}>
      {CHAMPS.map(champ => <View key={champ.cle} style={s.groupe}>
        <Text style={s.libelle}>{champ.label}</Text>
        <TextInput accessibilityLabel={champ.label} value={saisie[champ.cle]} editable={!sauvegarde}
          onChangeText={texte => onChange({ ...saisie, [champ.cle]: texte })}
          placeholder={champ.placeholder} maxLength={champ.longueur} placeholderTextColor="#7a8699"
          autoCapitalize="words" style={s.champ} />
      </View>)}
      {erreur && <Text accessibilityRole="alert" style={s.erreur}>{erreur}</Text>}
      <Pressable accessibilityRole="button" accessibilityState={{ disabled: sauvegarde, busy: sauvegarde }}
        disabled={sauvegarde} onPress={onSave} style={[s.bouton, sauvegarde && s.desactive]}>
        {sauvegarde && <ActivityIndicator color="#fff" />}
        <Text style={s.texteBouton}>{sauvegarde ? 'Enregistrement…' : creation ? 'Ajouter l’adresse' : 'Enregistrer l’adresse'}</Text>
      </Pressable>
    </View>
  </>;
}

const s = StyleSheet.create({
  titre: { fontSize: 23, fontWeight: '800', color: '#202b45', marginBottom: 6 },
  description: { fontSize: 13, lineHeight: 19, color: '#66748a', marginBottom: 20 },
  carte: { backgroundColor: '#fff', borderRadius: 14, padding: 18, borderWidth: 1, borderColor: '#e5e9f0', marginBottom: 14, gap: 16 },
  groupe: { gap: 8 },
  libelle: { fontSize: 13, fontWeight: '700', color: '#33445b' },
  champ: { borderWidth: 1, borderColor: '#cdd4e0', borderRadius: 9, padding: 13, fontSize: 16, color: '#202b45' },
  erreur: { color: '#a12532', fontSize: 13, lineHeight: 19 },
  bouton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#1f176a', padding: 16, borderRadius: 10 },
  texteBouton: { color: '#fff', fontSize: 13, fontWeight: '700' },
  desactive: { opacity: 0.6 },
});

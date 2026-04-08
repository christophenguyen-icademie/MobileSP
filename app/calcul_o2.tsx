import Slider from "@react-native-community/slider";
import { Picker } from "@react-native-picker/picker";
import React, { useMemo, useState } from "react";
import {
    SafeAreaView,
    StyleSheet,
    Text,
    View,
} from "react-native";

type Contenance = 4 | 5 | 6 | 15;

const CONTENANCES: Contenance[] = [4, 5, 6, 15];

export default function Calcul_O2(): JSX.Element {
  const [contenance, setContenance] = useState<Contenance>(5);
  const [pression, setPression] = useState<number>(300);
  const [debit, setDebit] = useState<number>(15);

  const pressionValid = pression >= 0 && pression <= 300;
  const debitValid = debit >= 1 && debit <= 15;

  const tempsRestant = useMemo<number>(() => {
    if (!pressionValid || !debitValid) return 0;
    return (contenance * pression) / debit;
  }, [contenance, pression, debit, pressionValid, debitValid]);

  const formatTemps = (minutes: number): string => {
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60);
    return `${h} h ${m} min`;
  };

  // -----------------------------
  // Logique suggestion matériel
  // -----------------------------
  const materiel = useMemo(() => {
    if (!debitValid) return null;

    if (debit <= 6)
      return {
        label: "Lunettes O₂",
        color: "#4CAF50",
        info: "Débit compatible lunettes (1–6 L/min)",
      };

    return {
      label: "Masque Haute Concentration",
      color: "#FB8C00",
      info: "Débit > 6 L/min → privilégier MHC",
    };
  }, [debit, debitValid]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Contenance */}
      <Text style={styles.label}>Contenance</Text>
      <View style={styles.box}>
        <Picker
          selectedValue={contenance}
          onValueChange={(v) => setContenance(v as Contenance)}
        >
          {CONTENANCES.map((c) => (
            <Picker.Item key={c} label={`${c} L`} value={c} />
          ))}
        </Picker>
      </View>

      {/* Pression */}
      <Text style={styles.label}>
        Pression : {pression} bar
      </Text>
      <Slider
        minimumTrackTintColor="#FB8C00"
        maximumTrackTintColor="#FB8C00"
        thumbTintColor="#FB8C00"
        minimumValue={0}
        maximumValue={300}
        step={1}
        value={pression}
        onValueChange={setPression}

      />

      {/* Débit */}
      <Text style={styles.label}>
        Débit : {debit} L/min
      </Text>
      <Slider
        minimumTrackTintColor="#FB8C00"
        maximumTrackTintColor="#FB8C00"
        thumbTintColor="#FB8C00"
        minimumValue={1}
        maximumValue={15}
        step={1}
        value={debit}
        onValueChange={setDebit}
      />

      {/* Résultat autonomie */}
      <View style={styles.result}>
        <Text style={styles.resultValue}>
          {tempsRestant.toFixed(1)} min
        </Text>
        <Text>{formatTemps(tempsRestant)}</Text>
      </View>

      {/* Suggestion matériel */}
      {materiel && (
        <View
          style={[
            styles.materialBox,
            { borderColor: materiel.color, backgroundColor: "#ffffff" },
          ]}
        >
          <Text
            style={[
              styles.materialTitle,
              { color: materiel.color },
            ]}
          >
            Matériel conseillé
          </Text>

          <Text style={styles.materialLabel}>
            {materiel.label}
          </Text>

          <Text style={styles.materialInfo}>
            {materiel.info}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
   
    backgroundColor: "#1f176a"
  },
  title: {
    fontSize: 26,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 20,
  },
  label: {
    marginTop: 12,
    fontSize: 16,
    color: "#ffffff"
  },
  box: {
    borderWidth: 2,
    borderRadius: 8,
    padding: 2,
    borderColor: "#4CAF50",
    backgroundColor: "#ffffff",
    marginBottom:20
  },
  result: {
    marginTop: 100,
    padding: 14,
    backgroundColor: "#ffffff",
    borderRadius: 10,
    alignItems: "center",
  },
  resultValue: {
    fontSize: 24,
    fontWeight: "700",
  },
  materialBox: {
    marginTop: 20,
    borderWidth: 2,
    borderRadius: 10,
    padding: 14,
    backgroundColor: "#1f176a"
  },
  materialTitle: {
    fontWeight: "700",
    marginBottom: 6,
  },
  materialLabel: {
    fontSize: 18,
    fontWeight: "600",
  },
  materialInfo: {
    marginTop: 4,
    opacity: 0.8,
  }
});
import Slider from "@react-native-community/slider";
import { Picker } from "@react-native-picker/picker";
import React, { useMemo, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

type Contenance = 4 | 5 | 6 | 15;

const CONTENANCES: Contenance[] = [4, 5, 6, 15];

export default function Calcul_O2(): JSX.Element {
  const [contenance, setContenance] = useState<Contenance>(5);
  const [pression, setPression] = useState<number>(200);
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

  const materiel = useMemo(() => {
    if (!debitValid) return null;

    if (debit <= 6) {
      return {
        label: "Lunettes O₂",
        color: "#22C55E",
        bg: "#ECFDF5",
        info: "Débit compatible lunettes (1–6 L/min)",
        icon: "😷",
      };
    }
    if (debit >=7 && debit < 9) {
      return {
        label: "Masque Moyenne Concentration",
        color: "#22C55E",
        bg: "#ECFDF5",
        info: "Débit 7/8 L/min → privilégier MMC",
        icon: "😷",
      };
    }

    return {
      label: "Masque Haute Concentration",
      color: "#F97316",
      bg: "#FFF7ED",
      info: "Débit >= 9 L/min → privilégier MHC",
      icon: "🫁",
    };
  }, [debit, debitValid]);

  const percentage = Math.min(100, Math.max(0, (pression / 300) * 100));

  return (
      <SafeAreaView style={styles.container}>
        <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Calcul O₂</Text>
            <Text style={styles.subtitle}>
              Estime rapidement l’autonomie de ta bouteille et le matériel conseillé.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Contenance</Text>
            <View style={styles.pickerBox}>
              <Picker
                  selectedValue={contenance}
                  onValueChange={(v) => setContenance(v as Contenance)}
                  dropdownIconColor="#0F172A"
                  style={styles.picker}
              >
                {CONTENANCES.map((c) => (
                    <Picker.Item key={c} label={`${c} L`} value={c} />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.rowBetween}>
              <Text style={styles.cardTitle}>Pression</Text>
              <Text style={styles.valuePill}>{pression} bar</Text>
            </View>

            <View style={styles.sliderInfoRow}>
              <Text style={styles.sliderHint}>0</Text>
              <Text style={styles.sliderHint}>300</Text>
            </View>

            <Slider
                minimumTrackTintColor="#38BDF8"
                maximumTrackTintColor="#D6E4F0"
                thumbTintColor="#0EA5E9"
                minimumValue={0}
                maximumValue={300}
                step={1}
                value={pression}
                onValueChange={setPression}
            />

            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${percentage}%` }]} />
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.rowBetween}>
              <Text style={styles.cardTitle}>Débit</Text>
              <Text style={styles.valuePill}>{debit} L/min</Text>
            </View>

            <View style={styles.sliderInfoRow}>
              <Text style={styles.sliderHint}>1</Text>
              <Text style={styles.sliderHint}>15</Text>
            </View>

            <Slider
                minimumTrackTintColor="#F97316"
                maximumTrackTintColor="#D6E4F0"
                thumbTintColor="#F97316"
                minimumValue={1}
                maximumValue={15}
                step={1}
                value={debit}
                onValueChange={setDebit}
            />
          </View>

          <View style={styles.resultCard}>
            <Text style={styles.resultLabel}>Autonomie estimée</Text>
            <Text style={styles.resultValue}>{tempsRestant.toFixed(1)} min</Text>
            <Text style={styles.resultHuman}>{formatTemps(tempsRestant)}</Text>
          </View>

          {materiel && (
              <View
                  style={[
                    styles.materialBox,
                    {
                      borderColor: materiel.color,
                      backgroundColor: materiel.bg,
                    },
                  ]}
              >
                <View style={styles.materialHeader}>
                  <Text style={styles.materialIcon}>{materiel.icon}</Text>
                  <Text
                      style={[
                        styles.materialTitle,
                        { color: materiel.color },
                      ]}
                  >
                    Matériel conseillé
                  </Text>
                </View>

                <Text style={styles.materialLabel}>{materiel.label}</Text>
                <Text style={styles.materialInfo}>{materiel.info}</Text>
              </View>
          )}
        </ScrollView>
      </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FB",
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 28,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 30,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: "#64748B",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 16,
    marginBottom: 14,
    shadowColor: "#0F172A",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
    borderWidth: 1,
    borderColor: "#EEF2F7",
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 10,
  },
  pickerBox: {
    borderWidth: 1,
    borderColor: "#D7DEE8",
    borderRadius: 16,
    backgroundColor: "#FAFBFD",
    overflow: "hidden",
  },
  picker: {
    color: "#0F172A",
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  valuePill: {
    backgroundColor: "#EAF4FF",
    color: "#007AFF",
    fontWeight: "800",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    overflow: "hidden",
    fontSize: 13,
  },
  sliderInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
    marginTop: 2,
  },
  sliderHint: {
    fontSize: 12,
    color: "#94A3B8",
    fontWeight: "600",
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: "#E2E8F0",
    marginTop: 10,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#38BDF8",
  },
  resultCard: {
    backgroundColor: "#0F172A",
    borderRadius: 24,
    paddingVertical: 22,
    paddingHorizontal: 18,
    alignItems: "center",
    marginTop: 4,
    marginBottom: 14,
    shadowColor: "#0F172A",
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  resultLabel: {
    color: "#94A3B8",
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  resultValue: {
    marginTop: 10,
    fontSize: 34,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.8,
  },
  resultHuman: {
    marginTop: 4,
    fontSize: 14,
    color: "#CBD5E1",
    fontWeight: "600",
  },
  materialBox: {
    borderWidth: 1.5,
    borderRadius: 22,
    padding: 16,
  },
  materialHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  materialIcon: {
    fontSize: 22,
  },
  materialTitle: {
    fontWeight: "900",
    fontSize: 14,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  materialLabel: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
  },
  materialInfo: {
    marginTop: 6,
    color: "#334155",
    fontSize: 14,
    lineHeight: 20,
  },
});
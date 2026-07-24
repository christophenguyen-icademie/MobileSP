import { useEffect, useMemo, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const LOSS_TABLE = {
  "22": { qRef: 60, jRef: 1.7 },
  "45": { qRef: 250, jRef: 1.5 },
  "70": { qRef: 500, jRef: 0.55 },
  "110": { qRef: 1000, jRef: 0.28 },
};

const LANCES = {
  PL: { name: "Petite lance traditionnelle", pression: 3.5 },
  GL: { name: "Grande lance traditionnelle", pression: 5.5 },
  LDV: { name: "LDV (lance à débit variable)", pression: 6 },
};

const ELEVATION_LOSS = 0.1; // bar par mètre de dénivelé

export default function FireHydraulicsCalculator() {
  const [sections, setSections] = useState([]);
  const [diameter, setDiameter] = useState("70");
  const [typeLance, setTypeLance] = useState("LDV");
  const [type, setType] = useState("souple");
  const [length, setLength] = useState("");
  const [flow, setFlow] = useState("500");
  const [nozzlePressure, setNozzlePressure] = useState("6");
  const [elevation, setElevation] = useState("0");
  const [results, setResults] = useState(null);

  // Coefficient appliqué selon le type de tuyau
  const currentCoefficient = useMemo(() => (type === "souple" ? 1 : 1.05), [type]);

  // Aperçu de la friction de la section en cours de saisie
  const previewSection = useMemo(() => {
    const L = parseFloat(length) || 0;
    const Q = parseFloat(flow) || 0;

    const table = LOSS_TABLE[diameter.toString()];
    if (!table) {
      return { friction: 0, Q: flow, Jref: 0, Qref: 0 };
    }

    const friction = table.jRef * Math.pow(Q / table.qRef, 2) * (L / 100) * currentCoefficient;
    return { friction, Q: flow, Jref: table.jRef, Qref: table.qRef };
  }, [length, flow, diameter, type, currentCoefficient]);

  const calculate = () => {
    const elevationLoss = (parseFloat(elevation) || 0) * ELEVATION_LOSS;
    const detailed = [];
    let totalFriction = 0;

    sections.forEach((s, index) => {
      totalFriction += s.friction;
      detailed.push({ x: `S${index + 1}`, friction: s.friction });
    });

    const pumpPressure = totalFriction + elevationLoss + (parseFloat(nozzlePressure) || 0);
    setResults({
      chartData: detailed,
      pumpPressure,
      totalFriction: totalFriction + elevationLoss,
    });
  };

  // Recalcul automatique à chaque changement pertinent
  useEffect(() => {
    calculate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sections, nozzlePressure, typeLance, elevation, flow]);

  const addSection = () => {
    if (!length) return;
    const newSection = {
      diameter,
      type,
      length: parseFloat(length),
      coefficient: currentCoefficient,
      friction: previewSection.friction,
      Q: previewSection.Q,
      Jref: previewSection.Jref,
      Qref: previewSection.Qref,
    };
    setSections((prev) => [...prev, newSection]);
    setLength("");
  };

  const removeSection = (index) => {
    setSections((prev) => prev.filter((_, i) => i !== index));
  };

  const typeLanceChanged = (value) => {
    setTypeLance(value);
    setNozzlePressure(String(LANCES[value].pression));
  };

  const totalLength = sections.reduce((acc, s) => acc + s.length, 0);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Calcul hydraulique</Text>
            <Text style={styles.subtitle}>
              Estime la pression de refoulement à la pompe à partir de tes tuyaux, du dénivelé et de
              la lance.
            </Text>
          </View>

          {/* ---- Ajouter une section ---- */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Ajouter une section</Text>

            <Text style={styles.label}>Diamètre</Text>
            <View style={styles.chipRow}>
              {["22", "45", "70", "110"].map((d) => {
                const active = diameter === d;
                return (
                  <TouchableOpacity
                    key={d}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => setDiameter(d)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>DN {d}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.label}>Type de tuyau</Text>
            <View style={styles.segment}>
              {[
                { key: "souple", label: "Souple" },
                { key: "semi", label: "Semi-rigide" },
              ].map((opt) => {
                const active = type === opt.key;
                return (
                  <TouchableOpacity
                    key={opt.key}
                    style={[styles.segmentItem, active && styles.segmentItemActive]}
                    onPress={() => setType(opt.key)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.label}>Longueur (m)</Text>
            <TextInput
              keyboardType="numeric"
              value={length}
              onChangeText={setLength}
              placeholder="0"
              placeholderTextColor="#94A3B8"
              style={styles.input}
            />

            <View style={styles.previewBox}>
              <View style={styles.rowBetween}>
                <Text style={styles.previewTitle}>Aperçu de la section</Text>
                <View style={styles.pillPrimary}>
                  <Text style={styles.pillPrimaryText}>
                    {previewSection.friction.toFixed(2)} bar
                  </Text>
                </View>
              </View>
              <Text style={styles.formula}>
                Friction = Jref × (Q / Qref)² × (L / 100) × coef{"\n"}={" "}
                {previewSection.Jref.toFixed(2)} × ({parseFloat(flow) || 0} /{" "}
                {previewSection.Qref.toFixed(0)})² × ({parseFloat(length) || 0} / 100) ×{" "}
                {currentCoefficient}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.button, !length && styles.buttonDisabled]}
              onPress={addSection}
              disabled={!length}
              activeOpacity={0.85}
            >
              <Text style={styles.buttonText}>+ Ajouter la section</Text>
            </TouchableOpacity>
          </View>

          {/* ---- Sections ajoutées ---- */}
          {sections.length > 0 && (
            <View style={styles.card}>
              <View style={styles.rowBetween}>
                <Text style={styles.cardTitle}>Sections ajoutées</Text>
                <Text style={styles.badge}>{totalLength} m au total</Text>
              </View>

              {sections.map((s, i) => (
                <View style={styles.sectionRow} key={i}>
                  <View style={styles.sectionIndex}>
                    <Text style={styles.sectionIndexText}>S{i + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sectionMain}>
                      DN {s.diameter} · {s.length} m ·{" "}
                      {s.type === "souple" ? "souple" : "semi-rigide"}
                    </Text>
                    <Text style={styles.sectionSub}>
                      Q {s.Q} L/min · <Text style={styles.frictionSub}> perte {s.friction.toFixed(2)} bar</Text>
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => removeSection(i)}
                    style={styles.removeBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={styles.removeBtnText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* ---- Paramètres généraux ---- */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Paramètres généraux</Text>

            <Text style={styles.label}>Type de lance</Text>
            <View style={styles.optionList}>
              {Object.keys(LANCES).map((k) => {
                const active = typeLance === k;
                return (
                  <TouchableOpacity
                    key={k}
                    style={[styles.optionBtn, active && styles.optionBtnActive]}
                    onPress={() => typeLanceChanged(k)}
                    activeOpacity={0.85}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.optionText, active && styles.optionTextActive]}>
                        {LANCES[k].name}
                      </Text>
                      <Text style={[styles.optionSub, active && styles.optionSubActive]}>
                        Pression {LANCES[k].pression} bar
                      </Text>
                    </View>
                    <View style={[styles.radio, active && styles.radioActive]}>
                      {active && <View style={styles.radioDot} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.row}>
              <View style={styles.rowItem}>
                <Text style={styles.label}>Débit (L/min)</Text>
                <TextInput
                  keyboardType="numeric"
                  value={flow}
                  onChangeText={setFlow}
                  style={styles.input}
                />
              </View>
              <View style={styles.rowItem}>
                <Text style={styles.label}>Pression lance (bar)</Text>
                <TextInput
                  keyboardType="numeric"
                  value={nozzlePressure}
                  onChangeText={setNozzlePressure}
                  style={styles.input}
                />
              </View>
            </View>

            <Text style={styles.label}>Dénivelé positif (m)</Text>
            <TextInput
              keyboardType="numeric"
              value={elevation}
              onChangeText={setElevation}
              style={styles.input}
            />
          </View>

          {/* ---- Résultat ---- */}
          {results && (
            <View style={styles.resultCard}>
              <Text style={styles.resultLabel}>Pression de refoulement</Text>
              <Text style={styles.resultValue}>{results.pumpPressure.toFixed(2)} bar</Text>
              <View style={styles.resultBreakdown}>
                <Text style={styles.resultBreakdownText}>
                  Total perte de charge : {results.totalFriction.toFixed(2)} bar
                </Text>
                <Text style={styles.resultBreakdownText}>
                  Pression lance : {(parseFloat(nozzlePressure) || 0).toFixed(2)} bar
                </Text>
              </View>
            </View>
          )}
        </View>
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
    paddingBottom: 40,
    alignItems: "center",
  },
  content: {
    width: "100%",
    maxWidth: 640, // centre et limite la largeur sur le web
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
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },
  label: {
    marginTop: 12,
    marginBottom: 6,
    fontSize: 13,
    fontWeight: "700",
    color: "#475569",
  },
  input: {
    borderWidth: 1,
    borderColor: "#D7DEE8",
    borderRadius: 14,
    backgroundColor: "#FAFBFD",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: "#0F172A",
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    flexGrow: 1,
    flexBasis: "22%",
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
    backgroundColor: "#FAFBFD",
    borderWidth: 1,
    borderColor: "#D7DEE8",
  },
  chipActive: {
    backgroundColor: "#EAF4FF",
    borderColor: "#2563EB",
  },
  chipText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#64748B",
  },
  chipTextActive: {
    color: "#1D4ED8",
  },
  optionList: {
    gap: 8,
  },
  optionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: "#FAFBFD",
    borderWidth: 1,
    borderColor: "#D7DEE8",
  },
  optionBtnActive: {
    backgroundColor: "#EAF4FF",
    borderColor: "#2563EB",
  },
  optionText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
  optionTextActive: {
    color: "#1D4ED8",
  },
  optionSub: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "600",
    color: "#94A3B8",
  },
  optionSubActive: {
    color: "#3B82F6",
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
  },
  radioActive: {
    borderColor: "#2563EB",
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: "#2563EB",
  },
  segment: {
    flexDirection: "row",
    backgroundColor: "#EEF2F7",
    borderRadius: 14,
    padding: 4,
    gap: 4,
  },
  segmentItem: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  segmentItemActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#64748B",
  },
  segmentTextActive: {
    color: "#0F172A",
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  rowItem: {
    flex: 1,
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  previewBox: {
    marginTop: 16,
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#EEF2F7",
  },
  previewTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#2E7D32",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  pillPrimary: {
    backgroundColor: "#EAF4FF",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pillPrimaryText: {
    color: "#1D4ED8",
    fontWeight: "800",
    fontSize: 14,
  },
  formula: {
    marginTop: 12,
    fontSize: 12,
    lineHeight: 18,
    color: "#64748B",
    fontStyle: "italic",
  },
  button: {
    backgroundColor: "#2563EB",
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 16,
  },
  buttonDisabled: {
    backgroundColor: "#94A3B8",
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 15,
  },
  badge: {
    backgroundColor: "#EEF2F7",
    color: "#475569",
    fontWeight: "700",
    fontSize: 12,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    overflow: "hidden",
  },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#EEF2F7",
    marginTop: 6,
  },
  sectionIndex: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#0F172A",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionIndexText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 13,
  },
  sectionMain: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
  sectionSub: {
    marginTop: 2,
    fontSize: 16,
    color: "#64748B",
  },
    frictionSub: {
    marginTop: 2,
    fontSize: 24,
    color: "#8A2100",
},
  removeBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#FEF2F2",
    alignItems: "center",
    justifyContent: "center",
  },
  removeBtnText: {
    color: "#DC2626",
    fontWeight: "800",
    fontSize: 14,
  },
  resultCard: {
    backgroundColor: "#0F172A",
    borderRadius: 24,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: "center",
    marginTop: 2,
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
    fontSize: 40,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -1,
  },
  resultBreakdown: {
    marginTop: 16,
    alignSelf: "stretch",
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: "#1E293B",
    paddingTop: 14,
  },
  resultBreakdownText: {
    color: "#CBD5E1",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
});

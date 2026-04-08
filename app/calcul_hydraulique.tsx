import { Picker } from "@react-native-picker/picker";
import { useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

// Tables de pertes réalistes (bar/100m)
const LOSS_TABLE = {
  "Lance traditionnelle" : {
  "45": [
    { qRef: 250, jRef: 1.5 },
    { qRef: 500, jRef: 6.0 }
  ],
  "70": [
    { qRef: 500, jRef: 0.55 },
    { qRef: 1000, jRef: 2.2 }
  ],
  "110": [
    { qRef: 1000, jRef: 0.28 }
  ]
  },
  "LDV": {
    "45": [
    { qRef: 250, jRef: 1.5 },
    { qRef: 500, jRef: 6.0 }
    ],
    "70": [
      { qRef: 500, jRef: 0.6 },
      { qRef: 1000, jRef: 2.4 }
    ]
}
};

export default function FireHydraulicsCalculator() {
  const [sections, setSections] = useState([]);
  const [diameter, setDiameter] = useState("70");
  const [typeLance, setTypeLance] = useState("Lance traditionnelle");
  const [type, setType] = useState("souple");
  const [length, setLength] = useState("");
  const [fittings, setFittings] = useState("0");
  const [flow, setFlow] = useState("500");
  const [nozzlePressure, setNozzlePressure] = useState("6");
  const [elevation, setElevation] = useState("0");
  const [results, setResults] = useState(null);

   const [data3, setData3] = useState([
    { x: "windows", y: 300 },
    { x: "mac 0s", y: 250 },
    { x: "android", y: 800 },
    { x: "ios", y: 120 },
    { x: "others", y: 100 }
  ]);

  // Coefficient appliqué par type de tuyau
  const currentCoefficient = useMemo(() => (type === "souple" ? 1 : 1.05), [type]);

  // Aperçu friction section avec détail pédagogique
  const previewSection = useMemo(() => {
    const L = parseFloat(length) || 0;
    const Q = parseFloat(flow) || 0;
    const N = parseInt(fittings) || 0;

    const table = LOSS_TABLE[typeLance]?.[diameter];
    if (!table || table.length === 0) 
      return { friction: 0, fittingsLoss: 0, total: 0, Jref: 0, Qref: 0 };

    // Interpolation Jref et Qref
    let low = table[0], high = table[table.length - 1];
    for (let i = 0; i < table.length - 1; i++) {
      if (Q >= table[i].qRef && Q <= table[i + 1].qRef) {
        low = table[i];
        high = table[i + 1];
        break;
      }
    }
    const ratio = high.qRef !== low.qRef ? (Q - low.qRef) / (high.qRef - low.qRef) : 0;
    const Jref = low.jRef + ratio * (high.jRef - low.jRef);
    const Qref = low.qRef + ratio * (high.qRef - low.qRef);

    const friction = Jref * Math.pow(Q / Qref, 2) * (L / 100) * currentCoefficient;
    const fittingsLoss = N * 0.2;
    const total = friction + fittingsLoss;

    return { friction, fittingsLoss, total, Jref, Qref };
  }, [length, fittings, flow, diameter, type, currentCoefficient]);

  const addSection = () => {
    if (!length) return;
    const newSection = {
      diameter,
      type,
      length: parseFloat(length),
      fittings: parseInt(fittings) || 0,
      coefficient: currentCoefficient,
      friction: previewSection.friction,
      fittingsLoss: previewSection.fittingsLoss,
      total: previewSection.total,
      Jref: previewSection.Jref,
      Qref: previewSection.Qref
    };
    setSections([...sections, newSection]);
    setLength("");
    setFittings("0");
  };

  const calculate = () => {
    const elevationLoss = parseFloat(elevation) * 0.1;
    let detailed = [];
    let totalFriction = 0;

    sections.forEach((s, index) => {
      totalFriction += s.total;
      detailed.push({
        x: `S${index + 1}`,
        friction: s.friction,
        fittings: s.fittingsLoss
      });
    });

    const pumpPressure = totalFriction + elevationLoss + parseFloat(nozzlePressure);

    setResults({ chartData: detailed, pumpPressure });
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Calcul hydraulique incendie</Text>

      <Text style={styles.sectionTitle}>Ajouter une section</Text>

      <Text style={styles.label}>Diamètre</Text>
      <Picker selectedValue={diameter} onValueChange={setDiameter}>
        <Picker.Item label="DN45" value="45" />
        <Picker.Item label="DN70" value="70" />
        <Picker.Item label="DN110" value="110" />
      </Picker>

      <Text style={styles.label}>Type de tuyau</Text>
      <Picker selectedValue={type} onValueChange={setType}>
        <Picker.Item label="Souple" value="souple" />
        <Picker.Item label="Semi-rigide" value="semi" />
      </Picker>

      <Text style={styles.formula}>
        Formule appliquée : {"\n"}
        Friction = Jref * (Q / Qref)² * (L / 100) * Coefficient
        {"\n"}= {previewSection.Jref?.toFixed(2) || "0"} 
          * ({parseFloat(flow)} / {previewSection.Qref?.toFixed(0) || "0"})²
          * ({parseFloat(length) || 0} / 100)
          * {currentCoefficient}
        {"\n"}= {previewSection.friction.toFixed(2)} bar
      </Text>

      <Text style={styles.label}>Longueur (m)</Text>
      <TextInput
        keyboardType="numeric"
        value={length}
        onChangeText={setLength}
        style={styles.input}
      />

      <Text style={styles.label}>Nombre de raccords</Text>
      <TextInput
        keyboardType="numeric"
        value={fittings}
        onChangeText={setFittings}
        style={styles.input}
      />

      <Text style={styles.previewTitle}>Aperçu section</Text>
      <Text>Friction : {previewSection.friction.toFixed(2)} bar</Text>
      <Text>Raccords : {previewSection.fittingsLoss.toFixed(2)} bar</Text>
      <Text>Total section : {previewSection.total.toFixed(2)} bar</Text>

      <TouchableOpacity style={styles.button} onPress={addSection}>
        <Text style={styles.buttonText}>Ajouter section</Text>
      </TouchableOpacity>

      {sections.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Sections ajoutées</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.cell}>#</Text>
              <Text style={styles.cell}>Diam.</Text>
              <Text style={styles.cell}>Type</Text>
              <Text style={styles.cell}>Long.</Text>
              <Text style={styles.cell}>Rac.</Text>
              <Text style={styles.cell}>Qref</Text>
              <Text style={styles.cell}>Jref</Text>
              <Text style={styles.cell}>Fric.</Text>
              <Text style={styles.cell}>Rac.</Text>
              <Text style={styles.cell}>Total</Text>
            </View>
            {sections.map((s, i) => (
              <View style={styles.tableRow} key={i}>
                <Text style={styles.cell}>{i + 1}</Text>
                <Text style={styles.cell}>{s.diameter}</Text>
                <Text style={styles.cell}>{s.type}</Text>
                <Text style={styles.cell}>{s.length}</Text>
                <Text style={styles.cell}>{s.fittings}</Text>
                <Text style={styles.cell}>{s.Qref}</Text>
                <Text style={styles.cell}>{s.Jref?.toFixed(2) || "0"}</Text>
                <Text style={styles.cell}>{s.friction.toFixed(2)}</Text>
                <Text style={styles.cell}>{s.fittingsLoss.toFixed(2)}</Text>
                <Text style={styles.cell}>{s.total.toFixed(2)}</Text>
              </View>
            ))}
          </View>
        </>
      )}

      <Text style={styles.sectionTitle}>Paramètres généraux</Text>

      <Text style={styles.label}>Type de lance</Text>
      <Picker selectedValue={typeLance} onValueChange={setTypeLance}>
        <Picker.Item label="Lance traditionnelle" value="Lance traditionnelle" />
        <Picker.Item label="LDV" value="LDV" />
      </Picker>

      <Text style={styles.label}>Débit (L/min)</Text>
      <TextInput
        keyboardType="numeric"
        value={flow}
        onChangeText={setFlow}
        style={styles.input}
      />

      <Text style={styles.label}>Pression lance souhaitée (bar)</Text>
      <TextInput
        keyboardType="numeric"
        value={nozzlePressure}
        onChangeText={setNozzlePressure}
        style={styles.input}
      />

      <Text style={styles.label}>Dénivelé positif (m)</Text>
      <TextInput
        keyboardType="numeric"
        value={elevation}
        onChangeText={setElevation}
        style={styles.input}
      />

      <TouchableOpacity style={styles.calcButton} onPress={calculate}>
        <Text style={styles.buttonText}>Calculer</Text>
      </TouchableOpacity>

      {results && (
        <>
          <Text style={styles.sectionTitle}>Pertes par section</Text>
 
          <Text style={styles.result}>
            Pression pompe : {"\n"}{results.pumpPressure.toFixed(2)} bar
          </Text>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  title: { fontSize: 20, fontWeight: "bold" },
  sectionTitle: { marginTop: 20, fontWeight: "bold" },
  label: { marginTop: 10, fontWeight: "500" },
  input: { borderWidth: 1, padding: 8, marginTop: 4 },
  formula: { marginTop: 10, fontWeight: "bold", color: "#1565C0" },
  previewTitle: { marginTop: 10, fontWeight: "bold", color: "#2E7D32" },
  button: { backgroundColor: "#2196F3", padding: 10, alignItems: "center", marginTop: 15 },
  calcButton: { backgroundColor: "#C62828", padding: 14, alignItems: "center", marginTop: 20 },
  buttonText: { color: "white", fontWeight: "bold" },
  result: { marginTop: 20, fontSize: 18, fontWeight: "bold", color: "red" },
  table: { marginTop: 10, borderWidth: 1, borderColor: "#ccc" },
  tableHeader: { flexDirection: "row", backgroundColor: "#eee", padding: 4 },
  tableRow: { flexDirection: "row", padding: 4, borderTopWidth: 1, borderColor: "#ccc" },
  cell: { flex: 1, fontSize: 12, textAlign: "center" }
});
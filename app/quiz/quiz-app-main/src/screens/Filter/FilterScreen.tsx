import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { Button, Checkbox, Text } from "react-native-paper";

export function FilterScreen({  navigation, route }: FilterScreenProps) {
  const [data, setData] = useState([]);
  const [levels, setLevels] = useState({});
  const [modules, setModules] = useState({});
  const [difficulties, setDifficulties] = useState({});

  useEffect(() => {
     const loadJson = async () => {
      const json = require("../../data/suap.json").questions;
      setData(json);

      // Extraire les options uniques
      const uniqueLevels = {};
      const uniqueModules = {};
      const uniqueDifficulties = {};

      json.forEach(q => {
        uniqueLevels[q.level] = true;
        uniqueModules[q.module] = true;
        uniqueDifficulties[q.difficulty] = true;
      });

      setLevels(uniqueLevels);
      setModules(uniqueModules);
      setDifficulties(uniqueDifficulties);
    };

    loadJson();
   
  }, []);

  const toggleItem = (obj, key, setter) => {
    const newObj = { ...obj, [key]: !obj[key] };
    setter(newObj);
  };

  const handleSubmit = () => {
    // Filtrer les questions selon les sélections
    const filtered = data.filter(q =>
      levels[q.level] && modules[q.module] && difficulties[q.difficulty]
    );

     navigation.navigate("Test", {
      title: route.params.title,
      testName: route.params.testName  
    });
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Niveaux</Text>
      {Object.keys(levels).map(level => (
        <Checkbox.Item
          key={level}
          label={level}
          status={levels[level] ? "checked" : "unchecked"}
          onPress={() => toggleItem(levels, level, setLevels)}
          color={"#1f176a"}
        />
      ))}

      <Text style={styles.title}>Modules</Text>
      {Object.keys(modules).map(module => (
        <Checkbox.Item
          key={module}
          label={module}
          status={modules[module] ? "checked" : "unchecked"}
          onPress={() => toggleItem(modules, module, setModules)}
          color={"#1f176a"}
        />
      ))}

      <Text style={styles.title}>Difficultés</Text>
      {Object.keys(difficulties).map(diff => (
        <Checkbox.Item
          key={diff}
          label={diff}
          status={difficulties[diff] ? "checked" : "unchecked"}
          onPress={() => toggleItem(difficulties, diff, setDifficulties)}
          color={"#1f176a"}
        />
      ))}

      <Button mode="contained" onPress={handleSubmit} style={styles.button}>
        Valider
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10 },
  title: { fontSize: 18, fontWeight: "bold", marginTop: 10 },
  button: { marginTop: 20, backgroundColor: "#1f176a" }
});
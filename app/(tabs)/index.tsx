import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const logo = require('@/assets/images/sdis10.png');

export default function Index() {
  const router = useRouter();
  const handleItineraireButton = () => {
    router.push('/ItineraireScreen');
  };
  const handleCalculO2Button = () => {
    router.push('/calcul_o2');
  };
  const handleCalculHydrauliqueButton = () => {
    router.push('/calcul_hydraulique');
  };
  const handleQuiz = () => {
    router.push('/quiz');
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        {/* Logo Section */}
        <View style={styles.logoContainer}>
          <Image source={logo} style={styles.logo} />
        </View>

        {/* Button Section */}
        <TouchableOpacity style={styles.button} onPress={handleItineraireButton}>
           <Image
            source={require("../../assets/images/itineraire.png")}
            style={styles.icon}
          />
          <Text style={styles.buttonText}>Itinéraires</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleCalculO2Button}>
          <Image
            source={require("../../assets/images/o2.png")}
            style={styles.icon}
          />
        <Text style={styles.buttonText}>Calcul 02</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleCalculHydrauliqueButton}>
          <Image
            source={require("../../assets/images/hydraulique.png")}
            style={styles.icon}
          />
          <Text style={styles.buttonText}>Calcul Hydraulique</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff', // Couleur de fond
    alignItems: 'center', // Centre les éléments horizontalement
  },
  logoContainer: {
    marginTop: 10, // Distance par rapport au haut de l'écran
  },
  logo: {
    width: 150, // Ajustez la taille du logo selon vos besoins
    height: 150,
    resizeMode: 'contain',
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "90%",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: "#1f176a",   // bleu
    borderRadius: 12,         // arrondi
    backgroundColor: "white",
    margin: 10
  },
  icon: {
    width: 100,
    height: 100,
  },
  buttonText: {
    flex: 1,          // prend toute la place restante
    textAlign: "center",
    color: "#1f176a",
    fontSize: 18,
    fontWeight: "600",
  }
});

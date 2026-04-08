import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Dimensions, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const logo = require('@/assets/images/sdis10.png');

export default function Outils() {
  const router = useRouter();
  const handleCalculO2Button = () => {
    router.push('/calcul_o2');
  };
    const handleCalculHydrauliqueButton = () => {
    router.push('/calcul_hydraulique');
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        {/* Logo Section */}
        <View style={styles.logoContainer}>
          <Image source={logo} style={styles.logo} />
        </View>

        {/* Button Section */}
        <TouchableOpacity style={styles.button} onPress={handleCalculO2Button}>
          <Text style={styles.buttonText}>Calcul 02</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleCalculHydrauliqueButton}>
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
    marginTop: 20, // Ajoute un espace entre le logo et le bouton
    width: Dimensions.get('window').width * 0.9, // Prend 90% de la largeur de l'écran
    backgroundColor: '#1f176a',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
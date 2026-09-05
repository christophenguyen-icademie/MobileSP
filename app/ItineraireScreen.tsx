import CarteScreen from '@/components/Itineraires/CarteScreen';
import SaisieAdresseScreen from '@/components/Itineraires/SaisieAdresseScreen';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Stack } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Platform, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

const Tab = createBottomTabNavigator();

export default function ItineraireScreen() {
  const { height, width } = useWindowDimensions();
    const [myLocation, setMyLocation] = useState(null);
  const [destination, setDestination] = useState(null);
  const [summary, setSummary] = useState(null);
  const [route, setRoute] = useState(null);
  const [finalAddress, setFinalAddress] = useState(null);
  const webviewRef = useRef(null);

    const mobileWebEnPortrait = Platform.OS === "web" && width <= 900 && height > width;

    if (mobileWebEnPortrait) {
        return (
            <>
                <Stack.Screen options={{ headerShown: true, title: "Itinéraire" }} />
                <View style={styles.orientation}>
                    <View style={styles.telephone}>
                        <Text style={styles.telephoneEcran}>↻</Text>
                    </View>
                    <Text style={styles.orientationTitre}>Tournez votre téléphone</Text>
                    <Text style={styles.orientationTexte}>
                        La recherche d’itinéraire et la carte sont optimisées pour une utilisation en mode paysage.
                    </Text>
                </View>
            </>
        );
    }

    if (Platform.OS === "web") {
        const largeurPanneau = Math.min(400, Math.max(300, width * 0.42));
        return (
            <>
            <Stack.Screen options={{ headerShown: true, title: "Itinéraire" }} />
            <View style={styles.pageWeb}>
                <View
                    style={{
                        width: largeurPanneau,
                        flexShrink: 0,
                        minWidth: largeurPanneau,
                        borderRightWidth: 1,
                        borderRightColor: "#ddd",
                        overflow: "auto",
                    }}
                >
                    <SaisieAdresseScreen
                        setDestination={setDestination}
                        setFinalAddress={setFinalAddress}
                        setRoute={setRoute}
                        webviewRef={webviewRef}
                        setSummary={setSummary}
                        myLocation={myLocation}
                    />
                </View>

                <View style={{ flex: 1, minWidth: 0 }}>
                    <CarteScreen
                        finalAddress={finalAddress}
                        destination={destination}
                        route={route}
                        summary={summary}
                        webviewRef={webviewRef}
                        setMyLocation={setMyLocation}
                    />
                </View>
            </View>
            </>
        );
    }

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          if (route.name === "Saisie d'adresse") {
            return <Text style={{ fontSize: size, color }}>⌨️</Text>;
          }
          if (route.name === 'Carte') {
            return <Text style={{ fontSize: size, color }}>🗺️</Text>;
          }
          return null;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#666',
      })}
    >
      <Tab.Screen name="Carte">
        {() => <CarteScreen finalAddress={finalAddress} destination={destination} route={route} summary={summary} webviewRef={webviewRef} setMyLocation={setMyLocation} />}
      </Tab.Screen> 
       <Tab.Screen name="Saisie d'adresse">
        {() => <SaisieAdresseScreen setDestination={setDestination} setFinalAddress={setFinalAddress} setRoute={setRoute} webviewRef={webviewRef} setSummary={setSummary} myLocation={myLocation} />}
      </Tab.Screen>  
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  orientation: {
    alignItems: "center",
    backgroundColor: "#f5f5f8",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  pageWeb: {
    flex: 1,
    flexDirection: "row",
    minHeight: 0,
    overflow: "hidden",
  },
  telephone: {
    alignItems: "center",
    borderColor: "#1f176a",
    borderRadius: 16,
    borderWidth: 4,
    height: 112,
    justifyContent: "center",
    marginBottom: 30,
    transform: [{ rotate: "90deg" }],
    width: 62,
  },
  telephoneEcran: { color: "#1f176a", fontSize: 38, fontWeight: "700" },
  orientationTitre: { color: "#211e31", fontSize: 25, fontWeight: "800", textAlign: "center" },
  orientationTexte: { color: "#625e70", fontSize: 17, lineHeight: 25, marginTop: 12, maxWidth: 420, textAlign: "center" },
});

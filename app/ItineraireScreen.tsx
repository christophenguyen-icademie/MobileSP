import CarteScreen from '@/components/Itineraires/CarteScreen';
import SaisieAdresseScreen from '@/components/Itineraires/SaisieAdresseScreen';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React, { useRef, useState } from 'react';
import {Platform, Text, View } from 'react-native';
import {Stack} from "expo-router";

const Tab = createBottomTabNavigator();

export default function ItineraireScreen() {
  const [destination, setDestination] = useState(null);
  const [summary, setSummary] = useState(null);
  const [route, setRoute] = useState(null);
  const [finalAddress, setFinalAddress] = useState(null);
  const webviewRef = useRef(null);

    if (Platform.OS === "web") {
        return (
            <View style={{ flex: 1, flexDirection: "row", minHeight: "100vh" }}>
                <View
                    style={{
                        width: 400,
                        flexShrink: 0,
                        minWidth: 400,
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
                    />
                </View>

                <View style={{ flex: 1, minWidth: 0 }}>
                    <CarteScreen
                        finalAddress={finalAddress}
                        destination={destination}
                        route={route}
                        summary={summary}
                        webviewRef={webviewRef}
                    />
                </View>
            </View>
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
        {() => <CarteScreen finalAddress={finalAddress} destination={destination} route={route} summary={summary} webviewRef={webviewRef} />}
      </Tab.Screen> 
       <Tab.Screen name="Saisie d'adresse">
        {() => <SaisieAdresseScreen setDestination={setDestination} setFinalAddress={setFinalAddress} setRoute={setRoute} webviewRef={webviewRef} setSummary={setSummary} />}
      </Tab.Screen>  
    </Tab.Navigator>
  );
}
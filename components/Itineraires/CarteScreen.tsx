import { Picker } from '@react-native-picker/picker';
import * as Location from 'expo-location';
import React, { useEffect, useRef, useState } from 'react';
import {Platform, StyleSheet, Text, View } from 'react-native';
import { WebView } from "../WebViewWrapper";
import LeafletMap from './LeafletMap';

export default function CarteScreen({ destination, summary, route, finalAddress, webviewRef }) {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [currentAddress, setCurrentAddress] = useState(null);
  const locationSubscription = useRef(null);
  const [maille, setMaille] = useState(null);

  const GEO_URL = "https://data.geopf.fr/geocodage/reverse";
  const lastGeo = useRef(null);
  const lastTime = useRef(0);

  const styles = StyleSheet.create({
    map: {
      flex: 1,
      width: '100%',
    },
    localisation: {
      justifyContent: 'center',
      alignItems: 'center',
      padding: 2,
      fontSize: 16,
      backgroundColor: '#fff',
      textAlign: 'left',
    },
    final: {
      justifyContent: 'center',
      alignItems: 'center',
      padding: 2,
      fontSize: 16,
      backgroundColor: '#fff',
      textAlign: 'left',
    },
    destination: {
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
      fontSize: 16,
      backgroundColor: '#fff',
      textAlign: 'center',
    },
    summary: {
      marginTop: -20,
      marginBottom: -15,
      backgroundColor: "white",
      padding: 8,
      borderRadius: 12,
      elevation: 4,
      shadowColor: "#000",
      shadowOpacity: 0.2,
      shadowRadius: 6,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    }
  });

  const decodePolyline = (encoded) => {
    const points = [];
    let index = 0, lat = 0, lng = 0;
    while (index < encoded.length) {
      let result = 0;
      let shift = 0;
      let byte;
      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);
      lat += (result & 1) ? ~(result >> 1) : result >> 1;

      result = 0;
      shift = 0;
      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);
      lng += (result & 1) ? ~(result >> 1) : result >> 1;
      points.push([lat / 1e5, lng / 1e5]);
    }
    return points;
  };

  const leafletHtml = LeafletMap();

  function distanceMeters(a, b) {
    const R = 6371000;
    const dLat = (b.latitude - a.latitude) * Math.PI / 180;
    const dLon = (b.longitude - a.longitude) * Math.PI / 180;

    const lat1 = a.latitude * Math.PI / 180;
    const lat2 = b.latitude * Math.PI / 180;

    const x =
        Math.sin(dLat / 2) ** 2 +
        Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);

    return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  }

  useEffect(() => {
    async function fetchAddress() {
      if (currentLocation) {
        const now = Date.now();
        const shouldCall =
            !lastGeo.current ||
            distanceMeters(lastGeo.current, currentLocation) > 10 ||
            now - lastTime.current > 3000;

        if (!shouldCall) return;

        lastGeo.current = currentLocation;
        lastTime.current = now;

        const url = `${GEO_URL}?lon=${currentLocation.longitude}&lat=${currentLocation.latitude}`;

        const res = await fetch(url);
        const json = await res.json();

        setCurrentAddress(
            json.features?.[0]?.properties?.label ?? "—"
        );
      }
    }
    fetchAddress();
  }, [currentLocation]);

  useEffect(() => {
    const startLocationTracking = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.log('Permission de localisation refusée');
          return;
        }

        locationSubscription.current = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.High,
              timeInterval: 1000,
              distanceInterval: 0,
            },
            (location) => {
              const { latitude, longitude } = location.coords;
              setCurrentLocation({ latitude, longitude });

              if (webviewRef.current) {
                webviewRef.current.postMessage(JSON.stringify({
                  type: "setCurrentLocation",
                  latitude,
                  longitude,
                }));
              }
            }
        );
      } catch (error) {
        console.error('Erreur lors de la géolocalisation:', error);
      }
    };

    startLocationTracking();

    return () => {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
    };
  }, []);

  useEffect(() => {
    if (destination && webviewRef.current) {
      webviewRef.current.postMessage(JSON.stringify({
        type: "setDestination",
        latitude: destination.latitude,
        longitude: destination.longitude,
        pk: destination.pk,
      }));
    }
  }, [destination]);

  useEffect(() => {
    if (!route || !webviewRef.current) {
      return;
    }

    try {
      const geometry = route.routes && route.routes[0] && route.routes[0].geometry;
      if (geometry) {
        const coords = decodePolyline(geometry);
        if (coords && coords.length > 0) {
          webviewRef.current.postMessage(JSON.stringify({
            type: "drawRoute",
            coords,
          }));
        }
      }
    } catch (e) {
      console.error('Error in route effect:', e);
    }
  }, [route]);

  useEffect(() => {
    if (summary && webviewRef.current) {
      webviewRef.current.postMessage(JSON.stringify({
        type: "setRouteTime",
        duration: summary.duration,
        distance: summary.distance,
      }));
    }
  }, [summary]);

  return (
      <View style={styles.map}>
        {Platform.OS !== "web" && (
        <Text style={styles.localisation}>
          {currentAddress ? `📍 ${currentAddress}` : '📍 Localisation en cours...'}
        </Text>
        )}

        {Platform.OS !== "web" && finalAddress && (
            <Text style={styles.final}>
              🏁 {finalAddress}
            </Text>
        )}

        {
            Platform.OS !== "web" && route && route.routes && route.routes[0] && route.routes[0].segments && route.routes[0].segments[0] && (
                <Picker>
                  {route.routes[0].segments && route.routes[0].segments[0].steps.map((step, index) => (
                      <Picker.Item key={index} label={step.name} value={index} />
                  ))}
                </Picker>
            )
        }

        {Platform.OS !== "web" && summary && (
            <View style={styles.destination}>
              <View style={styles.summary}>
                <Text style={{ fontSize: 18, fontWeight: "900" }}>
                  ⬜ {maille}
                </Text>
                <Text style={{ fontWeight: "900" }}>
                  ⏱ {summary.duration}
                </Text>
                <Text>
                  📏 {summary.distance}
                </Text>
              </View>
            </View>
        )}

        <WebView
            ref={webviewRef}
            originWhitelist={['*']}
            source={{ html: leafletHtml }}
            style={{ flex: 1 }}
            javaScriptEnabled
            domStorageEnabled
            onMessage={(event) => {
              try {
                const data = JSON.parse(event.nativeEvent.data);
                if (data.type === 'setMaille') {
                  setMaille(data.maille);
                }
              } catch (e) {
                console.error('Error parsing message from WebView:', e);
              }
            }}
        />
      </View>
  );
}
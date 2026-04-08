import { Picker } from '@react-native-picker/picker';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import listePk from '../../assets/pk.json';
import ItineraireConstants from './ItinerairesConstants';

export default function SaisieAdresseScreen({
                                              setDestination,
                                              setRoute,
                                              webviewRef,
                                              setSummary,
                                              setFinalAddress,
                                            }) {
  const [address, setAddress] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [localRoute, setLocalRoute] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedStepIndex, setSelectedStepIndex] = useState(null);

  const [startPoint, setStartPoint] = useState('CIS');
  const [endPoint, setEndPoint] = useState('CIS');
  const [voieRapide, setVoieRapide] = useState(null);
  const [pk, setPk] = useState(null);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 16,
      backgroundColor: '#F5F7FB',
      width: '100%',
    },
    pageHeader: {
      marginBottom: 14,
    },
    pageTitle: {
      fontSize: 22,
      fontWeight: '900',
      color: '#0F172A',
      letterSpacing: -0.2,
    },
    pageSubtitle: {
      marginTop: 4,
      fontSize: 13,
      color: '#64748B',
      lineHeight: 18,
    },
    panel: {
      backgroundColor: '#FFFFFF',
      borderRadius: 20,
      padding: 16,
      marginBottom: 14,
      shadowColor: '#000',
      shadowOpacity: 0.08,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 3,
      borderWidth: 1,
      borderColor: '#EEF2F7',
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '900',
      color: '#0F172A',
      marginBottom: 12,
      letterSpacing: 0.2,
      textTransform: 'uppercase',
    },
    label: {
      fontSize: 13,
      fontWeight: '700',
      color: '#334155',
      marginBottom: 8,
    },
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginBottom: 10,
    },
    chip: {
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: '#D7DEE8',
      backgroundColor: '#FAFBFD',
    },
    chipActive: {
      backgroundColor: '#EAF4FF',
      borderColor: '#A7D3FF',
    },
    chipText: {
      fontSize: 13,
      fontWeight: '700',
      color: '#334155',
    },
    chipTextActive: {
      color: '#007AFF',
    },
    pickerWrapper: {
      borderWidth: 1,
      borderColor: '#D7DEE8',
      borderRadius: 16,
      backgroundColor: '#FAFBFD',
      overflow: 'hidden',
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      width: '100%',
      gap: 10,
    },
    input: {
      flex: 1,
      minHeight: 48,
      borderWidth: 1,
      borderColor: '#D7DEE8',
      backgroundColor: '#FAFBFD',
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderRadius: 16,
      fontSize: 15,
      color: '#111827',
    },
    pk: {
      flex: 1,
      minHeight: 48,
      borderWidth: 1,
      borderColor: '#D7DEE8',
      backgroundColor: '#FAFBFD',
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderRadius: 16,
      fontSize: 15,
      color: '#111827',
    },
    clearButton: {
      width: 48,
      height: 48,
      borderRadius: 16,
      backgroundColor: '#F3F4F6',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#E5E7EB',
    },
    validButton: {
      width: 48,
      height: 48,
      borderRadius: 16,
      backgroundColor: '#007AFF',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#007AFF',
      shadowOpacity: 0.25,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4,
    },
    suggestionList: {
      marginTop: 10,
      borderRadius: 16,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: '#E5EAF2',
      backgroundColor: '#FFFFFF',
    },
    suggestion: {
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderBottomWidth: 1,
      borderBottomColor: '#EEF2F7',
      backgroundColor: '#FFFFFF',
    },
    suggestionText: {
      fontSize: 15,
      color: '#1F2937',
    },
    viewInstruction: {
      flex: 1,
      marginTop: 0,
      padding: 0,
    },
    loadingText: {
      marginTop: 8,
      fontSize: 16,
      color: '#1F2937',
      fontWeight: '600',
    },
    loadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(245,247,251,0.82)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 999,
    },
    summary: {
      backgroundColor: '#FFFFFF',
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 16,
      elevation: 4,
      shadowColor: '#000',
      shadowOpacity: 0.12,
      shadowRadius: 10,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      zIndex: 10,
      borderWidth: 1,
      borderColor: '#E8EDF5',
      marginBottom: 12,
    },
    instructionsCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: 20,
      padding: 0,
      borderWidth: 1,
      borderColor: '#EEF2F7',
      shadowColor: '#000',
      shadowOpacity: 0.06,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
      overflow: 'hidden',
    },
    instructionsHeader: {
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: '#EEF2F7',
      backgroundColor: '#FBFCFE',
    },
    instructionsTitle: {
      fontSize: 14,
      fontWeight: '900',
      color: '#0F172A',
      textTransform: 'uppercase',
      letterSpacing: 0.2,
    },
    instructionItem: {
      flexDirection: 'row',
      paddingHorizontal: 14,
      paddingVertical: 12,
      backgroundColor: '#FFFFFF',
      borderLeftWidth: 4,
      borderLeftColor: 'transparent',
      alignItems: 'center',
      gap: 12,
    },
    instructionItemSelected: {
      backgroundColor: '#EAF4FF',
      borderLeftColor: '#007AFF',
    },
    instructionIconWrap: {
      width: 42,
      height: 42,
      borderRadius: 14,
      backgroundColor: '#F3F7FF',
      justifyContent: 'center',
      alignItems: 'center',
    },
    instructionIcon: {
      fontSize: 22,
      textAlign: 'center',
    },
    instructionText: {
      flex: 1,
      fontSize: 15,
      lineHeight: 21,
      color: '#1F2937',
    },
    emptyState: {
      padding: 16,
      color: '#6B7280',
      fontSize: 14,
    },
    hint: {
      marginTop: 10,
      color: '#64748B',
      fontSize: 12,
      lineHeight: 17,
    },
  });

  const destinationMap = {
    CIS: ['INTERVENTION', 'HOPITAL', 'PK'],
    HOPITAL: ['CIS', 'INTERVENTION'],
    INTERVENTION: ['CIS', 'HOPITAL'],
  };

  const getDestinationOptions = () => {
    if (!startPoint) return [];
    return destinationMap[startPoint] || [];
  };

  const startOptions = useMemo(
      () => [
        { key: 'CIS', label: 'CIS', icon: '👨‍🚒' },
        { key: 'HOPITAL', label: 'Hôpital', icon: '🏥' },
        { key: 'INTERVENTION', label: 'Intervention', icon: '📍' },
      ],
      []
  );

  const destinationOptions = useMemo(() => {
    const options = getDestinationOptions();
    return [
      options.includes('INTERVENTION') && { key: 'INTERVENTION', label: "Adresse d'intervention", icon: '📍' },
      options.includes('CIS') && { key: 'CIS', label: 'CIS', icon: '👨‍🚒' },
      options.includes('HOPITAL') && { key: 'HOPITAL', label: 'Hôpital', icon: '🏥' },
      options.includes('PK') && { key: 'PK', label: 'PK autoroute / voie rapide', icon: '🛣️' },
    ].filter(Boolean);
  }, [startPoint]);

  const formatDistance = (meters) => {
    if (meters < 1000) return `${Math.round(meters)} m`;
    return `${(meters / 1000).toFixed(1)} km`;
  };

  const formatDuration = (seconds) => {
    const min = Math.round(seconds / 60);
    if (min < 60) return `${min} min`;

    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${h} h ${m} min`;
  };

  const formatInstruction = (step) => {
    return `${step.instruction} - continuez sur ${formatDistance(step.distance)}, ${formatDuration(step.duration)}`;
  };

  const maneuverIcon = (type) => {
    switch (type) {
      case 0:
        return '⬆️';
      case 1:
        return '↱';
      case 2:
        return '➡️';
      case 3:
        return '↳';
      case 6:
        return '⬅️';
      case 10:
        return '🎯';
      default:
        return '•';
    }
  };

  const handleAddressChange = async (text) => {
    setAddress(text);

    if (text.length >= 5) {
      try {
        const maxResults = 10;
        const departement = 10;
        const url = `${ItineraireConstants.GEOPLATEFORME_GEOCODAGE_URL}/completion/?text=${encodeURIComponent(
            text
        )}&terr=${departement}&poiType=administratif&type=StreetAddress&maximumResponses=${maxResults}`;

        const response = await fetch(url);
        const data = await response.json();
        setSuggestions(data.results || []);
      } catch (error) {
        console.error('Erreur lors de la récupération des suggestions :', error);
      }
    } else {
      setSuggestions([]);
    }
  };

  const clearAddress = () => {
    setAddress('');
    setSuggestions([]);
    setLocalRoute(null);
    setRoute(null);
    setDestination(null);
    setSummary(null);
    setVoieRapide(null);
    setPk(null);

    if (webviewRef && webviewRef.current) {
      webviewRef.current.postMessage(
          JSON.stringify({
            type: 'clearRoute',
          })
      );
    }
  };

  const fetchRoute = async (depart, destination) => {
    if (!destination) return;
    setLoading(true);

    try {
      const response = await fetch(`${ItineraireConstants.OPENROUTESERVICE_DIRECTIONS_URL}`, {
        method: 'POST',
        headers: {
          Authorization: ItineraireConstants.ORS_API_KEY,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          coordinates: [
            [depart.longitude, depart.latitude],
            [destination.longitude, destination.latitude],
          ],
          instructions: true,
          language: 'fr',
          geometry: true,
        }),
      });

      const data = await response.json();
      const distance = formatDistance(data.routes[0].summary.distance);
      const duration = formatDuration(data.routes[0].summary.duration);

      setSummary({ distance, duration });
      setLocalRoute(data);
      setRoute(data);
    } catch (error) {
      console.error("Erreur lors du calcul de l'itinéraire :", error);
    } finally {
      setLoading(false);
    }
  };

  const getInstructions = (route) => {
    const distance = formatDistance(route.routes[0].summary.distance);
    const duration = formatDuration(route.routes[0].summary.duration);

    const steps = route.routes[0].segments[0].steps;
    const instructions = steps.map((step, index) => ({
      text: formatInstruction(step),
      icon: maneuverIcon(step.type),
      index,
      stepData: step,
    }));

    const handleStepPress = (stepIndex) => {
      setSelectedStepIndex(stepIndex);
      if (webviewRef && webviewRef.current) {
        webviewRef.current.postMessage(
            JSON.stringify({
              type: 'highlightStep',
              stepIndex,
            })
        );
      }
    };

    return (
        <View style={styles.instructionsCard}>
          <View style={styles.instructionsHeader}>
            <Text style={styles.instructionsTitle}>Instructions</Text>
          </View>

          {Platform.OS !== 'web' && (
              <View style={styles.summary}>
                <Text style={{ fontWeight: '900' }}>⏱ {duration}</Text>
                <Text>📏 {distance}</Text>
              </View>
          )}

          <FlatList
              data={instructions}
              contentContainerStyle={{ paddingBottom: 80 }}
              keyExtractor={(_, i) => i.toString()}
              renderItem={({ item }) => (
                  <TouchableOpacity
                      onPress={() => handleStepPress(item.index)}
                      activeOpacity={0.75}
                      style={[
                        styles.instructionItem,
                        selectedStepIndex === item.index && styles.instructionItemSelected,
                      ]}
                  >
                    <View style={styles.instructionIconWrap}>
                      <Text style={styles.instructionIcon}>{item.icon}</Text>
                    </View>
                    <Text style={styles.instructionText}>{item.text}</Text>
                  </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyState}>Aucune instruction disponible.</Text>
              }
          />
        </View>
    );
  };

  const computePkBearing = (pkCurrent, pkNext) => {
    const toRad = (d) => d * Math.PI / 180;
    const toDeg = (r) => r * 180 / Math.PI;

    const φ1 = toRad(pkCurrent.position[0]);
    const φ2 = toRad(pkNext.position[0]);
    const Δλ = toRad(pkNext.position[1] - pkCurrent.position[1]);

    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x =
        Math.cos(φ1) * Math.sin(φ2) -
        Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

    let θ = Math.atan2(y, x);
    θ = toDeg(θ);

    return (θ + 360) % 360;
  };

  async function snapWithFullDirectionDetection(
      lon,
      lat,
      expectedBearing,
      profile = 'driving-car'
  ) {
    const SNAP_URL = `${ItineraireConstants.OPENROUTESERVICE_SNAP_URL}`;
    const ROUTE_URL = `${ItineraireConstants.OPENROUTESERVICE_DIRECTIONS_URL}`;

    const toRad = (d) => d * Math.PI / 180;
    const toDeg = (r) => r * 180 / Math.PI;

    function bearing(lon1, lat1, lon2, lat2) {
      const φ1 = toRad(lat1);
      const φ2 = toRad(lat2);
      const Δλ = toRad(lon2 - lon1);

      const y = Math.sin(Δλ) * Math.cos(φ2);
      const x =
          Math.cos(φ1) * Math.sin(φ2) -
          Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
      return (toDeg(Math.atan2(y, x)) + 360) % 360;
    }

    function bearingDiff(b1, b2) {
      let d = Math.abs(b1 - b2) % 360;
      return d > 180 ? 360 - d : d;
    }

    function movePerpendicular(lon, lat, angle, meters, side = 1) {
      const R = 6378137;
      const brng = toRad(angle + 90 * side);
      const d = meters / R;

      const lat1 = toRad(lat);
      const lon1 = toRad(lon);

      const lat2 = Math.asin(
          Math.sin(lat1) * Math.cos(d) +
          Math.cos(lat1) * Math.sin(d) * Math.cos(brng)
      );

      const lon2 = lon1 + Math.atan2(
          Math.sin(brng) * Math.sin(d) * Math.cos(lat1),
          Math.cos(d) - Math.sin(lat1) * Math.sin(lat2)
      );

      return [toDeg(lon2), toDeg(lat2)];
    }

    function closestBearingWithThreshold(expected, candidates, maxDiff = 90) {
      let best = null;
      let smallestDiff = Infinity;

      for (const b of candidates) {
        if (b == null) continue;
        const diff = angularDifference(b, expected);
        if (diff < smallestDiff) {
          smallestDiff = diff;
          best = b;
        }
      }

      return smallestDiff <= maxDiff ? best : null;
    }

    function angularDifference(b1, b2) {
      let diff = Math.abs(b1 - b2) % 360;
      return diff > 180 ? 360 - diff : diff;
    }

    async function snapPoint(lon, lat) {
      const r = await fetch(SNAP_URL, {
        method: 'POST',
        headers: {
          Authorization: ItineraireConstants.ORS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ locations: [[lon, lat]] }),
      });

      const data = await r.json();
      if (!data.locations?.length) throw new Error('Snap failed');
      return data.locations[0].location;
    }

    async function getSegmentBearing(lon, lat) {
      const offset = 0.0005;
      const north = [lon, lat + offset];
      const south = [lon, lat - offset];

      const tryRoute = async (target) => {
        const r = await fetch(ROUTE_URL, {
          method: 'POST',
          headers: {
            Authorization: ItineraireConstants.ORS_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            coordinates: [[lon, lat], target],
            instructions: false,
            geometry: true,
          }),
        });

        const data = await r.json();
        if (!data.routes?.length) return null;

        const coords = decodePolyline(data.routes[0].geometry);
        if (coords.length < 2) return null;

        return bearing(
            coords[0][0],
            coords[0][1],
            coords[1][0],
            coords[1][1]
        );
      };

      const bNorth = await tryRoute(north);
      const bSouth = await tryRoute(south);

      if (bNorth === null && bSouth === null) {
        throw new Error('Direction detection failed');
      }

      if (bNorth === null) return bSouth;
      if (bSouth === null) return bNorth;

      return bearingDiff(bNorth, expectedBearing) < bearingDiff(bSouth, expectedBearing)
          ? bNorth
          : bSouth;
    }

    function decodePolyline(encoded) {
      const points = [];
      let index = 0;
      let lat = 0;
      let lng = 0;

      while (index < encoded.length) {
        let b;
        let shift = 0;
        let result = 0;

        do {
          b = encoded.charCodeAt(index++) - 63;
          result |= (b & 0x1f) << shift;
          shift += 5;
        } while (b >= 0x20);

        const dlat = (result & 1) ? ~(result >> 1) : (result >> 1);
        lat += dlat;

        shift = 0;
        result = 0;

        do {
          b = encoded.charCodeAt(index++) - 63;
          result |= (b & 0x1f) << shift;
          shift += 5;
        } while (b >= 0x20);

        const dlng = (result & 1) ? ~(result >> 1) : (result >> 1);
        lng += dlng;

        points.push([lng * 1e-5, lat * 1e-5]);
      }

      return points;
    }

    const [snappedLon, snappedLat] = await snapPoint(lon, lat);
    const segmentBearing = await getSegmentBearing(snappedLon, snappedLat);
    const bearingdiff = bearingDiff(segmentBearing, expectedBearing);

    if (bearingdiff > 90) {
      const candidatRight = movePerpendicular(snappedLon, snappedLat, segmentBearing, 10, 1);
      const candidatLeft = movePerpendicular(snappedLon, snappedLat, segmentBearing, 10, -1);

      const snapRight = await snapPoint(...candidatRight);
      const snapLeft = await snapPoint(...candidatLeft);

      const segmentBearingRight = await getSegmentBearing(...snapRight);
      const segmentBearingLeft = await getSegmentBearing(...snapLeft);

      const x = closestBearingWithThreshold(
          expectedBearing,
          [segmentBearingRight, segmentBearingLeft],
          90
      );

      if (x == segmentBearingRight) {
        return { lon: snapRight[0], lat: snapRight[1] };
      } else if (x == segmentBearingLeft) {
        return { lon: snapLeft[0], lat: snapLeft[1] };
      } else {
        return { lon, lat };
      }
    }

    return { lon: snappedLon, lat: snappedLat };
  }

  const handleSuggestionPress = (suggestion) => {
    setSuggestions([]);

    if (startPoint && endPoint) {
      if (endPoint === 'INTERVENTION') {
        setAddress(suggestion.fulltext);
        setFinalAddress(suggestion.fulltext);

        const destination = {
          latitude: suggestion.y,
          longitude: suggestion.x,
        };

        setDestination(destination);

        if (startPoint === 'CIS') {
          fetchRoute(ItineraireConstants.CIS_COORDINATES, destination);
        } else if (startPoint === 'HOPITAL') {
          fetchRoute(ItineraireConstants.CH_COORDINATES, destination);
        }
      } else if (startPoint === 'INTERVENTION') {
        setAddress(startPoint);
        setFinalAddress(startPoint);

        const origine = {
          latitude: suggestion.y,
          longitude: suggestion.x,
        };

        if (endPoint === 'CIS') {
          setDestination(ItineraireConstants.CIS_COORDINATES);
          fetchRoute(origine, ItineraireConstants.CIS_COORDINATES);
        } else if (endPoint === 'HOPITAL') {
          setDestination(ItineraireConstants.CH_COORDINATES);
          fetchRoute(origine, ItineraireConstants.CH_COORDINATES);
        }
      }
    }
  };

  const searchPk = async () => {
    if (voieRapide && pk) {
      const route = voieRapide.split('-')[0];
      const sens = voieRapide.split('-')[1];

      const pkExistant = listePk.filter((obj) => {
        return obj.route == route && obj.pk == pk;
      });

      if (pkExistant && pkExistant.length > 0) {
        setFinalAddress(voieRapide + ' PK' + pk);
        setSuggestions([]);
        setRoute(null);
        setDestination(null);
        setLoading(true);

        let pkSuivant = null;
        if (sens == 'Sens1') {
          pkSuivant = listePk.filter((obj) => {
            return obj.route == route && parseInt(obj.pk) === (parseInt(pk) + 1);
          });
        } else if (sens == 'Sens2') {
          pkSuivant = listePk.filter((obj) => {
            return obj.route == route && parseInt(obj.pk) === (parseInt(pk) - 1);
          });
        }

        let longitude = pkExistant[0].position[1];
        let latitude = pkExistant[0].position[0];

        if (pkSuivant && pkSuivant.length > 0) {
          const expectedBearing = await computePkBearing(pkExistant[0], pkSuivant[0]);
          const coords = await snapWithFullDirectionDetection(
              pkExistant[0].position[1],
              pkExistant[0].position[0],
              expectedBearing
          );

          if (coords.lon && coords.lat) {
            longitude = coords.lon;
            latitude = coords.lat;
          }
        }

        setDestination({ latitude, longitude, pk });
        fetchRoute(ItineraireConstants.CIS_COORDINATES, {
          latitude,
          longitude,
          pk,
          route,
          sens,
        });
      }
    }
  };

  useEffect(() => {
    if (startPoint === 'CIS') {
      setEndPoint('INTERVENTION');
    } else {
      setEndPoint(null);
      clearAddress();
    }
  }, [startPoint]);

  useEffect(() => {
    clearAddress();
  }, [endPoint]);

  useEffect(() => {
    if (startPoint && endPoint) {
      if (startPoint === 'CIS' && endPoint === 'HOPITAL') {
        setAddress('HOPITAL');
        setFinalAddress('HOPITAL');
        setSuggestions([]);
        setDestination(ItineraireConstants.CH_COORDINATES);
        fetchRoute(ItineraireConstants.CIS_COORDINATES, ItineraireConstants.CH_COORDINATES);
      } else if (startPoint === 'HOPITAL' && endPoint === 'CIS') {
        setAddress('CIS');
        setFinalAddress('CIS');
        setSuggestions([]);
        setDestination(ItineraireConstants.CIS_COORDINATES);
        fetchRoute(ItineraireConstants.CH_COORDINATES, ItineraireConstants.CIS_COORDINATES);
      }
    }
  }, [startPoint, endPoint]);

  return (
      <View style={styles.container}>

        <View style={styles.panel}>
          <Text style={styles.sectionTitle}>Recherche d’itinéraire</Text>

          <Text style={styles.label}>Point de départ</Text>
          <View style={styles.chipRow}>
            {startOptions.map((option) => (
                <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.chip,
                      startPoint === option.key && styles.chipActive,
                    ]}
                    onPress={() => setStartPoint(option.key)}
                    activeOpacity={0.8}
                >
                  <Text style={[
                    styles.chipText,
                    startPoint === option.key && styles.chipTextActive,
                  ]}>
                    {option.icon} {option.label}
                  </Text>
                </TouchableOpacity>
            ))}
          </View>

          {startPoint === 'INTERVENTION' && (
              <View style={{ marginTop: 10 }}>
                <View style={styles.inputRow}>
                  <TextInput
                      style={styles.input}
                      value={address}
                      onChangeText={handleAddressChange}
                      placeholder="Entrez une adresse"
                      placeholderTextColor="#9CA3AF"
                  />
                  <TouchableOpacity
                      onPress={clearAddress}
                      style={styles.clearButton}
                      accessibilityLabel="Effacer la saisie"
                  >
                    <Text style={{ fontSize: 18 }}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </View>
          )}

          <View style={{ marginTop: 14 }}>
            <Text style={styles.label}>Point de destination</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                  selectedValue={endPoint}
                  onValueChange={(itemValue) => setEndPoint(itemValue)}
              >
                <Picker.Item label="-- Choisir --" value={null} />
                {getDestinationOptions().includes('INTERVENTION') && (
                    <Picker.Item label="Adresse d'intervention" value="INTERVENTION" />
                )}
                {getDestinationOptions().includes('CIS') && (
                    <Picker.Item label="CIS" value="CIS" />
                )}
                {getDestinationOptions().includes('HOPITAL') && (
                    <Picker.Item label="Hôpital" value="HOPITAL" />
                )}
                {getDestinationOptions().includes('PK') && (
                    <Picker.Item label="PK sur autoroute/voie rapide" value="PK" />
                )}
              </Picker>
            </View>
          </View>

          {endPoint === 'INTERVENTION' && (
              <View style={{ marginTop: 12 }}>
                <View style={styles.inputRow}>
                  <TextInput
                      style={styles.input}
                      value={address}
                      onChangeText={handleAddressChange}
                      placeholder="Entrez une adresse"
                      placeholderTextColor="#9CA3AF"
                  />
                  <TouchableOpacity
                      onPress={clearAddress}
                      style={styles.clearButton}
                      accessibilityLabel="Effacer la saisie"
                  >
                    <Text style={{ fontSize: 18 }}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </View>
          )}

          {endPoint === 'PK' && (
              <View style={{ marginTop: 12 }}>
                <Text style={styles.label}>Choix de la voie rapide</Text>
                <View style={styles.pickerWrapper}>
                  <Picker
                      selectedValue={voieRapide}
                      onValueChange={(itemValue) => setVoieRapide(itemValue)}
                  >
                    <Picker.Item label="-- Choisir --" value={null} />
                    <Picker.Item label="Autoroute A5 Sens 1 (Paris=>Troyes=>Langres)" value="A5-Sens1" />
                    <Picker.Item label="Autoroute A5 Sens 2 (Langres=>Troyes=>Paris)" value="A5-Sens2" />
                    <Picker.Item label="Autoroute A26 Sens 1 (Châlons=>Troyes)" value="A26-Sens1" />
                    <Picker.Item label="Autoroute A26 Sens 2 (Troyes=>Châlons)" value="A26-Sens2" />
                    <Picker.Item label="Rocade D610 Sens 1 (Intérieur)" value="D610-Sens1" />
                    <Picker.Item label="Rocade D610 Sens 2 (Extérieur)" value="D610-Sens2" />
                    <Picker.Item label="N77 Sens 1 (Yonne->Troyes)" value="N77-Sens1" />
                    <Picker.Item label="N77 Sens 2 (Troyes->Yonne)" value="N77-Sens2" />
                  </Picker>
                </View>
              </View>
          )}

          {endPoint === 'PK' && voieRapide && (
              <View style={{ marginTop: 12 }}>
                <View style={styles.inputRow}>
                  <TextInput
                      style={styles.pk}
                      value={pk}
                      onChangeText={(text) => setPk(text)}
                      placeholder="Entrez un PK"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="numeric"
                  />
                  <TouchableOpacity
                      onPress={searchPk}
                      style={styles.validButton}
                      accessibilityLabel="Chercher le pk"
                  >
                    <Text style={{ fontSize: 18, color: '#fff' }}>✔️</Text>
                  </TouchableOpacity>
                </View>
              </View>
          )}

          {suggestions.length > 0 && (
              <View style={styles.suggestionList}>
                <FlatList
                    data={suggestions}
                    keyboardShouldPersistTaps="handled"
                    keyExtractor={(item) => item.fulltext}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.suggestion}
                            onPress={() => handleSuggestionPress(item)}
                            activeOpacity={0.75}
                        >
                          <Text style={styles.suggestionText}>{item.fulltext}</Text>
                        </TouchableOpacity>
                    )}
                />
              </View>
          )}

          <Text style={styles.hint}>
            Astuce : Saisis une suggestion pour remplir l’adresse automatiquement.
          </Text>
        </View>

        <View style={[styles.panel, styles.viewInstruction]}>
          {localRoute && (
              <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 24 }}>
                {getInstructions(localRoute)}
              </ScrollView>
          )}
        </View>

        {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>Calcul de l'itinéraire…</Text>
            </View>
        )}
      </View>
  );
}
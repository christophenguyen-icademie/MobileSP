import { useEvent } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import React, { useRef, useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';

import { downloadDocumentationVideo } from '../utils/documentationVideo';

type Props = {
  source: number | string;
  name: string;
  fileName: string;
};

export default function DocumentationVideo({ source, name, fileName }: Props) {
  const { height } = useWindowDimensions();
  const player = useVideoPlayer(source);
  const { status } = useEvent(player, 'statusChange', { status: player.status });
  const downloadingRef = useRef(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const download = async () => {
    if (downloadingRef.current) return;
    downloadingRef.current = true;
    setDownloading(true);
    setDownloadError(null);
    try {
      await downloadDocumentationVideo(source, fileName);
    } catch (error) {
      setDownloadError(error instanceof Error ? error.message : 'Impossible de télécharger la vidéo.');
    } finally {
      downloadingRef.current = false;
      setDownloading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text accessibilityRole="header" style={styles.title}>{name}</Text>
      <View style={[styles.playerContainer, { maxHeight: Math.max(180, height - 280) }]}>
        <VideoView
          player={player}
          nativeControls
          fullscreenOptions={{ enable: true }}
          contentFit="contain"
          style={styles.player}
        />
        {(status === 'idle' || status === 'loading') && (
          <View pointerEvents="none" style={styles.loading}>
            <ActivityIndicator size="large" color="#ffffff" accessibilityLabel="Chargement de la vidéo" />
          </View>
        )}
      </View>
      {status === 'error' && (
        <Text accessibilityRole="alert" style={styles.error}>
          Impossible de lire cette vidéo sur cet appareil. Vous pouvez la télécharger pour l’ouvrir avec un lecteur compatible.
        </Text>
      )}
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityState={{ disabled: downloading, busy: downloading }}
        onPress={download}
        disabled={downloading}
        style={[styles.downloadButton, downloading && styles.disabledButton]}
      >
        {downloading ? <ActivityIndicator color="#ffffff" /> : <Ionicons name="download-outline" size={20} color="#ffffff" />}
        <Text style={styles.downloadText}>{downloading ? 'Préparation…' : 'Télécharger la vidéo'}</Text>
      </TouchableOpacity>
      {downloadError && <Text accessibilityRole="alert" style={styles.error}>{downloadError}</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, backgroundColor: '#f6f7fb' },
  title: { color: '#20243b', fontSize: 18, lineHeight: 27, fontWeight: '700', marginBottom: 18 },
  playerContainer: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000000', borderRadius: 14, overflow: 'hidden' },
  player: { width: '100%', height: '100%' },
  loading: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  downloadButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#1f176a', padding: 16, borderRadius: 12, marginTop: 20 },
  disabledButton: { opacity: 0.6 },
  downloadText: { color: '#ffffff', fontWeight: '600' },
  error: { color: '#b42318', marginTop: 12 },
});

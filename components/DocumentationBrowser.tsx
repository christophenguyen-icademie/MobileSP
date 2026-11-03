import Ionicons from '@expo/vector-icons/Ionicons';
import { isRunningInExpoGo } from 'expo';
import { Asset } from 'expo-asset';
import * as Sharing from 'expo-sharing';
import React, { useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DocumentationVideo from './DocumentationVideo';
import PdfViewerExpo from './PdfViewer';
import { DOCUMENTATION_VIDEOS } from '../constants/documentationVideos';

export type DocumentationNode = {
  type: string;
  name: string;
  url?: string | number;
  children?: DocumentationNode[];
};

type Props = {
  nodes: DocumentationNode[];
  title?: string;
  subtitle?: string;
};

type OpenDocument =
  | { type: 'file'; name: string; url: string | number }
  | { type: 'video'; name: string; url: string; source: number | string };

function countResources(nodes: DocumentationNode[]): { documents: number; videos: number } {
  return nodes.reduce((counts, node) => {
    if (node.type === 'folder') {
      const children = countResources(node.children ?? []);
      counts.documents += children.documents;
      counts.videos += children.videos;
    } else if (node.type === 'video') {
      counts.videos += 1;
    } else {
      counts.documents += 1;
    }
    return counts;
  }, { documents: 0, videos: 0 });
}

function resourceSummary(nodes: DocumentationNode[]) {
  const { documents, videos } = countResources(nodes);
  return [
    documents ? `${documents} document${documents > 1 ? 's' : ''}` : '',
    videos ? `${videos} vidéo${videos > 1 ? 's' : ''}` : '',
  ].filter(Boolean).join(' · ');
}

export default function DocumentationBrowser({
  nodes,
  title = 'Documentation',
  subtitle = 'Référentiels, guides et vidéos pour vos formations.',
}: Props) {
  const resourceCounts = countResources(nodes);
  const { width, height } = useWindowDimensions();
  const twoColumns = width >= 900;
  const spacious = width >= 768;
  const [selectedFile, setSelectedFile] = useState<OpenDocument | null>(null);
  const [openError, setOpenError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(nodes.map((node, index) => [`${node.name}-${index}`, true])),
  );
  const toggle = (path: string) => setExpanded((s) => ({ ...s, [path]: !s[path] }));
  const closeFile = () => setSelectedFile(null);

  const viewFile = async (node: DocumentationNode) => {
    if (node.url == null) return;
    setOpenError(null);
    if (node.type === 'video') {
      if (typeof node.url !== 'string') return;
      const source = DOCUMENTATION_VIDEOS[node.url] ?? (/^https?:\/\//i.test(node.url) ? node.url : null);
      if (source === null) {
        setOpenError(`La vidéo « ${node.name} » est introuvable.`);
        return;
      }
      setSelectedFile({ type: 'video', name: node.name, url: node.url, source });
      return;
    }

    // La WebView Android ne sait pas afficher directement un PDF local.
    if (typeof node.url === 'number' && Platform.OS === 'android') {
      try {
        const asset = Asset.fromModule(node.url);
        await asset.downloadAsync();
        if (!asset.localUri) throw new Error('PDF local indisponible');

        if (isRunningInExpoGo()) {
          await Sharing.shareAsync(asset.localUri, { mimeType: 'application/pdf', dialogTitle: node.name });
        } else {
          const { default: ReactNativeBlobUtil } = await import('react-native-blob-util');
          const path = decodeURIComponent(asset.localUri.replace(/^file:\/\//, ''));
          await ReactNativeBlobUtil.android.actionViewIntent(path, 'application/pdf');
        }
      } catch {
        setOpenError(`Impossible d'ouvrir « ${node.name} ». Vérifiez qu'un lecteur PDF est installé.`);
      }
      return;
    }

    setSelectedFile({ type: 'file', name: node.name, url: node.url });
  };

  const renderNode = (node: DocumentationNode, path = node.name, level = 0): React.ReactNode => {
    if (node.type === 'folder') {
      const isOpen = !!expanded[path];
      const nested = level > 0;
      return (
        <View key={path} style={[styles.folder, nested && styles.nestedFolder]}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: isOpen }}
            onPress={() => toggle(path)}
            style={({ pressed }) => [styles.folderHeader, nested && styles.nestedHeader, pressed && styles.pressed]}
          >
            <View style={[styles.folderIcon, nested && styles.nestedIcon]}>
              <Ionicons name={nested ? 'folder-outline' : 'library-outline'} size={nested ? 22 : 26} color="#1f176a" />
            </View>
            <View style={styles.rowContent}>
              <Text style={[styles.folderTitle, nested && styles.nestedTitle]}>{node.name}</Text>
              <Text style={styles.folderSummary}>{resourceSummary(node.children ?? [])}</Text>
            </View>
            <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={20} color="#75809a" />
          </Pressable>
          {isOpen && (
            <View style={[styles.resourceGrid, nested && styles.nestedGrid]}>
              {node.children?.map((child, index) => renderNode(child, `${path}/${child.name}-${index}`, level + 1))}
            </View>
          )}
        </View>
      );
    }

    const isVideo = node.type === 'video';
    const accent = isVideo ? '#1f176a' : '#b34b3f';
    return (
      <Pressable
        key={path}
        accessibilityRole="button"
        accessibilityLabel={`${isVideo ? 'Lire la vidéo' : 'Consulter le document'} : ${node.name}`}
        onPress={() => viewFile(node)}
        style={({ pressed }) => [styles.resourceCard, { flexBasis: twoColumns ? '46%' : '100%' }, pressed && styles.pressed]}
      >
        <View style={[styles.resourceIcon, isVideo ? styles.videoIcon : styles.pdfIcon]}>
          <Ionicons name={isVideo ? 'play' : 'document-text-outline'} size={22} color={accent} />
        </View>
        <View style={styles.rowContent}>
          <Text style={styles.resourceTitle}>{node.name}</Text>
          <View style={styles.resourceMeta}>
            <View style={[styles.typeBadge, isVideo ? styles.videoIcon : styles.pdfIcon]}>
              <Text style={[styles.typeText, { color: accent }]}>{isVideo ? 'VIDÉO' : 'PDF'}</Text>
            </View>
            <Text style={styles.resourceAction}>{isVideo ? 'Lire la vidéo' : 'Consulter'}</Text>
          </View>
        </View>
        <Ionicons name="arrow-forward" size={18} color="#75809a" />
      </Pressable>
    );
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.content, spacious && styles.spaciousContent]}>
          <View style={[styles.hero, spacious && styles.spaciousHero]}>
            <View style={styles.heroHeading}>
              <View style={styles.rowContent}>
                <Text accessibilityRole="header" style={[styles.title, spacious && styles.largeTitle]}>{title}</Text>
                <Text style={styles.subtitle}>{subtitle}</Text>
              </View>
              {spacious && (
                <View style={styles.heroIcon}>
                  <Ionicons name="book-outline" size={36} color="#ffffff" />
                </View>
              )}
            </View>
            <View style={styles.heroStats}>
              <View style={styles.statBadge}>
                <Ionicons name="document-text-outline" size={16} color="#ffffff" />
                <Text style={styles.statText}>{resourceCounts.documents} documents</Text>
              </View>
              <View style={styles.statBadge}>
                <Ionicons name="videocam-outline" size={17} color="#ffffff" />
                <Text style={styles.statText}>{resourceCounts.videos} vidéos</Text>
              </View>
            </View>
          </View>

          <View style={styles.sectionHeading}>
            <Text accessibilityRole="header" style={styles.sectionTitle}>Vos ressources</Text>
            <Text style={styles.sectionCount}>{nodes.every((node) => node.type === 'folder')
              ? `${nodes.length} catégorie${nodes.length > 1 ? 's' : ''}`
              : resourceSummary(nodes)}</Text>
          </View>
          <View style={styles.folders}>
            {nodes.map((node, index) => renderNode(node, `${node.name}-${index}`, 0))}
          </View>
          {openError && <Text accessibilityRole="alert" style={styles.error}>{openError}</Text>}
        </View>
      </ScrollView>

      <Modal transparent visible={selectedFile !== null} animationType="fade" onRequestClose={closeFile}>
        <View style={[styles.modalBackdrop, spacious && styles.spaciousBackdrop]}>
          <SafeAreaView
            style={[
              styles.modal,
              spacious && { borderRadius: 24, maxHeight: Math.max(240, Math.min(900, height - 64)) },
            ]}
          >
            <View style={styles.modalHeader}>
              <View style={styles.rowContent}>
                <Text style={styles.modalLabel}>DOCUMENTATION</Text>
                <Text style={styles.modalTitle}>{selectedFile?.type === 'video' ? 'Lecture vidéo' : selectedFile?.name}</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Fermer le lecteur"
                onPress={closeFile}
                style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}
              >
                <Ionicons name="close" size={20} color="#1f176a" />
                <Text style={styles.closeText}>Fermer</Text>
              </Pressable>
            </View>
            {selectedFile?.type === 'video' ? (
              <DocumentationVideo
                key={selectedFile.url}
                source={selectedFile.source}
                name={selectedFile.name}
                fileName={selectedFile.url}
              />
            ) : selectedFile?.type === 'file' ? (
              <PdfViewerExpo key={selectedFile.url} initialUri={selectedFile.url} />
            ) : null}
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f3f5fa' },
  scrollContent: { flexGrow: 1, alignItems: 'center' },
  content: { width: '100%', maxWidth: 1160, padding: 16, paddingBottom: 32 },
  spaciousContent: { padding: 32, paddingBottom: 48 },
  hero: { backgroundColor: '#1f176a', borderRadius: 22, padding: 22 },
  spaciousHero: { padding: 32 },
  heroHeading: { flexDirection: 'row', alignItems: 'center', gap: 24 },
  rowContent: { flex: 1, minWidth: 0 },
  title: { color: '#ffffff', fontSize: 28, fontWeight: '800', letterSpacing: -0.7 },
  largeTitle: { fontSize: 36 },
  subtitle: { color: '#dedcf4', fontSize: 15, lineHeight: 23, marginTop: 8 },
  heroIcon: { width: 72, height: 72, borderRadius: 20, backgroundColor: '#ffffff18', alignItems: 'center', justifyContent: 'center' },
  heroStats: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 22 },
  statBadge: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: '#ffffff18', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8 },
  statText: { color: '#ffffff', fontSize: 13, fontWeight: '600' },
  sectionHeading: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 28, marginBottom: 14 },
  sectionTitle: { color: '#20243b', fontSize: 20, fontWeight: '700' },
  sectionCount: { color: '#75809a', fontSize: 13 },
  folders: { gap: 18 },
  folder: { width: '100%', backgroundColor: '#ffffff', borderRadius: 18, borderWidth: 1, borderColor: '#e1e6f0', overflow: 'hidden' },
  nestedFolder: { backgroundColor: '#f6f7fd', borderRadius: 14, borderColor: '#e1e3f3' },
  folderHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18, minHeight: 84 },
  nestedHeader: { padding: 14, gap: 12, minHeight: 76 },
  folderIcon: { width: 46, height: 46, borderRadius: 14, backgroundColor: '#eeedf9', alignItems: 'center', justifyContent: 'center' },
  nestedIcon: { width: 38, height: 38, borderRadius: 11, backgroundColor: '#e9e8f6' },
  folderTitle: { color: '#20243b', fontWeight: '700', fontSize: 18, lineHeight: 25 },
  nestedTitle: { color: '#1f176a', fontSize: 15, lineHeight: 22 },
  folderSummary: { color: '#75809a', fontSize: 12, lineHeight: 18, marginTop: 3 },
  resourceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 14, paddingBottom: 14 },
  nestedGrid: { paddingHorizontal: 10, paddingBottom: 10, gap: 10 },
  resourceCard: { flexGrow: 1, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, minHeight: 88, borderWidth: 1, borderColor: '#e7eaf2', borderRadius: 12, backgroundColor: '#ffffff' },
  resourceIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  videoIcon: { backgroundColor: '#eeedf9' },
  pdfIcon: { backgroundColor: '#fff0eb' },
  resourceTitle: { color: '#2d334b', fontSize: 14, lineHeight: 21, fontWeight: '600' },
  resourceMeta: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 8 },
  typeBadge: { borderRadius: 5, paddingHorizontal: 6, paddingVertical: 3 },
  typeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  resourceAction: { color: '#75809a', fontSize: 12 },
  pressed: { opacity: 0.65 },
  error: { color: '#b42318', marginTop: 16, lineHeight: 22 },
  modalBackdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#11132bcc' },
  spaciousBackdrop: { padding: 32 },
  modal: { flex: 1, width: '100%', maxWidth: 1080, backgroundColor: '#ffffff', overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 18, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#e7eaf2' },
  modalLabel: { color: '#75809a', fontSize: 10, fontWeight: '700', letterSpacing: 1.2, marginBottom: 4 },
  modalTitle: { color: '#20243b', fontSize: 16, fontWeight: '700', lineHeight: 23 },
  closeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, backgroundColor: '#eeedf9', borderRadius: 10, paddingHorizontal: 10, minHeight: 44 },
  closeText: { color: '#1f176a', fontSize: 13, fontWeight: '600' },
});

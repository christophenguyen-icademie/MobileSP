import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import docManifest from '../../assets/documentation/manifest';
import PdfViewerExpo from '../../components/PdfViewer';

export default function DocumentationScreen() {
  const [tree] = useState(docManifest);
  const [pdfUri, setPdfUri] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const toggle = (path: string) => setExpanded((s) => ({ ...s, [path]: !s[path] }));

  const viewFile = async (modulePath: any) => {
    try {
     
      setPdfUri(modulePath);
      setModalVisible(true);

      return;
    } catch (e) {
      console.error('Erreur ouverture fichier:', e);
    }
  };

  const renderNode = (node: any, path = node.name, level = 0) => {
    if(level===1){
      console.log(node,path);
    }
    if (node.type === 'folder') {
      const isOpen = !!expanded[path];
      return (
        <View key={path} style={{ paddingLeft: 12 * level }}>
          <TouchableOpacity onPress={() => toggle(path)} style={styles.folderRow}>
            <Text style={styles.folderText}>{isOpen ? '📂' : '📁'} {node.name}</Text>
          </TouchableOpacity>
          {isOpen && node.children && node.children.map((c: any, i: number) => renderNode(c, `${c.name}`, level + 1))}
        </View>
      );
    }
    // file
    return (
      <TouchableOpacity key={path} onPress={() => viewFile(node.url)} style={[styles.fileRow, { paddingLeft: 12 * level }]}>
        <Text style={styles.fileText}>📄 {node.name}</Text>
      </TouchableOpacity>
    );
  };
  return (
    <View style={{ flex: 1 , marginTop: 30}}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {tree.map((n: any, i: number) => renderNode(n, `${n.name}-${i}`, 0))}
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={{ flex: 1 }}>
          <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
            <Text style={{ color: '#007AFF' }}>Fermer</Text>
          </TouchableOpacity>
            {pdfUri ? (
            <PdfViewerExpo initialUri={pdfUri} />
            ) : ""}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  folderRow: { paddingVertical: 8 },
  folderText: { fontWeight: '700', fontSize: 16 },
  fileRow: { paddingVertical: 6 },
  fileText: { color: '#007AFF' },
  closeBtn: { padding: 12 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  openLink: { color: '#007AFF', marginTop: 12 },
});
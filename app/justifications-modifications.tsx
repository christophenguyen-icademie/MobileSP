import { Stack } from 'expo-router';

import docManifest from '@/assets/documentation/manifest';
import DocumentationBrowser from '@/components/DocumentationBrowser';

const ressources = docManifest.find((node) => node.type === 'folder' && node.name === 'Secourisme')?.children ?? [];

export default function JustificationsModifications() {
  return (
    <>
      <Stack.Screen options={{ title: 'Justifications des modifications' }} />
      <DocumentationBrowser
        nodes={ressources}
        title="Justifications des modifications"
        subtitle="Vidéos et référentiels de secourisme."
      />
    </>
  );
}

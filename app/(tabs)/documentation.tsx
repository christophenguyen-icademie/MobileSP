import docManifest from '@/assets/documentation/manifest';
import DocumentationBrowser from '@/components/DocumentationBrowser';

export default function DocumentationScreen() {
  return <DocumentationBrowser nodes={docManifest} />;
}

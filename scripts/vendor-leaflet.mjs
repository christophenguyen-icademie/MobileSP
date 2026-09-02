#!/usr/bin/env node
/**
 * Télécharge les ressources distantes utilisées par components/Itineraires/LeafletMap.ts
 * et les écrit sous forme de modules TypeScript dans components/Itineraires/vendor/.
 *
 * Ces modules sont ensuite inlinés dans le HTML de la WebView, ce qui rend la carte
 * fonctionnelle sans réseau (hors tuiles, voir README du dossier vendor).
 *
 * Usage : npm run vendor:leaflet
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(ROOT, 'components', 'Itineraires', 'vendor');

const LEAFLET_VERSION = '1.9.4';
const MARKERCLUSTER_VERSION = '1.5.3';
const PROJ4_VERSION = '2.9.0';

const LEAFLET_BASE = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist`;
const MARKERCLUSTER_BASE = `https://unpkg.com/leaflet.markercluster@${MARKERCLUSTER_VERSION}/dist`;

/** Images référencées en `url(images/...)` par leaflet.css : inlinées en data URI. */
const LEAFLET_CSS_IMAGES = ['layers.png', 'layers-2x.png', 'marker-icon.png'];

/** Images chargées par leaflet.js pour `L.Icon.Default` (marqueur sans icône explicite). */
const LEAFLET_MARKER_IMAGES = {
  iconUrl: 'marker-icon.png',
  iconRetinaUrl: 'marker-icon-2x.png',
  shadowUrl: 'marker-shadow.png',
};

async function fetchText(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`GET ${url} -> ${res.status} ${res.statusText}`);
  }
  return res.text();
}

async function fetchDataUri(url, mimeType) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`GET ${url} -> ${res.status} ${res.statusText}`);
  }
  const base64 = Buffer.from(await res.arrayBuffer()).toString('base64');
  return `data:${mimeType};base64,${base64}`;
}

/**
 * Un `</script>` littéral dans le code inliné fermerait la balise HTML.
 * Dans les libs concernées, cette séquence n'apparaît qu'à l'intérieur de
 * chaînes de caractères, où `<\/script` est équivalent.
 */
function protectScriptTag(source, label) {
  if (!source.includes('</script')) {
    return source;
  }
  console.warn(`  ! séquence "</script" échappée dans ${label}`);
  return source.replaceAll('</script', '<\\/script');
}

async function writeModule(fileName, exportName, content, sourceUrl) {
  const banner =
    `// Fichier généré par scripts/vendor-leaflet.mjs — ne pas éditer à la main.\n` +
    `// Source : ${sourceUrl}\n`;
  const body = `const ${exportName} = ${JSON.stringify(content)};\n\nexport default ${exportName};\n`;
  await writeFile(join(OUT_DIR, fileName), banner + '\n' + body, 'utf8');
  const kb = (Buffer.byteLength(content, 'utf8') / 1024).toFixed(1);
  console.log(`  ✓ ${fileName} (${kb} kB)`);
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  console.log('Téléchargement des images Leaflet…');
  const imageUris = {};
  const imageNames = new Set([
    ...LEAFLET_CSS_IMAGES,
    ...Object.values(LEAFLET_MARKER_IMAGES),
  ]);
  for (const name of imageNames) {
    imageUris[name] = await fetchDataUri(`${LEAFLET_BASE}/images/${name}`, 'image/png');
  }

  console.log('Génération des modules…');

  const markerImages = Object.fromEntries(
    Object.entries(LEAFLET_MARKER_IMAGES).map(([option, name]) => [option, imageUris[name]]),
  );
  await writeFile(
    join(OUT_DIR, 'leafletMarkerImages.ts'),
    `// Fichier généré par scripts/vendor-leaflet.mjs — ne pas éditer à la main.\n` +
      `// Source : ${LEAFLET_BASE}/images/\n\n` +
      `const leafletMarkerImages = ${JSON.stringify(markerImages, null, 2)};\n\n` +
      `export default leafletMarkerImages;\n`,
    'utf8',
  );
  console.log('  ✓ leafletMarkerImages.ts');

  const leafletCssUrl = `${LEAFLET_BASE}/leaflet.css`;
  let leafletCss = await fetchText(leafletCssUrl);
  for (const name of LEAFLET_CSS_IMAGES) {
    leafletCss = leafletCss.replaceAll(`url(images/${name})`, `url(${imageUris[name]})`);
  }
  if (/url\(images\//.test(leafletCss)) {
    throw new Error('leaflet.css référence encore une image non inlinée');
  }
  await writeModule('leafletCss.ts', 'leafletCss', leafletCss, leafletCssUrl);

  const clusterCssUrl = `${MARKERCLUSTER_BASE}/MarkerCluster.css`;
  await writeModule(
    'markerClusterCss.ts',
    'markerClusterCss',
    await fetchText(clusterCssUrl),
    clusterCssUrl,
  );

  const clusterDefaultCssUrl = `${MARKERCLUSTER_BASE}/MarkerCluster.Default.css`;
  await writeModule(
    'markerClusterDefaultCss.ts',
    'markerClusterDefaultCss',
    await fetchText(clusterDefaultCssUrl),
    clusterDefaultCssUrl,
  );

  const leafletJsUrl = `${LEAFLET_BASE}/leaflet.js`;
  await writeModule(
    'leafletJs.ts',
    'leafletJs',
    protectScriptTag(await fetchText(leafletJsUrl), 'leaflet.js'),
    leafletJsUrl,
  );

  const clusterJsUrl = `${MARKERCLUSTER_BASE}/leaflet.markercluster.js`;
  await writeModule(
    'markerClusterJs.ts',
    'markerClusterJs',
    protectScriptTag(await fetchText(clusterJsUrl), 'leaflet.markercluster.js'),
    clusterJsUrl,
  );

  const proj4Url = `https://cdnjs.cloudflare.com/ajax/libs/proj4js/${PROJ4_VERSION}/proj4.js`;
  await writeModule(
    'proj4Js.ts',
    'proj4Js',
    protectScriptTag(await fetchText(proj4Url), 'proj4.js'),
    proj4Url,
  );

  console.log(`\nTerminé — modules écrits dans ${OUT_DIR}`);
}

main().catch((error) => {
  console.error(`\nÉchec : ${error.message}`);
  process.exit(1);
});

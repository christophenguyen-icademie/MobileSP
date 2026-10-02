import { readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const directory = path.join(root, 'assets/documentation/justifications');
const files = (await readdir(directory, { withFileTypes: true }))
  .filter((entry) => entry.isFile() && entry.name.endsWith('.webm'))
  .map((entry) => entry.name)
  .sort();
const entries = files.map(
  (file) => `  ${JSON.stringify(file)}: require(${JSON.stringify(`../assets/documentation/justifications/${file}`)}),`,
);

await writeFile(
  path.join(root, 'constants/documentationVideos.ts'),
  `// Fichier généré par scripts/generate-documentation-assets.mjs.\nexport const DOCUMENTATION_VIDEOS: Record<string, number> = {\n${entries.join('\n')}\n};\n`,
);

console.log(`${files.length} vidéos de documentation indexées.`);

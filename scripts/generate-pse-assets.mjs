import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const directory = path.join(root, "assets/pse/fiches/Références techniques nationales - PSE - Fiches");
const fiches = JSON.parse(await readFile(path.join(directory, "fiches.json"), "utf8"));
const lines = fiches.map(
  ({ nom, fichier }) =>
    `  ${JSON.stringify(nom)}: require(${JSON.stringify(`../assets/pse/fiches/Références techniques nationales - PSE - Fiches/${fichier}`)}),`,
);
const dataLines = fiches.map(
  ({ nom }) =>
    `  ${JSON.stringify(nom)}: require(${JSON.stringify(`../assets/pse/fiches/Références techniques nationales - PSE - Fiches/${nom}.json`)}),`,
);

await writeFile(
  path.join(root, "constants/pseAssets.ts"),
  `// Fichier généré par scripts/generate-pse-assets.mjs.\nexport const PSE_ASSETS: Record<string, number> = {\n${lines.join("\n")}\n};\n`,
);

await writeFile(
  path.join(root, "constants/pseData.ts"),
  `// Fichier généré par scripts/generate-pse-assets.mjs.\nimport type { FichePseDetail } from "@/types/pse";\n\nexport const PSE_DATA: Record<string, FichePseDetail> = {\n${dataLines.join("\n")}\n};\n`,
);

console.log(`${lines.length} ressources PDF et fiches JSON indexées.`);

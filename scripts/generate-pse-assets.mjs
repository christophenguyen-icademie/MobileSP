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

const supplements = [
  { referentiel: "PSC", dossier: "Références techniques nationales - PSC1" },
  { referentiel: "GQS", dossier: "Références techniques nationales - GQS - Fiches" },
];
const assetLines = [];
const detailLines = [];
let total = fiches.length;
for (const { referentiel, dossier } of supplements) {
  const index = JSON.parse(await readFile(path.join(root, "assets/pse/fiches", dossier, "fiches.json"), "utf8"));
  for (const { nom, fichier } of index) {
    const id = `${referentiel}:${nom}`;
    assetLines.push(`  ${JSON.stringify(id)}: require(${JSON.stringify(`../assets/pse/fiches/${dossier}/${fichier}`)}),`);
    detailLines.push(`  ${JSON.stringify(id)}: require(${JSON.stringify(`../assets/pse/fiches/${dossier}/${nom}.json`)}),`);
  }
  total += index.length;
}

await writeFile(path.join(root, "constants/secourisme.ts"), `// Fichier généré par scripts/generate-pse-assets.mjs.
import fichesPse from "@/assets/pse/fiches/Références techniques nationales - PSE - Fiches/fiches.json";
import fichesPsc from "@/assets/pse/fiches/Références techniques nationales - PSC1/fiches.json";
import fichesGqs from "@/assets/pse/fiches/Références techniques nationales - GQS - Fiches/fiches.json";
import type { FichePse, FichePseDetail, FicheSecourisme, ReferentielSecourisme } from "@/types/pse";
import { PSE_ASSETS } from "./pseAssets";
import { PSE_DATA } from "./pseData";

export function identifiantFiche(referentiel: ReferentielSecourisme, reference: string): string {
  return referentiel === "PSE" ? reference : referentiel + ":" + reference;
}

const referentiels: { referentiel: ReferentielSecourisme; fiches: FichePse[] }[] = [
  { referentiel: "PSE", fiches: fichesPse as FichePse[] },
  { referentiel: "PSC", fiches: fichesPsc as FichePse[] },
  { referentiel: "GQS", fiches: fichesGqs as FichePse[] },
];

export const FICHES_SECOURISME: FicheSecourisme[] = referentiels.flatMap(({ referentiel, fiches }) =>
  fiches.map((fiche) => ({ ...fiche, referentiel, id: identifiantFiche(referentiel, fiche.nom) })),
);

export const SECOURISME_DATA: Record<string, FichePseDetail> = {
  ...PSE_DATA,
${detailLines.join("\n")}
};

export const SECOURISME_ASSETS: Record<string, number | string> = {
  ...PSE_ASSETS,
${assetLines.join("\n")}
};
`);
console.log(`${total} fiches PSE, PSC et GQS indexées pour le formulaire Secourisme.`);

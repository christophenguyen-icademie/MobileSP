export type NiveauPse = "PSE 1" | "PSE 2";

export type BlocPse =
  | { type: "paragraphe"; texte: string }
  | { type: "liste"; elements: { niveau: 1 | 2; texte: string }[] };

export type FichePse = {
  nom: string;
  titre: string;
  niveaux: NiveauPse[];
  chapitre: string;
  fichier: string;
};

export type FichePseDetail = {
  nom: string;
  titre: string;
  niveaux: NiveauPse[];
  chapitre_principal: string;
  chapitres: { titre: string; contenu: BlocPse[] }[];
  notes: string[];
};

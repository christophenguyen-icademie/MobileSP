// Fichier généré par scripts/generate-pse-assets.mjs.
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
  "PSC:01AC01": require("../assets/pse/fiches/Références techniques nationales - PSC1/01AC01.json"),
  "PSC:01AC02": require("../assets/pse/fiches/Références techniques nationales - PSC1/01AC02.json"),
  "PSC:01AC03": require("../assets/pse/fiches/Références techniques nationales - PSC1/01AC03.json"),
  "PSC:01AC04": require("../assets/pse/fiches/Références techniques nationales - PSC1/01AC04.json"),
  "PSC:01AC05": require("../assets/pse/fiches/Références techniques nationales - PSC1/01AC05.json"),
  "PSC:02PR01": require("../assets/pse/fiches/Références techniques nationales - PSC1/02PR01.json"),
  "PSC:02FT01": require("../assets/pse/fiches/Références techniques nationales - PSC1/02FT01.json"),
  "PSC:02FT02": require("../assets/pse/fiches/Références techniques nationales - PSC1/02FT02.json"),
  "PSC:02PR02": require("../assets/pse/fiches/Références techniques nationales - PSC1/02PR02.json"),
  "PSC:02FT03": require("../assets/pse/fiches/Références techniques nationales - PSC1/02FT03.json"),
  "PSC:02FT04": require("../assets/pse/fiches/Références techniques nationales - PSC1/02FT04.json"),
  "PSC:02FT05": require("../assets/pse/fiches/Références techniques nationales - PSC1/02FT05.json"),
  "PSC:02PR03": require("../assets/pse/fiches/Références techniques nationales - PSC1/02PR03.json"),
  "PSC:02FT06": require("../assets/pse/fiches/Références techniques nationales - PSC1/02FT06.json"),
  "PSC:02FT07": require("../assets/pse/fiches/Références techniques nationales - PSC1/02FT07.json"),
  "PSC:02FT08": require("../assets/pse/fiches/Références techniques nationales - PSC1/02FT08.json"),
  "PSC:02FT09": require("../assets/pse/fiches/Références techniques nationales - PSC1/02FT09.json"),
  "PSC:02AC01": require("../assets/pse/fiches/Références techniques nationales - PSC1/02AC01.json"),
  "PSC:02PR04": require("../assets/pse/fiches/Références techniques nationales - PSC1/02PR04.json"),
  "PSC:02FT10": require("../assets/pse/fiches/Références techniques nationales - PSC1/02FT10.json"),
  "PSC:02PR05": require("../assets/pse/fiches/Références techniques nationales - PSC1/02PR05.json"),
  "PSC:02FT11": require("../assets/pse/fiches/Références techniques nationales - PSC1/02FT11.json"),
  "PSC:02PR06": require("../assets/pse/fiches/Références techniques nationales - PSC1/02PR06.json"),
  "PSC:02PR07": require("../assets/pse/fiches/Références techniques nationales - PSC1/02PR07.json"),
  "PSC:02PR08": require("../assets/pse/fiches/Références techniques nationales - PSC1/02PR08.json"),
  "PSC:03AC01": require("../assets/pse/fiches/Références techniques nationales - PSC1/03AC01.json"),
  "GQS:01AC01": require("../assets/pse/fiches/Références techniques nationales - GQS - Fiches/01AC01.json"),
  "GQS:01AC02": require("../assets/pse/fiches/Références techniques nationales - GQS - Fiches/01AC02.json"),
  "GQS:01AC03": require("../assets/pse/fiches/Références techniques nationales - GQS - Fiches/01AC03.json"),
  "GQS:02PR01": require("../assets/pse/fiches/Références techniques nationales - GQS - Fiches/02PR01.json"),
  "GQS:02FT01": require("../assets/pse/fiches/Références techniques nationales - GQS - Fiches/02FT01.json"),
  "GQS:02FT02": require("../assets/pse/fiches/Références techniques nationales - GQS - Fiches/02FT02.json"),
  "GQS:02PR02": require("../assets/pse/fiches/Références techniques nationales - GQS - Fiches/02PR02.json"),
  "GQS:02FT03": require("../assets/pse/fiches/Références techniques nationales - GQS - Fiches/02FT03.json"),
  "GQS:02FT04": require("../assets/pse/fiches/Références techniques nationales - GQS - Fiches/02FT04.json"),
  "GQS:02FT05": require("../assets/pse/fiches/Références techniques nationales - GQS - Fiches/02FT05.json"),
  "GQS:02AC01": require("../assets/pse/fiches/Références techniques nationales - GQS - Fiches/02AC01.json"),
  "GQS:02PR03": require("../assets/pse/fiches/Références techniques nationales - GQS - Fiches/02PR03.json"),
  "GQS:02FT06": require("../assets/pse/fiches/Références techniques nationales - GQS - Fiches/02FT06.json"),
  "GQS:02PR04": require("../assets/pse/fiches/Références techniques nationales - GQS - Fiches/02PR04.json"),
  "GQS:03AC01": require("../assets/pse/fiches/Références techniques nationales - GQS - Fiches/03AC01.json"),
  "GQS:03AC02": require("../assets/pse/fiches/Références techniques nationales - GQS - Fiches/03AC02.json"),
};

export const SECOURISME_ASSETS: Record<string, number | string> = {
  ...PSE_ASSETS,
  "PSC:01AC01": require("../assets/pse/fiches/Références techniques nationales - PSC1/01AC01.pdf"),
  "PSC:01AC02": require("../assets/pse/fiches/Références techniques nationales - PSC1/01AC02.pdf"),
  "PSC:01AC03": require("../assets/pse/fiches/Références techniques nationales - PSC1/01AC03.pdf"),
  "PSC:01AC04": require("../assets/pse/fiches/Références techniques nationales - PSC1/01AC04.pdf"),
  "PSC:01AC05": require("../assets/pse/fiches/Références techniques nationales - PSC1/01AC05.pdf"),
  "PSC:02PR01": require("../assets/pse/fiches/Références techniques nationales - PSC1/02PR01.pdf"),
  "PSC:02FT01": require("../assets/pse/fiches/Références techniques nationales - PSC1/02FT01.pdf"),
  "PSC:02FT02": require("../assets/pse/fiches/Références techniques nationales - PSC1/02FT02.pdf"),
  "PSC:02PR02": require("../assets/pse/fiches/Références techniques nationales - PSC1/02PR02.pdf"),
  "PSC:02FT03": require("../assets/pse/fiches/Références techniques nationales - PSC1/02FT03.pdf"),
  "PSC:02FT04": require("../assets/pse/fiches/Références techniques nationales - PSC1/02FT04.pdf"),
  "PSC:02FT05": require("../assets/pse/fiches/Références techniques nationales - PSC1/02FT05.pdf"),
  "PSC:02PR03": require("../assets/pse/fiches/Références techniques nationales - PSC1/02PR03.pdf"),
  "PSC:02FT06": require("../assets/pse/fiches/Références techniques nationales - PSC1/02FT06.pdf"),
  "PSC:02FT07": require("../assets/pse/fiches/Références techniques nationales - PSC1/02FT07.pdf"),
  "PSC:02FT08": require("../assets/pse/fiches/Références techniques nationales - PSC1/02FT08.pdf"),
  "PSC:02FT09": require("../assets/pse/fiches/Références techniques nationales - PSC1/02FT09.pdf"),
  "PSC:02AC01": require("../assets/pse/fiches/Références techniques nationales - PSC1/02AC01.pdf"),
  "PSC:02PR04": require("../assets/pse/fiches/Références techniques nationales - PSC1/02PR04.pdf"),
  "PSC:02FT10": require("../assets/pse/fiches/Références techniques nationales - PSC1/02FT10.pdf"),
  "PSC:02PR05": require("../assets/pse/fiches/Références techniques nationales - PSC1/02PR05.pdf"),
  "PSC:02FT11": require("../assets/pse/fiches/Références techniques nationales - PSC1/02FT11.pdf"),
  "PSC:02PR06": require("../assets/pse/fiches/Références techniques nationales - PSC1/02PR06.pdf"),
  "PSC:02PR07": require("../assets/pse/fiches/Références techniques nationales - PSC1/02PR07.pdf"),
  "PSC:02PR08": require("../assets/pse/fiches/Références techniques nationales - PSC1/02PR08.pdf"),
  "PSC:03AC01": require("../assets/pse/fiches/Références techniques nationales - PSC1/03AC01.pdf"),
  "GQS:01AC01": require("../assets/pse/fiches/Références techniques nationales - GQS - Fiches/01AC01.pdf"),
  "GQS:01AC02": require("../assets/pse/fiches/Références techniques nationales - GQS - Fiches/01AC02.pdf"),
  "GQS:01AC03": require("../assets/pse/fiches/Références techniques nationales - GQS - Fiches/01AC03.pdf"),
  "GQS:02PR01": require("../assets/pse/fiches/Références techniques nationales - GQS - Fiches/02PR01.pdf"),
  "GQS:02FT01": require("../assets/pse/fiches/Références techniques nationales - GQS - Fiches/02FT01.pdf"),
  "GQS:02FT02": require("../assets/pse/fiches/Références techniques nationales - GQS - Fiches/02FT02.pdf"),
  "GQS:02PR02": require("../assets/pse/fiches/Références techniques nationales - GQS - Fiches/02PR02.pdf"),
  "GQS:02FT03": require("../assets/pse/fiches/Références techniques nationales - GQS - Fiches/02FT03.pdf"),
  "GQS:02FT04": require("../assets/pse/fiches/Références techniques nationales - GQS - Fiches/02FT04.pdf"),
  "GQS:02FT05": require("../assets/pse/fiches/Références techniques nationales - GQS - Fiches/02FT05.pdf"),
  "GQS:02AC01": require("../assets/pse/fiches/Références techniques nationales - GQS - Fiches/02AC01.pdf"),
  "GQS:02PR03": require("../assets/pse/fiches/Références techniques nationales - GQS - Fiches/02PR03.pdf"),
  "GQS:02FT06": require("../assets/pse/fiches/Références techniques nationales - GQS - Fiches/02FT06.pdf"),
  "GQS:02PR04": require("../assets/pse/fiches/Références techniques nationales - GQS - Fiches/02PR04.pdf"),
  "GQS:03AC01": require("../assets/pse/fiches/Références techniques nationales - GQS - Fiches/03AC01.pdf"),
  "GQS:03AC02": require("../assets/pse/fiches/Références techniques nationales - GQS - Fiches/03AC02.pdf"),
};

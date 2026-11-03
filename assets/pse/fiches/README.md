# Fiches des référentiels de premiers secours

Chaque fiche possède un PDF et un JSON structuré avec les mêmes champs que les
fiches PSE : `nom`, `titre`, `niveaux`, `chapitre_principal`, `chapitres` et `notes`.
Le fichier `fiches.json` de chaque dossier sert d'index.

Les PDF sources se trouvent dans `assets/documentation`. Les commandes suivantes
s'exécutent depuis la racine du projet et nécessitent les outils Poppler
(`pdftotext`, `pdftohtml`, `pdfseparate` et `pdfunite`).

## PSC1 — 26 fiches

```bash
python3 assets/pse/fiches/decouper_pse.py --formation psc
python3 scripts/extract-pse-json.py --dossier 'assets/pse/fiches/Références techniques nationales - PSC1'
```

Source : `Références techniques nationales - Premiers Secours Citoyen.pdf`.
Les niveaux des fiches portent le libellé `PSC`, utilisé dans le référentiel.
Sept références dessinées dans le PDF ne sont pas extraites comme du texte ;
elles ont été vérifiées sur les en-têtes et sont renseignées dans le script.

## GQS — 16 fiches

```bash
python3 assets/pse/fiches/decouper_pse.py --formation gqs
python3 scripts/extract-pse-json.py --dossier 'assets/pse/fiches/Références techniques nationales - GQS - Fiches'
```

Source : `2026-GQS-2.pdf`. Les références et titres suivent le sommaire. Les pages
sont repérées par les titres réels : la pagination du sommaire présente des
décalages. Certains en-têtes réutilisent des références différentes du sommaire
(`02FT03`, `02FT04`, `02FT05`, `02FT06` et `02PR04` dans l'index). Les PDF découpés
conservent leurs en-têtes d'origine. Le niveau est `GQS`, y compris pour les deux
fiches dont l'en-tête source indique `PSC`.

Les pages de garde, pages blanches et couvertures sont exclues des fiches.
Les notes conservent leur numérotation d'origine. Certains titres parents ont un
tableau `contenu` vide, afin de conserver notamment les huit séquences pédagogiques.

Sans option, les deux scripts ciblent toujours le référentiel PSE existant.

Après une régénération, exécuter `npm run assets:pse` pour actualiser les index
PDF et JSON des trois référentiels utilisés par le formulaire Secourisme.

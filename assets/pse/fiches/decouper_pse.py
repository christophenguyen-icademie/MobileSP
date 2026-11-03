#!/usr/bin/env python3
"""Découpe les référentiels PSE, PSC et GQS en fiches PDF avec un index JSON."""

import argparse
import json
import re
import subprocess
import tempfile
import unicodedata
from pathlib import Path


BASE = Path(__file__).resolve().parent
DOCUMENTATION = BASE.parents[1] / "documentation"
SOURCE = DOCUMENTATION / "Références techniques nationales - Premiers Secours en Equipe.pdf"
DESTINATION = BASE / "Références techniques nationales - PSE - Fiches"

CHAPITRES = {
    "01": "Attitude et comportement",
    "02": "Protection et sécurité",
    "03": "Hygiène et asepsie",
    "04": "Bilans",
    "05": "Urgences vitales",
    "06": "Malaises et affections spécifiques",
    "07": "Traumatismes",
    "08": "Atteintes circonstancielles et environnementales",
    "09": "Souffrance psychique et comportements inhabituels",
    "10": "Relevage et brancardage",
    "11": "Situations particulières",
    "12": "Divers",
    "13": "Formations",
}

# Pages de garde des chapitres, à ne pas rattacher à la fiche précédente.
PAGES_CHAPITRES = {9, 34, 42, 64, 109, 174, 200, 267, 323, 340, 372, 377, 384}

LIGNE_FICHE = re.compile(
    r"^\[(?P<nom>\d{2}(?:AC|PR|FT)\d{2})\s*/\s*(?P<maj>[^]]+)\]\s*"
    r"(?:(?P<pse>PSE[①②]+)\s*)?"
    r"(?P<titre>.*?)\s*_+\s+(?P<page>\d+)\s*$"
)

REFERENTIELS = {
    "psc": {
        "source": "Références techniques nationales - Premiers Secours Citoyen.pdf",
        "destination": "Références techniques nationales - PSC1",
        "niveau": "PSC",
        "nombre": 26,
    },
    "gqs": {
        "source": "2026-GQS-2.pdf",
        "destination": "Références techniques nationales - GQS - Fiches",
        "niveau": "GQS",
        "nombre": 16,
    },
}

# Ces sept références PSC sont dessinées dans le PDF et ne sont pas extraites
# comme du texte par Poppler. Codes vérifiés sur les en-têtes rendus du document.
REFERENCES_PSC = {
    "Le citoyen de Sécurité Civile": "01AC01",
    "Alerte et protection des populations": "01AC02",
    "Protection": "01AC03",
    "Alerte": "01AC04",
    "Informations générales": "01AC05",
    "Défibrillateur automatisé externe - DAE": "02AC01",
    "Obligations pour les formations": "03AC01",
}

LIGNE_CITOYEN = re.compile(
    r"^\s*(?:\[(?P<nom>\d{2}(?:AC|PR|FT)\d{2})\s*/\s*)?"
    r"(?P<maj>\d{2}-\d{4})\]\s*(?:PSC|GQS)\s+"
    r"(?P<titre>.*?)\s*_*\s+(?P<page>\d+)\s*$"
)


def normaliser(texte):
    return " ".join(unicodedata.normalize("NFKC", texte).casefold().split())


def lire_referentiel(formation, source):
    configuration = REFERENTIELS[formation]
    texte = subprocess.run(
        ["pdftotext", "-layout", str(source), "-"],
        check=True, capture_output=True, text=True,
    ).stdout
    pages = texte.split("\f")
    if not pages[-1].strip():
        pages.pop()

    fiches = []
    for ligne in "\n".join(pages[2:4]).splitlines():
        correspondance = LIGNE_CITOYEN.match(ligne)
        if not correspondance:
            continue
        fiche = correspondance.groupdict()
        fiche["titre"] = fiche["titre"].rstrip("_ ")
        if fiche["nom"] is None:
            fiche["nom"] = REFERENCES_PSC[fiche["titre"]] if formation == "psc" else None
        if not fiche["nom"]:
            raise RuntimeError(f"Référence introuvable : {fiche['titre']}")
        fiche["page_sommaire"] = int(fiche.pop("page"))
        fiche["niveaux"] = [configuration["niveau"]]
        fiche["chapitre"] = {
            "01": "Informations générales", "02": "Secourir une personne", "03": "Formation",
        }[fiche["nom"][:2]]
        fiches.append(fiche)

    if len(fiches) != configuration["nombre"] or len({f["nom"] for f in fiches}) != len(fiches):
        raise RuntimeError(f"{configuration['nombre']} fiches uniques attendues, {len(fiches)} trouvées")

    pages_hors_fiches = set()
    for numero, page in enumerate(pages, start=1):
        lignes = [ligne.strip() for ligne in page.splitlines() if ligne.strip()]
        if (
            not lignes or all(ligne.isdigit() for ligne in lignes)
            or re.match(r"^Chapitre\s+\d{2}\s*-", lignes[0], re.IGNORECASE)
            or lignes[0].startswith("ISBN")
        ):
            pages_hors_fiches.add(numero)
            continue
        if not re.search(r"\d{2}-\d{4}\]\s*(?:PSC|GQS)\s*$", lignes[0]):
            continue

        # Le sommaire GQS a des décalages de pagination et certains en-têtes
        # réutilisent un code. Repérer le titre réel et garder le code du sommaire.
        debut = normaliser(" ".join(lignes[1:5]))
        candidats = [fiche for fiche in fiches if debut.startswith(normaliser(fiche["titre"]))]
        if not candidats:
            raise RuntimeError(f"Titre de fiche non reconnu à la page {numero}")
        fiche = max(candidats, key=lambda item: len(item["titre"]))
        if "page_debut" in fiche:
            raise RuntimeError(f"Plusieurs débuts pour {fiche['nom']}")
        fiche["page_debut"] = numero

    for index, fiche in enumerate(fiches):
        if "page_debut" not in fiche:
            raise RuntimeError(f"Page de début introuvable : {fiche['nom']}")
        fin = fiches[index + 1]["page_debut"] - 1 if index + 1 < len(fiches) else len(pages)
        while fin in pages_hors_fiches:
            fin -= 1
        if fin < fiche["page_debut"]:
            raise RuntimeError(f"Pagination incohérente : {fiche['nom']}")
        fiche["page_fin"] = fin
    return fiches


def lire_sommaire(source=SOURCE):
    texte = subprocess.run(
        ["pdftotext", "-f", "3", "-l", "8", "-layout", str(source), "-"],
        check=True,
        capture_output=True,
        text=True,
    ).stdout
    fiches = []
    for ligne in texte.splitlines():
        correspondance = LIGNE_FICHE.match(ligne.strip())
        if not correspondance:
            continue
        fiche = correspondance.groupdict()
        fiche["page_debut"] = int(fiche.pop("page"))
        marqueur = fiche.pop("pse") or ""
        niveaux = []
        if "①" in marqueur:
            niveaux.append("PSE 1")
        if "②" in marqueur:
            niveaux.append("PSE 2")
        fiche["niveaux"] = niveaux
        fiche["chapitre"] = CHAPITRES[fiche["nom"][:2]]
        fiches.append(fiche)
    if len(fiches) != 198:
        raise RuntimeError(f"198 fiches attendues, {len(fiches)} trouvées")
    return fiches


def decouper(fiches, source=SOURCE, destination=DESTINATION):
    destination.mkdir(parents=True, exist_ok=True)
    for index, fiche in enumerate(fiches):
        debut = fiche["page_debut"]
        if "page_fin" in fiche:
            fin = fiche["page_fin"]
        elif index + 1 < len(fiches):
            fin = fiches[index + 1]["page_debut"] - 1
            if fin in PAGES_CHAPITRES:
                fin -= 1
        else:
            fin = 389
        fiche["page_fin"] = fin
        fiche["fichier"] = f"{fiche['nom']}.pdf"
        with tempfile.TemporaryDirectory(prefix="fiches-pdf-") as temporaire:
            subprocess.run(
                ["pdfseparate", "-f", str(debut), "-l", str(fin), str(source),
                 str(Path(temporaire) / "page-%d.pdf")],
                check=True,
            )
            pages = [Path(temporaire) / f"page-{page}.pdf" for page in range(debut, fin + 1)]
            subprocess.run(
                ["pdfunite", *(str(page) for page in pages), str(destination / fiche["fichier"])],
                check=True,
            )


def ecrire_index(fiches, destination=DESTINATION):
    index = []
    for fiche in fiches:
        index.append(
            {
                "nom": fiche["nom"],
                "titre": fiche["titre"],
                "niveaux": fiche["niveaux"],
                "chapitre": fiche["chapitre"],
                "fichier": fiche["fichier"],
            }
        )
    (destination / "fiches.json").write_text(
        json.dumps(index, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--formation", choices=["pse", "psc", "gqs"], default="pse")
    parser.add_argument("--source", type=Path)
    parser.add_argument("--destination", type=Path)
    args = parser.parse_args()
    configuration = REFERENTIELS.get(args.formation)
    source = args.source or (DOCUMENTATION / configuration["source"] if configuration else SOURCE)
    destination = args.destination or (BASE / configuration["destination"] if configuration else DESTINATION)
    fiches = lire_referentiel(args.formation, source) if configuration else lire_sommaire(source)
    decouper(fiches, source, destination)
    ecrire_index(fiches, destination)
    print(f"{len(fiches)} fiches créées dans {destination}")


if __name__ == "__main__":
    main()

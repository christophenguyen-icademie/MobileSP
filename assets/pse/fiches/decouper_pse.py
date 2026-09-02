#!/usr/bin/env python3
"""Découpe le référentiel PSE en fiches PDF et génère leur index JSON."""

import json
import re
import subprocess
from pathlib import Path


BASE = Path(__file__).resolve().parent
SOURCE = BASE / "Références techniques nationales - Premiers Secours en Equipe.pdf"
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


def lire_sommaire():
    texte = subprocess.run(
        ["pdftotext", "-f", "3", "-l", "8", "-layout", str(SOURCE), "-"],
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


def decouper(fiches):
    DESTINATION.mkdir(parents=True, exist_ok=True)
    for index, fiche in enumerate(fiches):
        debut = fiche["page_debut"]
        if index + 1 < len(fiches):
            fin = fiches[index + 1]["page_debut"] - 1
            if fin in PAGES_CHAPITRES:
                fin -= 1
        else:
            fin = 389
        fiche["page_fin"] = fin
        fiche["fichier"] = f"{fiche['nom']}.pdf"
        subprocess.run(
            [
                "pdfseparate",
                "-f", str(debut),
                "-l", str(fin),
                str(SOURCE),
                str(DESTINATION / f"{fiche['nom']}-%d.pdf"),
            ],
            check=True,
        )
        pages = [DESTINATION / f"{fiche['nom']}-{page}.pdf" for page in range(debut, fin + 1)]
        subprocess.run(
            ["pdfunite", *(str(page) for page in pages), str(DESTINATION / fiche["fichier"])],
            check=True,
        )
        for page in pages:
            page.unlink()


def ecrire_index(fiches):
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
    (DESTINATION / "fiches.json").write_text(
        json.dumps(index, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def main():
    fiches = lire_sommaire()
    decouper(fiches)
    ecrire_index(fiches)
    print(f"{len(fiches)} fiches créées dans {DESTINATION}")


if __name__ == "__main__":
    main()

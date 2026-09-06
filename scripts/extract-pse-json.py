#!/usr/bin/env python3
"""Extrait la structure des fiches PSE PDF dans un JSON par fiche."""

from __future__ import annotations

import html
import json
import re
import subprocess
import tempfile
import xml.etree.ElementTree as ET
from dataclasses import dataclass
from pathlib import Path


RACINE = Path(__file__).resolve().parents[1]
DOSSIER = RACINE / "assets/pse/fiches/Références techniques nationales - PSE - Fiches"
INDEX = DOSSIER / "fiches.json"
MARQUEURS = {"•": 1, "": 1, "o": 2, "–": 1, "-": 1}
ESPACES = re.compile(r"\s+")


@dataclass
class Fragment:
    texte: str
    haut: float
    gauche: float
    taille: float


@dataclass
class Ligne:
    texte: str
    haut: float
    gauche: float
    taille_max: float
    page: int
    marqueur: str | None = None


def nettoyer(texte: str) -> str:
    texte = ESPACES.sub(" ", html.unescape(texte)).strip()
    # Ne pas confondre les exposants scientifiques et indices chimiques avec
    # des appels de notes lors de l'assemblage des fragments typographiques.
    texte = re.sub(r"\bm \(([23])\)", lambda m: f"m{'²' if m.group(1) == '2' else '³'}", texte)
    texte = texte.replace("O (2)", "O₂")
    return texte


def convertir_pdf(pdf: Path) -> tuple[list[Ligne], list[str]]:
    with tempfile.TemporaryDirectory(prefix="pse-json-") as temporaire:
        xml = Path(temporaire) / "fiche.xml"
        subprocess.run(
            ["pdftohtml", "-xml", "-hidden", "-i", str(pdf), str(xml)],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        racine = ET.parse(xml).getroot()

    lignes: list[Ligne] = []
    notes_brutes: list[str] = []
    # Poppler déclare généralement toutes les polices sur la première page ;
    # les pages suivantes continuent d'utiliser les mêmes identifiants.
    polices: dict[str, float] = {}
    for numero_page, page in enumerate(racine.findall("page"), start=1):
        polices.update({
            element.attrib["id"]: float(element.attrib.get("size", 0))
            for element in page.findall("fontspec")
        })
        fragments: list[Fragment] = []
        for element in page.findall("text"):
            texte = nettoyer("".join(element.itertext()))
            if not texte:
                continue
            taille = polices.get(element.attrib.get("font", ""), 0)
            haut = float(element.attrib.get("top", 0))
            gauche = float(element.attrib.get("left", 0))
            if haut > float(page.attrib.get("height", 1262)) - 65 and texte.isdigit():
                continue
            fragments.append(Fragment(texte, haut, gauche, taille))

        fragments.sort(key=lambda item: (item.haut, item.gauche))
        groupes: list[list[Fragment]] = []
        for fragment in fragments:
            if groupes and abs(groupes[-1][0].haut - fragment.haut) <= 3:
                groupes[-1].append(fragment)
            else:
                groupes.append([fragment])

        dans_notes_de_page = False
        for groupe in groupes:
            groupe.sort(key=lambda item: item.gauche)
            contient_texte_normal = any(item.taille >= 12 for item in groupe)
            morceaux = [
                f"({item.texte})"
                if contient_texte_normal and item.taille < 12 and item.texte.isdigit()
                else item.texte
                for item in groupe
            ]
            marqueur = morceaux[0] if morceaux[0] in MARQUEURS else None
            if marqueur:
                morceaux = morceaux[1:]
            texte = nettoyer(" ".join(morceaux))
            if not texte or re.fullmatch(r"\d+", texte):
                continue
            taille_max = max(item.taille for item in groupe)
            debut_note = bool(re.match(r"^\d+\s*\D", texte)) and min(
                item.gauche for item in groupe
            ) < 115
            # Certaines fiches possèdent un bloc de notes assez haut (jusqu'à
            # environ 230 points du bas lorsqu'il contient plusieurs notes).
            proche_bas = min(item.haut for item in groupe) > float(
                page.attrib.get("height", 1262)
            ) - 230
            est_petite_note = taille_max <= 13 and (
                debut_note or dans_notes_de_page
            )
            if taille_max < 12 or est_petite_note:
                if debut_note or proche_bas or dans_notes_de_page:
                    notes_brutes.append(texte)
                    dans_notes_de_page = True
                continue
            lignes.append(
                Ligne(
                    texte=texte,
                    haut=min(item.haut for item in groupe),
                    gauche=min(item.gauche for item in groupe if item.texte not in MARQUEURS),
                    taille_max=taille_max,
                    page=numero_page,
                    marqueur=marqueur,
                )
            )
    notes: list[str] = []
    for ligne in notes_brutes:
        ligne = re.sub(r"^(\d+)\s*", r"(\1) ", ligne)
        if re.match(r"^\(\d+\)\s*\D", ligne) or not notes:
            notes.append(ligne)
        else:
            notes[-1] = nettoyer(f"{notes[-1]} {ligne}")
    return lignes, notes


def assembler_titres(lignes: list[Ligne], reference: str) -> list[Ligne]:
    resultat: list[Ligne] = []
    titre_principal_ignore = False
    index = 0
    while index < len(lignes):
        ligne = lignes[index]
        if reference in ligne.texte and ligne.texte.startswith("["):
            index += 1
            continue
        if ligne.taille_max >= 30 and not titre_principal_ignore:
            titre_principal_ignore = True
            index += 1
            while index < len(lignes) and lignes[index].taille_max >= 30:
                index += 1
            continue
        if ligne.taille_max >= 22 and ligne.marqueur is None:
            morceaux = [ligne.texte]
            suivant = index + 1
            while (
                suivant < len(lignes)
                and lignes[suivant].page == ligne.page
                and lignes[suivant].taille_max >= 22
                and lignes[suivant].marqueur is None
                and lignes[suivant].haut - lignes[suivant - 1].haut < 45
            ):
                morceaux.append(lignes[suivant].texte)
                suivant += 1
            resultat.append(Ligne(nettoyer(" ".join(morceaux)), ligne.haut, ligne.gauche, ligne.taille_max, ligne.page))
            index = suivant
            continue
        resultat.append(ligne)
        index += 1
    return resultat


def ajouter_paragraphe(blocs: list[dict], texte: str) -> None:
    texte = nettoyer(texte)
    if texte:
        blocs.append({"type": "paragraphe", "texte": texte})


def structurer(lignes: list[Ligne]) -> list[dict]:
    chapitres: list[dict] = []
    courant = {"titre": "Introduction", "contenu": []}
    chapitres.append(courant)
    paragraphe: list[str] = []
    derniere_ligne: Ligne | None = None
    liste: dict | None = None

    def vider_paragraphe() -> None:
        nonlocal paragraphe
        ajouter_paragraphe(courant["contenu"], " ".join(paragraphe))
        paragraphe = []

    for ligne in lignes:
        est_titre = ligne.taille_max >= 22 and ligne.marqueur is None
        if est_titre:
            vider_paragraphe()
            liste = None
            courant = {"titre": ligne.texte, "contenu": []}
            chapitres.append(courant)
            derniere_ligne = ligne
            continue

        if ligne.marqueur:
            vider_paragraphe()
            if liste is None or not courant["contenu"] or courant["contenu"][-1] is not liste:
                liste = {"type": "liste", "elements": []}
                courant["contenu"].append(liste)
            liste["elements"].append({"niveau": MARQUEURS[ligne.marqueur], "texte": ligne.texte})
            derniere_ligne = ligne
            continue

        # Une ligne indentée après une puce en est la continuation.
        if liste and liste["elements"] and derniere_ligne:
            element = liste["elements"][-1]
            seuil = 105 if element["niveau"] == 1 else 150
            proche = ligne.page == derniere_ligne.page and ligne.haut - derniere_ligne.haut < 34
            debut_page = ligne.page > derniere_ligne.page and ligne.haut < 180
            if ligne.gauche >= seuil and (proche or debut_page):
                element["texte"] = nettoyer(f"{element['texte']} {ligne.texte}")
                derniere_ligne = ligne
                continue

        liste = None
        if derniere_ligne:
            nouvelle_page = ligne.page != derniere_ligne.page
            grand_espace = not nouvelle_page and ligne.haut - derniere_ligne.haut > 29
            if grand_espace or nouvelle_page:
                vider_paragraphe()
        paragraphe.append(ligne.texte)
        derniere_ligne = ligne

    vider_paragraphe()
    return [chapitre for chapitre in chapitres if chapitre["contenu"]]


def main() -> None:
    fiches = json.loads(INDEX.read_text(encoding="utf-8"))
    for numero, fiche in enumerate(fiches, start=1):
        pdf = DOSSIER / fiche["fichier"]
        lignes_brutes, notes = convertir_pdf(pdf)
        lignes = assembler_titres(lignes_brutes, fiche["nom"])
        resultat = {
            "nom": fiche["nom"],
            "titre": fiche["titre"],
            "niveaux": fiche["niveaux"],
            "chapitre_principal": fiche["chapitre"],
            "chapitres": structurer(lignes),
            "notes": notes,
        }
        destination = DOSSIER / f"{fiche['nom']}.json"
        destination.write_text(json.dumps(resultat, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"[{numero:03}/{len(fiches)}] {destination.name}")


if __name__ == "__main__":
    main()

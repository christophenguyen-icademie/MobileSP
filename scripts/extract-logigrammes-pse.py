"""Extrait les logigrammes PSE en PDF vectoriels (Poppler et Ghostscript requis)."""

from pathlib import Path
import subprocess
import tempfile


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets/documentation/Logigrammes PSE.pdf"
DESTINATION = ROOT / "assets/logigrammes/pse"


def main():
    DESTINATION.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="mobilesp-logigrammes-") as temporary:
        subprocess.run(
            ["pdfseparate", "-f", "3", "-l", "17", str(SOURCE), f"{temporary}/page-%d.pdf"],
            check=True,
        )
        for reference in range(15):
            # Réécrire chaque page évite de dupliquer toutes les ressources du
            # document source. Les liens vers d'autres pages ne sont pas repris.
            subprocess.run(
                [
                    "gs", "-q", "-dSAFER", "-dBATCH", "-dNOPAUSE",
                    "-sDEVICE=pdfwrite", "-dPreserveAnnots=false", "-dNO_PDFMARK_OUTLINES",
                    f"-sOutputFile={DESTINATION / f'{reference:02}.pdf'}",
                    str(Path(temporary) / f"page-{reference + 3}.pdf"),
                ],
                check=True,
                capture_output=True,
            )
    print(f"15 logigrammes extraits dans {DESTINATION}")


if __name__ == "__main__":
    main()

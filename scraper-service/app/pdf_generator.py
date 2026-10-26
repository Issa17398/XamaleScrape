import os
import json
import html
from datetime import datetime
from typing import List, Tuple
from pathlib import Path

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    HRFlowable,
    Table,
    TableStyle,
    PageBreak,
    KeepTogether,
)
from reportlab.pdfgen import canvas

from app.schemas import PageData, CrawlSummary

# Dossier de stockage persistant
BASE_DIR = Path(__file__).resolve().parent.parent.parent
STORAGE_DIR = BASE_DIR / "storage"
RESULTS_DIR = STORAGE_DIR / "results"
RESULTS_DIR.mkdir(parents=True, exist_ok=True)

class PremiumNumberedCanvas(canvas.Canvas):
    """Canvas professionnel avec numérotation de page, running header et running footer aux couleurs XAMALE."""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, total_pages: int):
        self.saveState()

        # En-tête sur les pages suivantes (à partir de la page 2)
        if self._pageNumber > 1:
            self.setFont("Helvetica-Bold", 8)
            self.setFillColor(colors.HexColor("#0a1e4a"))
            self.drawString(54, 804, "XAMALE")
            
            self.setFillColor(colors.HexColor("#d4af37"))
            self.drawString(94, 804, "SCRAPE")

            self.setFont("Helvetica", 7.5)
            self.setFillColor(colors.HexColor("#64748b"))
            self.drawString(136, 804, "—  Rapport d'Extraction Web & Données Structurées")

            # Filet supérieur double teinte (Marine + Or)
            self.setStrokeColor(colors.HexColor("#0a1e4a"))
            self.setLineWidth(1)
            self.line(54, 796, 541, 796)

            self.setStrokeColor(colors.HexColor("#d4af37"))
            self.setLineWidth(1.5)
            self.line(54, 796, 125, 796)

        # Pied de page sur toutes les pages
        self.setStrokeColor(colors.HexColor("#e2e8f0"))
        self.setLineWidth(0.75)
        self.line(54, 45, 541, 45)

        self.setFont("Helvetica", 7.5)
        self.setFillColor(colors.HexColor("#64748b"))
        self.drawString(54, 32, "« Du Web aux données structurées — Votre passerelle vers une IA sûre » — xamale.ai")

        self.setFont("Helvetica-Bold", 7.5)
        self.setFillColor(colors.HexColor("#0a1e4a"))
        page_str = f"Page {self._pageNumber} / {total_pages}"
        self.drawRightString(541, 32, page_str)

        self.restoreState()

def safe_xml(text: str) -> str:
    """Prépare le texte pour ReportLab : échappe uniquement les balises syntaxiques XML (&, <, >).
    Conserve les véritables apostrophes ' et guillemets sans les convertir en entités HTML &#x27;."""
    if not text:
        return ""
    clean = html.unescape(str(text))
    clean = clean.replace("&#x27;", "'").replace("&#39;", "'").replace("&apos;", "'").replace("&quot;", '"')

    # Échappement strict des 3 caractères XML
    clean = clean.replace("&", "&amp;")
    clean = clean.replace("<", "&lt;")
    clean = clean.replace(">", "&gt;")
    return clean

def format_item_line(item_text: str) -> str:
    """Met en valeur élégamment les timelines et intervenants (gras avant le premier tiret)."""
    raw = item_text.strip()
    if raw.startswith("• "):
        raw = raw[2:].strip()
    
    # Si le texte contient un séparateur tiret, mettre la première partie en gras
    if " — " in raw:
        parts = raw.split(" — ", 1)
        return f"<font color='#d4af37'>●</font>  <b><font color='#0a1e4a'>{safe_xml(parts[0])}</font></b> — {safe_xml(parts[1])}"
    
    return f"<font color='#d4af37'>●</font>  {safe_xml(raw)}"

def generate_exports(
    task_id: str,
    domain: str,
    start_url: str,
    pages: List[PageData],
    summary: CrawlSummary,
) -> Tuple[str, str]:
    """Génère le fichier JSON hautement structuré et le document PDF exécutif XAMALE."""

    # 1. Export JSON structuré haute fidélité
    json_path = RESULTS_DIR / f"{task_id}.json"
    json_payload = {
        "metadata": {
            "taskId": task_id,
            "engine": "XamaleScrape Structuring Engine v2.0",
            "slogan": "Votre passerelle vers une IA sûre et innovante",
            "targetUrl": start_url,
            "domain": domain,
            "extractedAt": datetime.utcnow().isoformat() + "Z",
            "totalPages": summary.total_pages,
            "totalWords": summary.total_words,
            "durationSeconds": summary.duration_seconds,
        },
        "pages": [
            {
                "url": p.url,
                "title": p.title,
                "wordCount": p.word_count,
                "headings": p.headings,
                "sections": [
                    {
                        "heading": s.heading,
                        "paragraphs": s.paragraphs,
                        "items": s.items,
                    }
                    for s in p.sections
                ],
                "cleanText": p.text_content,
            }
            for p in pages
        ],
    }

    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(json_payload, f, ensure_ascii=False, indent=2)

    # 2. Export PDF exécutif de prestige
    pdf_path = RESULTS_DIR / f"{task_id}.pdf"
    doc = SimpleDocTemplate(
        str(pdf_path),
        pagesize=A4,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54,
    )

    styles = getSampleStyleSheet()

    # Charte graphique officielle XAMALE
    brand_navy = colors.HexColor("#0a1e4a")
    accent_gold = colors.HexColor("#d4af37")
    dark_text = colors.HexColor("#0f172a")
    slate_muted = colors.HexColor("#475569")
    bg_light = colors.HexColor("#f8fafc")
    border_light = colors.HexColor("#cbd5e1")

    # Styles typographiques optimisés
    page_title_style = ParagraphStyle(
        "PageTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=13.5,
        leading=17,
        textColor=brand_navy,
    )

    page_url_style = ParagraphStyle(
        "PageUrl",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#1d4ed8"),
    )

    sec_heading_style = ParagraphStyle(
        "SecHeading",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=10.5,
        leading=14,
        textColor=brand_navy,
        spaceBefore=11,
        spaceAfter=4,
    )

    body_style = ParagraphStyle(
        "BodyText",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=13.5,
        textColor=dark_text,
        spaceAfter=5,
    )

    bullet_style = ParagraphStyle(
        "BulletItem",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.8,
        leading=13,
        textColor=dark_text,
        leftIndent=10,
        spaceAfter=3,
    )

    index_cell_bold = ParagraphStyle(
        "IndexCellBold",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8.5,
        leading=11,
        textColor=brand_navy,
    )

    index_cell_muted = ParagraphStyle(
        "IndexCellMuted",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=7.5,
        leading=10,
        textColor=slate_muted,
    )

    elements = []

    # ==========================================
    # PAGE DE COUVERTURE & DASHBOARD EXÉCUTIF
    # ==========================================

    # A. Hero Banner Card (Marine & Or)
    hero_content = [
        [
            Paragraph(
                "<font color='#d4af37'><b>XAMALE SCRAPE</b></font>  <font color='#64748b'>|</font>  "
                "<font color='#e2e8f0'>RAPPORT OFFICIEL D'EXTRACTION DE DONNÉES</font>",
                ParagraphStyle("HeroBadge", fontName="Helvetica-Bold", fontSize=7.5, leading=9, textColor=colors.white)
            )
        ],
        [
            Paragraph(
                "Structuration de Données Web &amp; Synthèse Sémantique",
                ParagraphStyle("HeroTitle", fontName="Helvetica-Bold", fontSize=18, leading=22, textColor=colors.white, spaceBefore=4, spaceAfter=4)
            )
        ],
        [
            Paragraph(
                f"Source analysée : <b>{safe_xml(start_url)}</b>  •  Généré le {datetime.now().strftime('%d/%m/%Y à %H:%M')}",
                ParagraphStyle("HeroSub", fontName="Helvetica", fontSize=8.5, leading=11, textColor=colors.HexColor("#cbd5e1"))
            )
        ]
    ]
    hero_table = Table(hero_content, colWidths=[487])
    hero_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), brand_navy),
        ("TOPPADDING", (0, 0), (-1, -1), 12),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
        ("LEFTPADDING", (0, 0), (-1, -1), 16),
        ("RIGHTPADDING", (0, 0), (-1, -1), 16),
        ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#051129")),
    ]))
    elements.append(hero_table)
    elements.append(Spacer(1, 10))

    # B. Grille de 4 Cartes KPI Exécutives
    kpi_cards = [
        [
            Paragraph("<font color='#64748b'><b>PAGES EXTRAITES</b></font><br/><font color='#0a1e4a' size='13'><b>" + str(summary.total_pages) + "</b></font>", ParagraphStyle("K1", fontName="Helvetica", fontSize=7.5, leading=15, alignment=1)),
            Paragraph("<font color='#64748b'><b>MOTS STRUCTURÉS</b></font><br/><font color='#0a1e4a' size='13'><b>" + f"{summary.total_words:,}" + "</b></font>", ParagraphStyle("K2", fontName="Helvetica", fontSize=7.5, leading=15, alignment=1)),
            Paragraph("<font color='#64748b'><b>TEMPS DE CRAWL</b></font><br/><font color='#0a1e4a' size='13'><b>" + f"{summary.duration_seconds}s" + "</b></font>", ParagraphStyle("K3", fontName="Helvetica", fontSize=7.5, leading=15, alignment=1)),
            Paragraph("<font color='#64748b'><b>DOMAINE SOURCE</b></font><br/><font color='#0a1e4a' size='10.5'><b>" + safe_xml(domain[:22]) + "</b></font>", ParagraphStyle("K4", fontName="Helvetica", fontSize=7.5, leading=15, alignment=1)),
        ]
    ]
    kpi_table = Table(kpi_cards, colWidths=[121.75, 121.75, 121.75, 121.75])
    kpi_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), bg_light),
        ("BOX", (0, 0), (-1, -1), 0.75, border_light),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    elements.append(kpi_table)
    elements.append(Spacer(1, 16))

    # C. Sommaire Graphique des Pages Explorées
    elements.append(Paragraph(
        "<font color='#d4af37'><b>▍</b></font> <b>Table des pages extraites &amp; index sémantique</b>",
        ParagraphStyle("TocHeading", fontName="Helvetica-Bold", fontSize=11, leading=15, textColor=brand_navy, spaceAfter=8)
    ))

    # Tableau d'indexation
    index_rows = [
        [
            Paragraph("<b>#</b>", index_cell_bold),
            Paragraph("<b>Titre de la page &amp; URL</b>", index_cell_bold),
            Paragraph("<b>Sections</b>", index_cell_bold),
            Paragraph("<b>Volume</b>", index_cell_bold),
        ]
    ]

    for idx, p in enumerate(pages[:25], 1):
        clean_title = (p.title[:55] + "...") if len(p.title) > 55 else p.title
        num_str = f"<b><font color='#d4af37'>{idx:02d}</font></b>"
        title_block = [
            Paragraph(f"<b>{safe_xml(clean_title)}</b>", index_cell_bold),
            Paragraph(safe_xml(p.url[:60] + ('...' if len(p.url) > 60 else '')), index_cell_muted)
        ]
        sec_count = f"{len(p.sections)} section(s)"
        word_count_str = f"<b>{p.word_count:,}</b> mots"
        index_rows.append([
            Paragraph(num_str, index_cell_bold),
            title_block,
            Paragraph(sec_count, index_cell_muted),
            Paragraph(word_count_str, index_cell_muted),
        ])

    index_table = Table(index_rows, colWidths=[28, 305, 78, 76])
    index_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#eef3fc")),
        ("LINEBELOW", (0, 0), (-1, 0), 1, brand_navy),
        ("BOX", (0, 0), (-1, -1), 0.5, border_light),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#f1f5f9")),
        ("TOPPADDING", (0, 0), (-1, -1), 4.5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4.5),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    elements.append(index_table)

    if len(pages) > 25:
        elements.append(Spacer(1, 6))
        elements.append(Paragraph(
            f"<i>... et {len(pages) - 25} autres pages extraites avec succès et indexées dans l'export JSON complet.</i>",
            index_cell_muted
        ))

    elements.append(Spacer(1, 14))
    elements.append(PageBreak())

    # ==========================================
    # PAGES DE DÉTAIL : CONTENU STRUCTURÉ
    # ==========================================

    for idx, page in enumerate(pages, 1):
        # En-tête de page exécutif
        page_badge = f"<font color='#d4af37'><b>PAGE {idx:02d} / {len(pages):02d}</b></font>"
        word_badge = f"<font color='#64748b'>{page.word_count:,} mots utiles</font>"
        
        banner_data = [
            [
                Paragraph(page_badge, ParagraphStyle("PB1", fontName="Helvetica-Bold", fontSize=8, leading=10)),
                Paragraph(word_badge, ParagraphStyle("PB2", fontName="Helvetica", fontSize=8, leading=10, alignment=2)),
            ],
            [
                Paragraph(f"<b>{safe_xml(page.title)}</b>", page_title_style),
                Paragraph("", page_title_style),
            ],
            [
                Paragraph(f"<b>Source :</b> {safe_xml(page.url)}", page_url_style),
                Paragraph("", page_url_style),
            ]
        ]
        banner_table = Table(banner_data, colWidths=[380, 107])
        banner_table.setStyle(TableStyle([
            ("SPAN", (0, 1), (1, 1)),
            ("SPAN", (0, 2), (1, 2)),
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
            ("BOX", (0, 0), (-1, -1), 0.75, colors.HexColor("#cbd5e1")),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ]))

        header_block = [
            banner_table,
            Spacer(1, 8),
            HRFlowable(width="100%", thickness=1, color=brand_navy, spaceAfter=10),
        ]
        elements.append(KeepTogether(header_block))

        # Contenu structuré par sections
        if page.sections:
            for sec in page.sections:
                sec_header = f"<font color='#d4af37'><b>▍</b></font>  <b>{safe_xml(sec.heading)}</b>"
                elements.append(Paragraph(sec_header, sec_heading_style))

                for p_text in sec.paragraphs:
                    elements.append(Paragraph(safe_xml(p_text), body_style))

                for item_text in sec.items:
                    formatted_line = format_item_line(item_text)
                    elements.append(Paragraph(formatted_line, bullet_style))
        else:
            # Fallback sur les paragraphes propres
            paragraphs = page.text_content.split("\n\n")
            for para in paragraphs:
                para_clean = para.strip()
                if not para_clean:
                    continue
                if para_clean.startswith("### "):
                    elements.append(Paragraph(f"<font color='#d4af37'><b>▍</b></font>  <b>{safe_xml(para_clean[4:])}</b>", sec_heading_style))
                elif para_clean.startswith("• "):
                    formatted_line = format_item_line(para_clean)
                    elements.append(Paragraph(formatted_line, bullet_style))
                else:
                    elements.append(Paragraph(safe_xml(para_clean), body_style))

        elements.append(Spacer(1, 14))
        if idx < len(pages):
            elements.append(PageBreak())

    # Construction du PDF avec le canvas exécutif
    doc.build(elements, canvasmaker=PremiumNumberedCanvas)

    return str(json_path), str(pdf_path)

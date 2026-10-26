import asyncio
import socket
import ipaddress
import time
import re
import html
from urllib.parse import urlparse, urljoin, urldefrag
from typing import List, Set, Dict, Any, Tuple
import httpx
from bs4 import BeautifulSoup, Tag

from app.schemas import PageData, StructuredSection, CrawlSummary

def is_safe_ip(ip_str: str) -> bool:
    """Vérifie si l'adresse IP est publique et sécurisée (Anti-SSRF)."""
    try:
        ip = ipaddress.ip_address(ip_str)
        return not (
            ip.is_private
            or ip.is_loopback
            or ip.is_link_local
            or ip.is_reserved
            or ip.is_multicast
            or ip.is_unspecified
        )
    except ValueError:
        return False

def check_domain_safety(hostname: str) -> Tuple[bool, str]:
    """Résout le nom de domaine en IP et valide l'absence de SSRF."""
    if not hostname or hostname in ("localhost", "127.0.0.1", "::1"):
        return False, "Hôte local ou privé non autorisé."
    try:
        infos = socket.getaddrinfo(hostname, None)
        for info in infos:
            ip = info[4][0]
            if not is_safe_ip(ip):
                return False, f"L'hôte {hostname} résout vers une IP privée ou non autorisée ({ip})."
        return True, ""
    except Exception as e:
        return False, f"Impossible de résoudre l'hôte {hostname}: {str(e)}"

# Expressions régulières des textes de bruit / formulaires / CTA / états vides
BOILERPLATE_PATTERNS = [
    r"participer\s+[aà]\s+cet\s+[eé]v[eé]nement",
    r"pas\s+encore\s+membre",
    r"rejoindre\s+le\s+r[eé]seau",
    r"derni[eè]res\s+actualit[eé]s",
    r"aucune\s+actualit[eé]\s+publi[eé]e",
    r"ils\s+soutiennent\s+notre\s+mission",
    r"tous\s+droits\s+r[eé]serv[eé]s",
    r"politique\s+de\s+confidentialit[eé]",
    r"mentions\s+l[eé]gales",
    r"gestion\s+des\s+cookies",
    r"suivez-nous",
    r"partager\s+sur",
    r"s'inscrire",
    r"se\s+connecter",
    r"mot\s+de\s+passe\s+oubli[eé]",
    r"tous\s+droits\s+réservés",
    r"cookie\s+policy",
]

# Liens à ne pas suivre automatiquement lors du crawl récursif
IGNORE_PATH_PATTERNS = [
    r"^/(connexion|inscription|login|signin|signup|register|logout|auth)(/|$|\?)",
    r"^/(mentions-legales|politique-confidentialite|confidentialite|cgu|cgv|cookies|privacy|terms|legal)(/|$|\?)",
]

def should_skip_link(path: str) -> bool:
    """Ignore les pages de connexion, formulaires auth et disclaimers légaux lors de l'exploration multi-pages."""
    p = path.lower()
    return any(re.search(pat, p) for pat in IGNORE_PATH_PATTERNS)

def is_noise_text(text: str) -> bool:
    t = text.strip().lower()
    if not t or len(t) < 3:
        return True
    return any(re.search(pat, t) for pat in BOILERPLATE_PATTERNS)

def clean_text(text: str) -> str:
    """Nettoie le texte en profondeur : décode les entités HTML, élimine les artefacts d'encodage et normalise la ponctuation."""
    if not text:
        return ""

    # 1. Décodage itératif des entités HTML (gère le multi-échappement ex: &amp;#x27;)
    cleaned = str(text)
    for _ in range(3):
        prev = cleaned
        cleaned = html.unescape(cleaned)
        if cleaned == prev:
            break

    # 2. Remplacement explicite des entités numériques et résiduelles
    cleaned = (
        cleaned.replace("&#x27;", "'")
        .replace("&#39;", "'")
        .replace("&apos;", "'")
        .replace("&quot;", '"')
        .replace("&amp;", "&")
        .replace("&nbsp;", " ")
        .replace("&bull;", "•")
        .replace("&ndash;", "—")
        .replace("&mdash;", "—")
        .replace("&hellip;", "...")
    )

    # 3. Normalisation des apostrophes (curly quotes / backticks -> apostrophe standard française)
    cleaned = cleaned.replace("’", "'").replace("‘", "'").replace("`", "'")

    # 4. Normalisation des guillemets
    cleaned = cleaned.replace("“", '"').replace("”", '"')

    # 5. Normalisation des espaces insécables et caractères invisibles
    cleaned = re.sub(r"[\u00a0\u202f\u200b\ufeff\u200e\u200f]", " ", cleaned)

    # 6. Correction des fautes récurrentes de frappe des sites sources (ex: "snégalais" sur saien.org)
    cleaned = re.sub(r"\bsnégalais\b", "sénégalais", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\bsnégalaise\b", "sénégalaise", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\bsnégalaises\b", "sénégalaises", cleaned, flags=re.IGNORECASE)

    # 7. Normalisation des tirets et suppression des doubles séparateurs
    cleaned = re.sub(r"\s*—\s*—\s*", " — ", cleaned)
    cleaned = re.sub(r"\s+—\s*$", "", cleaned)
    cleaned = re.sub(r"^\s*—\s+", "", cleaned)

    # 8. Espaces multiples
    cleaned = re.sub(r"[ \t]+", " ", cleaned)

    return cleaned.strip()

def clean_and_structure_html(html_str: str, page_url: str) -> Tuple[str, str, List[str], List[StructuredSection], int, Set[str]]:
    """Nettoie le HTML en profondeur, élimine les balises et bruits, et extrait des informations structurées."""
    soup = BeautifulSoup(html_str, "html.parser")

    # 1. Liens internes pour le crawl (avant décomposition des tags)
    parsed_base = urlparse(page_url)
    discovered_links: Set[str] = set()

    for a in soup.find_all("a", href=True):
        raw_href = a["href"].strip()
        if not raw_href or raw_href.startswith(("#", "javascript:", "mailto:", "tel:")):
            continue
        joined = urljoin(page_url, raw_href)
        defragged, _ = urldefrag(joined)
        parsed_link = urlparse(defragged)
        # Même nom d'hôte uniquement
        if parsed_link.netloc.lower() == parsed_base.netloc.lower():
            path_lower = parsed_link.path.lower()
            if not any(path_lower.endswith(ext) for ext in ('.jpg', '.jpeg', '.png', '.gif', '.pdf', '.zip', '.exe', '.css', '.js', '.svg', '.mp4', '.mp3')):
                if not should_skip_link(path_lower):
                    discovered_links.add(defragged)

    # 2. Suppression stricte des balises non textuelles ou d'interface
    for tag in soup(["script", "style", "nav", "footer", "header", "aside", "form", "noscript", "svg", "iframe", "button", "input", "select", "textarea"]):
        tag.decompose()

    # 3. Suppression ciblée des zones CSS de bruit (cookies, newsletters, sidebars)
    for el in list(soup.find_all(True)):
        if el.attrs is None:
            continue
        classes = " ".join(el.attrs.get("class", [])) if isinstance(el.attrs.get("class"), list) else ""
        el_id = el.attrs.get("id", "")
        role = el.attrs.get("role", "")
        combined = f"{classes} {el_id} {role}".lower()

        if any(k in combined for k in [
            "cookie", "banner", "newsletter", "sidebar", "breadcrumb", "pagination", "share-buttons", "popup"
        ]):
            el.decompose()

    # 4. Extraction du titre principal de la page
    h1 = soup.find("h1")
    raw_title = h1.get_text(separator=" ", strip=True) if h1 else (soup.title.get_text(strip=True) if soup.title else "Sans titre")
    page_title = clean_text(raw_title)

    # Conteneur principal
    main_node = (
        soup.find("main")
        or soup.find("article")
        or soup.find("div", class_=lambda c: c and any(k in str(c).lower() for k in ["content", "main", "body", "event", "post"]))
        or soup.body
        or soup
    )

    # 5. Extraction structurée par Sections
    sections: List[StructuredSection] = []
    headings_list: List[str] = []

    # Repérer les titres H2 et H3
    heading_tags = main_node.find_all(["h2", "h3"]) if main_node else []

    if not heading_tags:
        # Page simple sans sous-titres : extraire paragraphes et listes
        paragraphs: List[str] = []
        for p in (main_node.find_all(["p", "blockquote", "li"]) if main_node else []):
            if p.attrs is None or p.find(["p"]):
                continue
            txt = clean_text(p.get_text(separator=" ", strip=True))
            if txt and len(txt) > 20 and not is_noise_text(txt):
                if txt not in paragraphs:
                    paragraphs.append(txt)
        
        full_text = f"# {page_title}\n\n" + "\n\n".join(paragraphs)
        sec = StructuredSection(heading="Contenu principal", paragraphs=paragraphs, items=[])
        return page_title, full_text, [page_title], [sec], len(full_text.split()), discovered_links

    # Extraire le contenu pour chaque section
    for h in heading_tags:
        h_text = clean_text(h.get_text(strip=True))
        if not h_text or is_noise_text(h_text) or h_text == page_title:
            continue

        headings_list.append(h_text)
        parent = h.find_parent(["section", "div"])
        section_items: List[str] = []
        section_paragraphs: List[str] = []

        if parent:
            # A. Éléments structurés (intervenants, timeline programme, puces objectifs)
            for card in parent.find_all(["div", "li"], recursive=True):
                if card == h or card.find(["h2"]) or card.attrs is None:
                    continue
                # Conteneur feuille contenant de l'information compacte
                if not card.find(["div", "ul", "ol"]):
                    raw_card_txt = card.get_text(separator=" — ", strip=True)
                    # Éliminer les initiales d'avatar de 2 lettres majuscules isolées ("SM", "AD")
                    raw_card_txt = re.sub(r"^[A-Z]{2}\s*—\s*", "", raw_card_txt)
                    card_txt = clean_text(raw_card_txt)
                    # Retirer toute puce initiale pour ne pas doubler
                    card_txt = re.sub(r"^[•\-\*]\s*", "", card_txt)
                    
                    if card_txt and len(card_txt) > 5 and not is_noise_text(card_txt):
                        item_line = f"• {card_txt}"
                        if item_line not in section_items and h_text not in card_txt:
                            section_items.append(item_line)

            # B. Paragraphes narratifs complets
            for p in parent.find_all(["p", "blockquote", "div"], recursive=True):
                if p == h or p.attrs is None:
                    continue
                if not p.find(["p"]):
                    txt = clean_text(p.get_text(separator=" ", strip=True))
                    if txt and len(txt) > 25 and not is_noise_text(txt):
                        # Ne pas dupliquer si déjà capturé dans les items
                        if not any(txt in item for item in section_items) and txt not in section_paragraphs:
                            section_paragraphs.append(txt)

        if section_items or section_paragraphs:
            sections.append(StructuredSection(
                heading=h_text,
                paragraphs=section_paragraphs,
                items=section_items[:25]
            ))

    # 6. Assemblage du texte structuré lisible
    text_blocks = [f"# {page_title}\n"]
    for s in sections:
        text_blocks.append(f"### {s.heading}")
        for p in s.paragraphs:
            text_blocks.append(p)
        for it in s.items:
            text_blocks.append(it)
        text_blocks.append("")

    full_clean_text = "\n\n".join(text_blocks).strip()
    words_count = len(full_clean_text.split())

    return page_title, full_clean_text, headings_list[:15], sections, words_count, discovered_links

async def crawl_website(
    start_url: str,
    max_pages: int = 100,
    wait_for_dynamic: bool = True,
    follow_internal_only: bool = True,
) -> Tuple[List[PageData], CrawlSummary, str]:
    """Exécute l'exploration multi-pages contrôlée et hautement structurée jusqu'à 100 pages."""
    start_time = time.time()
    parsed_start = urlparse(start_url)
    domain = parsed_start.netloc

    # Sécurité Anti-SSRF
    is_safe, error_msg = check_domain_safety(parsed_start.hostname or "")
    if not is_safe:
        raise ValueError(f"Sécurité : {error_msg}")

    visited_urls: Set[str] = set()
    queue: List[str] = [start_url]
    pages_data: List[PageData] = []

    headers = {
        "User-Agent": "XamaleScrape/1.0 (+https://xamale.ai/bot; Web Data Structuring Engine)",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
    }

    timeout = httpx.Timeout(15.0, connect=5.0)

    async with httpx.AsyncClient(headers=headers, timeout=timeout, follow_redirects=True) as client:
        while queue and len(pages_data) < max_pages:
            current_url = queue.pop(0)
            if current_url in visited_urls:
                continue

            visited_urls.add(current_url)

            try:
                # Vérification SSRF sur chaque redirection
                curr_parsed = urlparse(current_url)
                if follow_internal_only and curr_parsed.netloc.lower() != domain.lower():
                    continue

                safe, _ = check_domain_safety(curr_parsed.hostname or "")
                if not safe:
                    continue

                response = await client.get(current_url)
                if response.status_code != 200:
                    continue

                content_type = response.headers.get("content-type", "").lower()
                if "text/html" not in content_type and "application/xhtml" not in content_type:
                    continue

                title, text_content, headings, sections, word_count, new_links = clean_and_structure_html(
                    response.text, str(response.url)
                )

                if word_count > 10:  # Ignorer les pages complètement vides ou sans contenu utile
                    page_item = PageData(
                        url=str(response.url),
                        title=title,
                        word_count=word_count,
                        headings=headings,
                        sections=sections,
                        text_content=text_content,
                    )
                    pages_data.append(page_item)

                if follow_internal_only and len(pages_data) < max_pages:
                    for lk in new_links:
                        if lk not in visited_urls and lk not in queue:
                            queue.append(lk)

                # Pause de politesse respectueuse
                await asyncio.sleep(0.1)

            except Exception as e:
                print(f"[CRAWLER] Erreur lors de la visite de {current_url}: {e}")
                continue

    total_words = sum(p.word_count for p in pages_data)
    duration = round(time.time() - start_time, 2)

    summary = CrawlSummary(
        total_pages=len(pages_data),
        total_words=total_words,
        duration_seconds=duration,
    )

    return pages_data, summary, domain

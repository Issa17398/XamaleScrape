# XamaleScrape — Extraction Web & Données Structurées

> **« Du Web aux données structurées — Votre passerelle vers une IA sûre. »**

## 1. Présentation du projet
**XamaleScrape** est une solution complète d'exploration web, d'assainissement sémantique et de structuration de données. Conçue pour transformer des sites web hétérogènes en jeux de données immédiatement exploitables, elle alimente efficacement les pipelines d'Intelligence Artificielle (**RAG**, agents conversationnels, bases vectorielles) et édite des rapports de synthèse exécutifs.

Face aux contraintes du web moderne — bruit visuel, bannières de consentement, scripts tiers, entités HTML imbriquées et structures désordonnées —, **XamaleScrape** extrait la substantifique moelle informationnelle de chaque page et génère automatiquement **deux livrables professionnels téléchargeables** :
1. **Un document PDF exécutif** : mis en page avec élégance aux couleurs institutionnelles de XAMALE (bleu marine et or), doté d'une page de couverture, d'un tableau récapitulatif des métriques, d'un en-tête/pied de page dynamique numéroté (`Page X / Y`) et d'un découpage thématique par sections.
2. **Un fichier de données JSON normalisé** : encodé en UTF-8, typé et structuré (titre, sections, paragraphes narratifs, listes à puces, décompte de mots), directement intégrable dans des moteurs de vectorisation ou des architectures LLM.

L'application propose deux portées d'extraction adaptées :
- **Mode Page Unique** (1 page) : capture ciblée d'un article, d'un communiqué ou d'une documentation précise.
- **Mode Exploration Récursive** : exploration intelligente intra-domaine configurée par défaut à **25 pages** (paramétrable de **1 à 100 pages** maximum).

---

## 2. Architecture Technique Épurée

L'application est architecturée selon un modèle modulaire à **3 tiers découplés**, assurant scalabilité, résilience et séparation stricte des responsabilités :

```text
XamaleScrape
│
├── backend/                       # API Gateway & Orchestrateur (Node.js / Express / TypeScript)
│   ├── src/
│   │   ├── controllers/           # Gestionnaires de routes (création de tâche, statut, téléchargements)
│   │   ├── routes/                # Routeur REST Express (/api/scrape, /api/tasks...)
│   │   ├── services/              # Client Scraper (FastAPI) & TaskManager en mémoire
│   │   ├── types/                 # Interfaces et typages TypeScript stricts
│   │   ├── utils/                 # Sécurité Anti-SSRF (DNS lookup & filtrage IP privées)
│   │   └── index.ts               # Point d'entrée du serveur Express (Port 3001)
│   ├── package.json               # Dépendances Node.js
│   └── tsconfig.json              # Configuration TypeScript
│
├── scraper-service/               # Moteur d'Extraction & Génération Documentaire (Python / FastAPI)
│   ├── app/
│   │   ├── crawler.py             # Crawler asynchrone, assainissement DOM & validation Anti-SSRF
│   │   ├── pdf_generator.py       # Moteur PDF ReportLab (Canvas premium) & Export JSON UTF-8
│   │   ├── schemas.py             # Schémas Pydantic (CrawlRequest, PageData, CrawlSummary...)
│   │   └── main.py                # API FastAPI interne (/crawl, /download, /health - Port 8000)
│   ├── run.py                     # Script d'exécution avec Uvicorn
│   └── requirements.txt           # Dépendances Python (FastAPI, HTTPX, BeautifulSoup4, ReportLab)
│
├── frontend/                      # Interface Utilisateur Web (React 19 / TypeScript / Vite)
│   ├── src/
│   │   ├── components/            # Composants UI (ScrapeForm, Header, ProgressTracker, Modales...)
│   │   ├── types/                 # Typages TypeScript frontend
│   │   ├── App.tsx                # Orchestration globale, polling d'état et téléchargements
│   │   └── App.css                # Design system exécutif (Thème sombre corporate, glassmorphism)
│   ├── package.json               # Dépendances React & Vite
│   └── vite.config.ts             # Configuration du bundler Vite (Port 5173)
│
└── storage/                       # Données et persistance locale
    └── results/                   # Livrables générés ({taskId}.pdf et {taskId}.json)
```

### Stack technologique
- **Moteur d'Extraction & Génération (Python)** :
  - **Framework API** : `FastAPI` (v0.115+) & serveur asynchrone `Uvicorn` (v0.34+)
  - **Requêtage Web Asynchrone** : `HTTPX` (v0.28+) avec gestion des redirections et des délais d'attente
  - **Parsing & Nettoyage Sémantique** : `BeautifulSoup4` (v4.13+)
  - **Moteur PDF Vectoriel** : `ReportLab` (v4.2+) avec canvas à deux passes et styles personnalisés
  - **Typage & Validation** : `Pydantic` (v2.10+)
- **API Gateway & Orchestration (Node.js)** :
  - `Node.js` (v20+) & `Express` (v4.21+) avec `TypeScript` (v5.7+)
  - **Sécurité Anti-SSRF** : Module `dns` natif (résolution proactive IPv4/IPv6 et détection des plages privées)
  - **Gestionnaire de Tâches** : `TaskManager` en mémoire avec suivi d'état par UUID et purge automatique
- **Interface Utilisateur (Frontend)** :
  - `React` (v19) & `TypeScript` orchestrés par `Vite` (v8)
  - Design exécutif sombre haut de gamme avec Glassmorphism et micro-interactions soignées
  - Linter statique moderne : `oxlint`
- **Stockage & Persistance** :
  - Système de fichiers local (`storage/results/`) conservant les fichiers générés par identifiant unique de tâche

---

## 3. Guide de Démarrage Rapide

### Prérequis
1. **Node.js** (v18+) et **npm** installés.
2. **Python** (v3.10+) avec `pip` (ou `uv`).

### Récupération du projet
Vous pouvez obtenir le projet de deux manières :
- **Sans Git (Téléchargement direct)** : Téléchargez l'archive **ZIP** du projet (via le bouton vert GitHub *Code* > *Download ZIP*) puis décompressez-la dans le dossier de votre choix sur votre ordinateur.
- **Avec Git (Optionnel)** :
  ```bash
  git clone https://github.com/votre-compte/XamaleScrape.git
  cd XamaleScrape
  ```

### Configuration & Installation

1. **Microservice Scraper (Python) :**
   ```bash
   cd scraper-service
   # Création de l'environnement virtuel (optionnel mais recommandé)
   python -m venv .venv
   # Activation (Windows PowerShell) :
   .venv\Scripts\Activate.ps1
   # Installation des dépendances :
   pip install -r requirements.txt
   ```
   *(Optionnel)* Copiez le fichier d'environnement :
   ```bash
   copy .env.example .env
   ```

2. **Backend Orchestrateur (Node.js) :**
   ```bash
   cd backend
   npm install
   ```
   *(Optionnel)* Copiez le fichier d'environnement :
   ```bash
   copy .env.example .env
   ```

3. **Frontend (React) :**
   ```bash
   cd frontend
   npm install
   ```

### Lancement de l'application
Pour un fonctionnement optimal, lancez les trois services dans des terminaux distincts :

1. **Démarrer le Scraper Service (FastAPI — Port 8000) :**
   ```bash
   cd scraper-service
   python run.py
   # Ou directement via uvicorn :
   uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```

2. **Démarrer l'API Gateway Backend (Express — Port 3001) :**
   ```bash
   cd backend
   npm run dev
   ```

3. **Démarrer le Frontend Web (Vite — Port 5173) :**
   ```bash
   cd frontend
   npm run dev
   ```

Accédez à l'interface sur **http://localhost:5173**.

---

## 4. Les 3 Piliers de l'Architecture XamaleScrape

---

### Pilier 1 — Le Moteur d'Extraction & Nettoyage Sémantique (`crawler.py`)
Ce module assure la collecte respectueuse, la sécurité réseau et l'assainissement approfondi du texte :

1. **Sécurité Anti-SSRF à deux niveaux (`is_safe_ip`, `check_domain_safety`)** :
   Chaque nom de domaine et chaque redirection HTTP font l'objet d'une résolution DNS stricte. Tout accès aux réseaux locaux ou privés (127.0.0.0/8, 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, Link-Local 169.254.0.0/16, metadata Cloud, loopback IPv6) est immédiatement bloqué.
2. **Exploration récursive contrôlée (`crawl_website`)** :
   Suit exclusivement les liens internes appartenant au même nom d'hôte. La limite par défaut est calibrée à **25 pages** (paramétrable entre 1 et 100 pages). Les ressources statiques (images, PDF, archives, vidéos) ainsi que les pages sans pertinence sémantique (connexion, inscription, mentions légales, CGU, cookies) sont automatiquement écartées.
3. **Nettoyage sémantique & Décodage multi-passes (`clean_text`)** :
   - Décodage récursif des entités HTML (gérant le multi-échappement type `&amp;#x27;`).
   - Normalisation rigoureuse de la typographie (guillemets français, apostrophes, tirets cadratins, espaces insécables).
   - Élimination des bruits récurrents (bannières de consentement, newsletters, boutons de partage, footers).
4. **Découpage hiérarchique en sections (`StructuredSection`)** :
   Segmente le contenu par titres (H2, H3), paragraphes narratifs complets et éléments synthétiques sous forme de puces informatives.

---

### Pilier 2 — La Fabrique de Livrables PDF & JSON (`pdf_generator.py`)
Ce module convertit les données collectées en artefacts professionnels prêts à l'emploi :

1. **Canvas PDF Haute Définition (`PremiumNumberedCanvas`)** :
   Utilise un canvas à deux passes ReportLab pour calculer avec exactitude le nombre total de pages et apposer une numérotation institutionnelle (`Page X / Y`).
2. **Charte graphique corporate XAMALE** :
   - Teintes exécutives : Bleu marine profond (`#0a1e4a`) et or prestige (`#d4af37`).
   - En-tête running subtil avec filet bicolore sur les pages intérieures.
   - Pied de page normalisé rappelant la devise du projet.
3. **Mise en page structurée** :
   - **Page de couverture** : Titre du projet, URL source, métriques clés (pages explorées, mots totaux, durée d'extraction) réunies dans un tableau stylisé.
   - **Bannières d'articles** : Boîte d'en-tête pour chaque page explorée avec badge de numérotation, volume de mots et URL source.
   - **Formatage sécurisé (`safe_xml`)** : Échappement ciblé des caractères syntaxiques XML préservant la fidélité des textes sans rupture de compilation.
4. **Export JSON UTF-8 Exhaustif** :
   Génère un fichier JSON structuré contenant les métadonnées de mission et le tableau détaillé des pages avec leurs sections respectives, prêt pour l'indexation vectorielle RAG.

---

### Pilier 3 — L'Orchestrateur API Gateway & L'Interface Réactive (`backend` & `frontend`)
Ce tandem coordonne les requêtes, informe l'utilisateur en temps réel et distribue les livrables :

1. **Validation préventive & Cycle de vie asynchrone** :
   Le backend Express valide syntaxiquement l'URL, applique un premier filtre Anti-SSRF côté Node.js, génère un identifiant unique `taskId` (UUID v4) et délègue la tâche au moteur Python en arrière-plan sans bloquer la requête HTTP.
2. **Suivi d'avancement par Polling dynamique** :
   Le frontend interroge régulièrement l'état de la tâche (`/api/tasks/:taskId`) pour afficher en temps réel le pourcentage de progression, le domaine audité et l'action en cours.
3. **Contrôle utilisateur & Annulation** :
   L'utilisateur peut à tout moment interrompre une extraction en cours via un bouton d'annulation relié à la route `DELETE /api/tasks/:taskId`.
4. **Expérience utilisateur immersive** :
   - Barre de saisie intelligente avec détection du protocole et bouton intégré "Coller" depuis le presse-papier.
   - Sélecteur de mode intuitif (**Page unique** vs **Exploration récursive jusqu'à 25 pages par défaut**).
   - Accès direct au téléchargement du PDF et du JSON dès la fin du traitement.
   - Historique local des extractions récentes avec badges de statut et métriques associées.

---

## 5. API Backend & Points d'Entrée

### Backend Express (Port 3001)
L'API Gateway principale accessible par le frontend web :

| Méthode | Route | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Vérification de l'état de santé du backend |
| `POST` | `/api/scrape` | Crée et enfile une tâche d'extraction (`url`, `maxPages` = 25 par défaut, etc.) |
| `GET` | `/api/tasks` | Liste l'ensemble des tâches enregistrées en mémoire |
| `GET` | `/api/tasks/:taskId` | Retourne la télémétrie et l'état d'avancement (`progress`, `currentStep`, `status`) |
| `GET` | `/api/tasks/:taskId/result` | Récupère le résultat complet d'une tâche terminée |
| `GET` | `/api/tasks/:taskId/download/pdf` | Téléchargement direct du livrable PDF généré |
| `GET` | `/api/tasks/:taskId/download/json` | Téléchargement direct du fichier JSON structuré |
| `DELETE` | `/api/tasks/:taskId` | Annule une tâche d'extraction en cours d'exécution |

### Scraper Service FastAPI (Port 8000)
Le microservice interne dédié à l'exécution du crawl et à la génération de fichiers :

| Méthode | Route | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Diagnostic du scraper et vérification du dossier de stockage |
| `POST` | `/crawl` | Exécute le crawling, le nettoyage, la génération PDF et l'export JSON |
| `GET` | `/download/pdf/{task_id}` | Sert le fichier PDF généré depuis `storage/results/` |
| `GET` | `/download/json/{task_id}` | Sert le fichier JSON généré depuis `storage/results/` |

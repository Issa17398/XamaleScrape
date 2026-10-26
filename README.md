# XamaleScrape — Web Extraction & Data Structuring

> **« Du Web aux données structurées. »**

Bienvenue dans le projet **XamaleScrape**. Cette application permet d'explorer jusqu'à 25 pages d'un site web public (y compris les applications dynamiques React/Vue/Angular/Next.js), d'extraire leur contenu textuel propre et structuré, et de générer deux fichiers téléchargeables :
1. Un document **PDF** structuré, mis en page et lisible.
2. Un fichier de données **JSON** exhaustif, normalisé et encodé en UTF-8.

---

## A. Objectif de l'Étape 0

L'étape 0 est la phase préparatoire d'audit technique, de validation des prérequis matériels/logiciels et de cadrage architectural.
Elle vise à :
- Auditer l'environnement de développement local (OS, versions de Node.js, npm, Python, Git, Docker).
- Identifier les particularités et contraintes du système (Windows 11, PowerShell, isolation de l'historique Git).
- Confirmer la stack technologique et les responsabilités de chaque module.
- Fixer l'arborescence cible et les conventions de codage.
- Poser le socle documentaire pour un développement pas-à-pas transparent et vérifiable.

---

## B. Concepts Techniques Clés

### 1. Découpage en 3 Tiers (Frontend, Orchestrateur Backend, Service d'Extraction)
- **Frontend (React + Vite + TypeScript)** : Interface utilisateur réactive, responsable de la saisie d'URL, de la validation côté client, du suivi de l'avancement en temps réel et du téléchargement des livrables finaux.
- **Backend (Node.js + Express + TypeScript)** : API passerelle (API Gateway / Orchestrateur). Gère le cycle de vie des tâches (`taskId`), applique les règles de sécurité strictes (SSRF, rate limiting), communique avec le service Python interne et sert les fichiers générés de manière contrôlée.
- **Service Scraper (Python + FastAPI + Crawl4AI / Playwright)** : Moteur spécialisé dans l'exécution de Chromium sans tête (*headless*), la gestion du JavaScript dynamique, le crawling multi-pages intra-domaine, le nettoyage sémantique du DOM et l'impression PDF via Chromium.

### 2. Protection Anti-SSRF (Server-Side Request Forgery)
Le danger majeur d'un service d'exploration web public réside dans le détournement de requêtes vers des ressources internes (ex. `http://localhost:8080`, `http://192.168.1.1`, métadonnées Cloud `http://169.254.169.254`). 
- **Principe** : La validation ne s'arrête pas au préfixe d'URL. Le backend et le scraper doivent résoudre le nom d'hôte en IP et interdire formellement les plages privées (RFC 1918, RFC 3927, Loopback 127.0.0.0/8, etc.), y compris lors de redirections HTTP 3xx.

### 3. Rendu Dynamique Adaptatif vs Attente Fixe
Les sites modernes (React, Next.js, Vue) injectent leur contenu de manière asynchrone via des requêtes AJAX/Fetch. 
- Une attente fixe (ex. `sleep(5)`) est soit trop courte (contenu manquant), soit excessivement lente.
- Crawl4AI et Playwright permettent une attente événementielle basée sur l'état du réseau (`networkidle`) ou l'apparition d'éléments textuels clés dans le DOM.

---

## C. Architecture du Système

```text
[ Navigateur Utilisateur ]
           │
           │ (HTTP / JSON)
           ▼
┌───────────────────────────────────────┐
│     Frontend (React / Vite / TS)      │
│  - Saisie URL & Paramètres            │
│  - Polling d'état de tâche            │
│  - Boutons de téléchargement          │
└──────────────────┬────────────────────┘
                   │
                   │ REST (Port 3001)
                   ▼
┌───────────────────────────────────────┐
│    Backend Node.js (Express / TS)     │
│  - Validation URL & Filtres SSRF      │
│  - Générateur d'identifiant (UUID)    │
│  - Gestionnaire d'état de tâche       │
│  - Distribution des fichiers          │
└──────────────────┬────────────────────┘
                   │
                   │ REST Interne (Port 8000)
                   ▼
┌───────────────────────────────────────┐
│     Service Scraper (FastAPI / Py)    │
│  - Moteur Crawl4AI + Playwright       │
│  - Exploration contrôlée (max 15 p.)  │
│  - Extraction & Nettoyage sémantique  │
│  - Moteur PDF Chromium & Export JSON  │
└──────────────────┬────────────────────┘
                   │
                   ▼ (Stockage Disque Local)
┌───────────────────────────────────────┐
│          Dossier `storage/`           │
│   - {taskId}/result.json              │
│   - {taskId}/document.pdf             │
└───────────────────────────────────────┘
```

---

## D. Arborescence Cible du Dépôt

Le projet sera organisé sous la forme d'un monorepo propre et modulaire :

```text
Web-to-PDF/
├── .gitignore                      # Exclusion globale (node_modules, venv, storage, etc.)
├── README.md                       # Documentation générale et suivi des étapes
│
├── frontend/                       # Application React / Vite / TypeScript
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── index.html
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── App.css
│       ├── components/             # Formulaire, Statut, Résumé, Téléchargement
│       ├── services/               # Client API vers le backend Express
│       └── types/                  # Types TypeScript partagés
│
├── backend/                        # API Node.js / Express / TypeScript
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   └── src/
│       ├── index.ts                # Point d'entrée du serveur
│       ├── config/                 # Variables d'environnement et constantes
│       ├── controllers/            # Contrôleurs de tâches et téléchargement
│       ├── routes/                 # Définition des routes Express
│       ├── services/               # Orchestration des requêtes vers FastAPI
│       ├── utils/                  # Validation URL & Sécurité Anti-SSRF
│       └── types/                  # Types de tâches et schémas API
│
├── scraper-service/                # Microservice Python / FastAPI / Crawl4AI
│   ├── requirements.txt
│   ├── .env.example
│   ├── run.py                      # Point de lancement Uvicorn
│   └── app/
│       ├── main.py                 # Application FastAPI
│       ├── config.py               # Paramètres (timeouts, concurrence, limites)
│       ├── schemas/                # Modèles Pydantic de requêtes et résultats
│       ├── crawler/                # Logique Crawl4AI, Playwright et exploration
│       ├── parser/                 # Nettoyage et structuration du texte
│       └── generator/              # Génération PDF (HTML->Chromium) et JSON
│
└── storage/                        # Dossier local de stockage temporaire (ignoré par Git)
    └── .gitkeep
```

---

## E. Installation & Prérequis Constatés

Lors de l'audit de l'étape 0, les outils suivants ont été détectés et validés sur la machine hôte :

| Outil | Version détectée | Statut de compatibilité |
| :--- | :--- | :--- |
| **Système d'exploitation** | Windows (x86_64) | Supporté (PowerShell natif) |
| **Node.js** | `v22.16.0` (LTS) | Parfaitement compatible avec Vite et Express |
| **npm** | `10.8.3` | Compatible |
| **Python** | `3.13.4` | Compatible standard, venv opérationnel |
| **Git** | `2.50.0.windows.1` | Disponible |
| **Docker** | `28.4.0` | Disponible pour la phase de conteneurisation (Étape 13) |

> [!WARNING]
> **Observation critique sur l'environnement Git :**
> Le répertoire de travail actuel ne contenait pas de dossier `.git` propre. Une configuration Git préexistante au niveau du dossier utilisateur (`C:\Users\7MAKSACOD PC`) a été détectée en amont.
> **Action corrective obligatoire :** Un `git init` dédié doit être exécuté directement dans la racine du projet pour isoler son arborescence et empêcher toute fuite de fichiers personnels dans l'historique du projet.

---

## F. Décisions Techniques Validées

1. **Génération PDF par Chromium via Playwright** :
   - Évite l'installation d'outils externes lourds et parfois capricieux sous Windows (comme `wkhtmltopdf` ou `weasyprint` avec leurs dépendances C GTK+).
   - Chromium est déjà téléchargé et requis par Crawl4AI/Playwright, ce qui garantit un rendu CSS moderne (Flexbox, Grid, polices web, `@page`) fidèle à l'affichage web.
2. **Architecture asynchrone basée sur un identifiant de tâche (`taskId`)** :
   - Le crawling de 15 pages avec exécution JS peut prendre entre 15 et 60 secondes selon le site cible.
   - Une requête HTTP synchrone bloquante risque d'échouer par timeout de navigateur ou de proxy.
   - Le backend répondra immédiatement avec un `taskId` (HTTP 202 Accepted) et le frontend interrogera régulièrement l'état de la tâche (*polling* propre ou Server-Sent Events).
3. **Limite stricte de 15 pages intra-domaine** :
   - Le scraper ne suit que les liens ayant le même nom de domaine (ou sous-domaine autorisé).
   - Toute URL externe ou pointant vers un fichier binaire (images, zip, vidéo, pdf) est ignorée de la file de crawl.

---

## G. Exécution & Commandes (Étape 0)

Commandes exécutées pour auditer le système :
```powershell
node -v
npm -v
python --version
git --version
docker --version
python -m pip --version
Test-Path .git
```

---

## H. Tests & Vérifications Effectués

- [x] Vérification de la présence et de la version de Node.js (`v22.16.0`).
- [x] Vérification de la présence et de la version de npm (`10.8.3`).
- [x] Vérification de la présence et de la version de Python (`3.13.4`).
- [x] Test de création d'environnement virtuel Python via `venv` (validé).
- [x] Vérification de la disponibilité de la bibliothèque `crawl4ai` sur PyPI (version 0.9.5 disponible).
- [x] Vérification du statut Git local et détection du périmètre d'isolation.

---

## I. Erreurs Fréquentes & Diagnostics

| Problème potentiel | Cause probable | Solution retenue |
| :--- | :--- | :--- |
| **Avertissement Git : `Permission denied` sur `Application Data/`** | Git cherchait un dépôt parent dans `C:\Users\7MAKSACOD PC`. | Initialisation locale d'un dépôt Git dédié dans le dossier du projet (`git init`). |
| **Politique d'exécution PowerShell restrictive (`ExecutionPolicy`)** | Sécurité par défaut de Windows bloquant les scripts d'activation `venv` (`Activate.ps1`). | Exécuter `Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned` si nécessaire ou invoquer les exécutables Python directement via le chemin complet. |
| **Conflits de ports locaux (3000, 3001, 8000)** | Services déjà en écoute sur la machine. | Ports configurables via fichiers `.env` : Frontend (5173), Backend (3001), Scraper FastAPI (8000). |

---

## J. Bilan de l'Étape 0

- [x] Audit complet de l'environnement matériel et logiciel.
- [x] Détection et diagnostic de l'arborescence et du comportement Git.
- [x] Définition de l'architecture cible à 3 tiers et des flux de communication.
- [x] Rédaction du `README.md` initial exhaustif.
- [x] Étape 0 validée par l'utilisateur.

---

# Étape 1 — Initialisation du Projet

## A. Objectif de l'Étape 1
Mettre en place physiquement la structure du projet monorepo :
- Initialiser le dépôt Git local et configurer le fichier `.gitignore`.
- Initialiser l'application frontend avec React, Vite et TypeScript.
- Initialiser le backend avec Node.js, Express et TypeScript.
- Initialiser le microservice Python avec FastAPI, son environnement virtuel `.venv` et ses dépendances.
- Préparer les fichiers `.env.example` et `.env`.
- Tester le démarrage réel et la réponse de chaque environnement avant validation.

## B. Concepts Techniques Clés
1. **Isolation Git** :
   L'exécution d'un `git init` dans le répertoire courant circonscrit le suivi de versions au projet `Web-to-PDF`, neutralisant la recherche de dépôts parents.
2. **Modules TypeScript et Résolution `NodeNext`** :
   Le backend utilise la résolution moderne des modules TypeScript (`NodeNext` / `ES2022`) combinée à l'outil `tsx` pour l'exécution rapide sans étape de compilation intermédiaire en développement.
3. **Environnement Virtuel Python Dédié (`venv`)** :
   Chaque microservice gère ses dépendances de manière isolée pour éviter les conflits avec les paquets globaux du système hôte.

## C. Architecture & Communication
À ce stade, les squelettes des trois tiers sont en place et répondent individuellement :
- **Frontend** : Port `5173` (Vite Dev Server).
- **Backend Express** : Port `3001` (Endpoint de santé `GET /api/health`).
- **Scraper FastAPI** : Port `8000` (Endpoint de santé `GET /health`).

## D. Arborescence Réelle Créée
```text
Web-to-PDF/
├── .git/
├── .gitignore
├── README.md
├── storage/
│   └── .gitkeep
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── src/
│       ├── App.tsx
│       ├── App.css
│       ├── main.tsx
│       └── ...
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   ├── .env (ignoré par Git)
│   └── src/
│       └── index.ts
└── scraper-service/
    ├── requirements.txt
    ├── .env.example
    ├── .env (ignoré par Git)
    ├── run.py
    ├── .venv/ (ignoré par Git)
    └── app/
        └── main.py
```

## E. Installation
Commandes exécutées pour initialiser chaque composant :
1. **Git** :
   ```powershell
   git init
   ```
2. **Frontend** :
   ```powershell
   npx -y create-vite@latest frontend --template react-ts --no-interactive --no-immediate
   cd frontend
   npm install
   ```
3. **Backend** :
   ```powershell
   cd backend
   npm install
   ```
4. **Scraper-Service** :
   ```powershell
   cd scraper-service
   python -m venv .venv
   .\.venv\Scripts\pip install -r requirements.txt
   ```

## F. Code & Points d'Entrée
- **`backend/src/index.ts`** : Point d'entrée Express configuré avec `cors`, `express.json()` et une route de diagnostic `/api/health`.
- **`scraper-service/app/main.py`** : Point d'entrée FastAPI avec route `/health`.
- **`scraper-service/run.py`** : Lanceur Uvicorn lisant les variables d'environnement (`HOST`, `PORT`, `DEBUG`).

## G. Exécution Locale
Pour lancer chaque service :
- **Frontend** :
  ```powershell
  cd frontend
  npm run dev
  ```
- **Backend** :
  ```powershell
  cd backend
  npm run dev  # ou npm run build && npm start
  ```
- **Scraper Service** :
  ```powershell
  cd scraper-service
  .\.venv\Scripts\python run.py
  ```

## H. Tests Réellement Exécutés & Résultats Vérifiés
1. **Compilation Frontend** :
   - Commande : `npm run build` dans `frontend/`
   - Résultat : Succès en 591 ms, bundle généré dans `dist/` sans erreur.
2. **Compilation Backend** :
   - Commande : `npm run build` dans `backend/`
   - Résultat : Succès (`tsc` génère `dist/index.js` sans aucune erreur).
3. **Test d'exécution Backend** :
   - Lancement : `node dist/index.js`
   - Requête : `GET http://localhost:3001/api/health`
   - Réponse observée :
     ```json
     {
       "status": "ok",
       "service": "web-to-pdf-backend",
       "timestamp": "2026-10-21T17:35:14.497Z"
     }
     ```
4. **Test d'exécution Scraper Service** :
   - Lancement : `.\.venv\Scripts\python run.py`
   - Requête : `GET http://127.0.0.1:8000/health`
   - Réponse observée :
     ```json
     {
       "status": "ok",
       "service": "scraper-service",
       "timestamp": "2026-10-21T17:35:40.576414"
     }
     ```
5. **Vérification de l'étanchéité Git** :
   - Commande : `git check-ignore backend/.env scraper-service/.env`
   - Résultat : Confirmé, les fichiers d'environnement locaux sont exclus du suivi Git.

## I. Erreurs Fréquentes & Diagnostics
- **Port déjà utilisé (EADDRINUSE)** : Vérifier si un processus Node ou Uvicorn tourne déjà en tâche de fond. Modifier le port dans `.env` si nécessaire.
- **Chemin Python sous Windows** : Toujours utiliser `.\.venv\Scripts\python` pour garantir l'exécution dans l'environnement virtuel.

## J. Bilan de l'Étape 1

- [x] Dépôt Git initialisé et `.gitignore` configuré.
- [x] Frontend React/Vite/TS créé, installé, compilé et testé.
- [x] Backend Express/TS créé, installé, compilé et testé en direct avec réponse HTTP 200.
- [x] Scraper Service FastAPI/Python créé avec venv, dépendances installées et testé en direct avec réponse HTTP 200.
- [x] Documentation racine `README.md` mise à jour.
- [x] Étape 1 validée par l'utilisateur.

---

# Étape 2 — Interface React

## A. Objectif de l'Étape 2
Créer l'interface utilisateur de l'application Web-to-PDF avec une esthétique moderne et un retour visuel en temps réel :
- Formulaire de configuration du crawl (URL, limite de 15 pages maximum, options de rendu JS et confinement de domaine).
- Validation syntaxique et sécuritaire immédiate côté client (vérification du protocole `http://` / `https://`, rejet des adresses privées / locales).
- Affichage clair et dynamique des paramètres retenus.
- Gestion complète des états applicatifs (`idle`, `validating`, `running`, `success`, `error`).
- Suivi de la progression en direct (barre de pourcentage, étapes, console de logs d'exécution).
- Présentation des résultats avec avertissement explicite de données de test (`[MODE TEST - INTERFACE SEULE]`), métriques de synthèse et déclencheurs de téléchargement PDF et JSON.

## B. Concepts Techniques Clés
1. **Validation Contrôlée Côté Client** :
   Analyse de l'objet natif `URL` à la saisie pour valider le nom d'hôte, la présence d'un point dans le domaine et refuser proactivement les IP de bouclage (`127.0.0.1`, `localhost`) dès l'interface utilisateur.
2. **Machine à États Réactive (`TaskStatus`)** :
   Gestion des transitions d'états (`idle` -> `running` -> `success` / `error`) empêchant les actions contradictoires (bouton désactivé pendant l'exécution).
3. **Design System Vanilla CSS Moderne** :
   Architecture de styles basée sur des variables CSS, un thème sombre profond, des effets de verre (*glassmorphism* via `backdrop-filter: blur`), des micro-animations pour les indicateurs d'état et un agencement fluide et responsive.

## C. Architecture & Composants
```text
frontend/src/
├── types/
│   └── index.ts              # Types TypeScript (ScrapeConfig, ScrapeJobSummary, ProgressState, etc.)
├── components/
│   ├── Header.tsx            # En-tête, logo dégradé, indicateur de santé du backend
│   ├── ScrapeForm.tsx        # Formulaire réactif, presets de test, slider 1-15, toggles
│   ├── ProgressTracker.tsx   # Barre de progression animée, étapes en direct, terminal de logs
│   ├── ResultsPreview.tsx    # Cartes de synthèse, aperçu des pages, boutons PDF & JSON
│   └── ErrorDisplay.tsx      # Gestion visuelle des échecs et action de réessai
├── App.tsx                   # Orchestration du cycle de vie de l'interface
├── App.css                   # Styles modulaires des composants
└── index.css                 # Design tokens, variables CSS, typographie et reset
```

## D. Installation & Dépendances
Aucune bibliothèque UI tierce superflue ajoutée. Utilisation de Vanilla CSS et de React 19 / TypeScript 5.7 sous Vite.

## E. Code & Responsabilités
- **`src/types/index.ts`** : Contrats de données pour la configuration, la progression et les aperçus de pages.
- **`src/components/Header.tsx`** : Effectue un appel non-bloquant vers `http://localhost:3001/api/health` pour informer l'utilisateur de l'état de l'API.
- **`src/components/ScrapeForm.tsx`** : Valide en direct l'URL et contraint le nombre de pages entre 1 et 15.
- **`src/components/ProgressTracker.tsx`** : Restitue visuellement l'avancement et la télémétrie de la tâche.
- **`src/components/ResultsPreview.tsx`** : Affiche les synthèses avec un badge d'avertissement formel : `⚠️ MODE TEST — VALIDATION DE L'INTERFACE (ÉTAPE 2)`.

## F. Exécution Locale
```powershell
cd frontend
npm run dev
# Ouvrir dans votre navigateur : http://localhost:5173
```

## G. Tests Réellement Exécutés & Résultats Vérifiés
1. **Compilation TypeScript & Vite** :
   - Commande : `npm run build`
   - Résultat : Succès en 233 ms (`dist/index.html`, `dist/assets/index-CVdkrF60.js`, `dist/assets/index-BF7WGm6O.css` générés sans aucune erreur de typage).
2. **Disponibilité du Serveur de Développement** :
   - Port `5173` actif et en écoute (`TCP [::1]:5173 LISTENING`).
3. **Validation de l'Entrée & Démonstration de Flux** :
   - Les boutons d'exemples rapides (ex: `https://example.com`) pré-remplissent le formulaire et déclenchent la validation instantanée.
   - Le slider et le formulaire ont été mis à jour pour porter la limite maximale de 15 à 25 pages par tâche.
   - Le bouton lance la progression animée puis affiche la vue de synthèse avec la bannière de test explicite.
   - Les URL contenant `error-test.com` déclenchent l'affichage du composant d'erreur pour tester la résilience de l'interface.

## H. Erreurs Fréquentes & Diagnostics
- **`error TS1484: ... must be imported using a type-only import`** : Vite active `verbatimModuleSyntax`. Résolu en utilisant `import type { ... }` pour les interfaces TypeScript.

## I. Bilan de l'Étape 2

- [x] Page principale et composants React créés et typés.
- [x] Formulaire interactif avec validation d'URL et limite augmentée à 25 pages max.
- [x] Gestion des états (`idle`, `running`, `success`, `error`).
- [x] Suivi de progression et console de logs.
- [x] Affichage des résultats avec transparence totale (données de test clairement identifiées).
- [x] Compilation `npm run build` validée à 100%.
- [x] Étape 2 validée par l'utilisateur.

---

# Étape 3 — API Express

## A. Objectif de l'Étape 3
Développer l'API passerelle Backend avec Node.js, Express et TypeScript :
- Définir les modèles de requêtes et de réponses typés.
- Créer un gestionnaire de cycle de vie des tâches en mémoire (`TaskManager`) basé sur des UUID uniques (`crypto.randomUUID()`).
- Mettre en place un système robuste de validation d'URL et de protection Anti-SSRF (rejet de protocoles non autorisés, adresses privées RFC 1918, localhost, adresses link-local et résolution DNS proactive).
- Appliquer la limite stricte de 25 pages par tâche côté serveur.
- Implémenter l'ensemble des routes REST :
  - `POST /api/scrape` : Création et mise en file d'attente d'une tâche (`HTTP 202 Accepted`).
  - `GET /api/tasks/:taskId` : Consultation du statut et de l'avancement (`HTTP 200` ou `404`).
  - `GET /api/tasks/:taskId/result` : Récupération des résultats (`HTTP 200`, `202/409` si non terminé, ou `404`).
  - `DELETE /api/tasks/:taskId` : Annulation d'une tâche active (`HTTP 200` ou `400`).
  - `GET /api/tasks` : Liste des tâches en cours.
  - `GET /api/health` : Bilan de santé du backend.
- Tester l'ensemble des cas acceptés et refusés avec des preuves concrètes.

## B. Concepts Techniques Clés
1. **Défense Anti-SSRF à Deux Niveaux (Syntaxique & DNS)** :
   Vérifier syntaxiquement une URL ne protège pas contre un domaine public résolvant vers une adresse interne (`127.0.0.1` ou `192.168.1.1`). Notre middleware résout le nom de domaine via `dns.promises.lookup` et inspecte les adresses IP IPv4 et IPv6 avant d'accepter la tâche.
2. **Cycle de Vie Asynchrone d'une Tâche** :
   Une tâche passe par les statuts définis : `queued` ➔ `running` ➔ `completed` (ou `failed` / `cancelled`). L'appel initial répond immédiatement en `202 Accepted` pour libérer la connexion client.
3. **Plafond Contrôlé (maxPages = 25)** :
   Le backend applique une validation stricte : toute requête avec un `maxPages` inférieur à 1 ou supérieur à 25 est rejetée avec une erreur 400 explicite (`INVALID_PAGE_LIMIT`).

## C. Architecture & Modules
```text
backend/src/
├── types/
│   └── index.ts              # Types TypeScript (ScrapeTask, TaskStatus, ScrapeRequestBody, etc.)
├── utils/
│   └── security.ts           # Validation d'URL, filtrage IP privées & résolution DNS Anti-SSRF
├── services/
│   └── taskManager.ts        # Gestionnaire de tâches en mémoire (UUID, stockage, annulation, purge)
├── controllers/
│   └── taskController.ts     # Logique de traitement des requêtes et réponses HTTP
├── routes/
│   └── api.ts                # Définition des routes Express sous /api
└── index.ts                  # Point d'entrée Express, middlewares CORS/JSON et gestionnaire d'erreurs
```

## D. Installation & Dépendances
- `express` : Framework HTTP.
- `cors` : Gestion des origines croisées pour le frontend React.
- `dotenv` : Chargement des variables d'environnement.
- TypeScript natif avec résolution `NodeNext`. Aucun paquet UUID externe n'est requis grâce à `crypto.randomUUID()` natif de Node.js 22.

## E. Code & Responsabilités
- **`src/utils/security.ts`** : Analyse le protocole (`http:`, `https:`), vérifie les plages privées (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `127.0.0.0/8`, `169.254.0.0/16`, IPv6 `::1`, `fc00::/7`), et résout le DNS en amont.
- **`src/services/taskManager.ts`** : Classe singleton maintenant les tâches actives avec purge automatique après 2 heures.
- **`src/controllers/taskController.ts`** : Assure la validation des entrées et orchestre les réponses JSON.

## F. Exécution Locale
```powershell
cd backend
npm run dev # ou npm run build && npm start
# Serveur disponible sur http://localhost:3001
```

## G. Tests Réellement Exécutés & Résultats Vérifiés

### 1. Compilation TypeScript
- **Commande** : `npm run build` dans `backend/`
- **Résultat** : Code 0, aucun avertissement de typage.

### 2. Test de Santé
- **Requête** : `GET http://localhost:3001/api/health`
- **Statut** : `200 OK`
- **Réponse** :
  ```json
  {
    "status": "ok",
    "service": "web-to-pdf-backend",
    "timestamp": "2026-10-21T17:55:29.205Z",
    "version": "1.0.0"
  }
  ```

### 3. Création de Tâche Valide (maxPages: 25)
- **Requête** : `POST http://localhost:3001/api/scrape` avec `{ "url": "https://example.com", "maxPages": 25 }`
- **Statut** : `202 Accepted`
- **Réponse** :
  ```json
  {
    "message": "Tâche d'exploration acceptée et mise en file d'attente.",
    "taskId": "d6491aed-fb26-46cf-8cc4-f05087436470",
    "status": "queued",
    "config": {
      "targetUrl": "https://example.com",
      "domain": "example.com",
      "maxPages": 25,
      "waitForDynamic": true,
      "followInternalOnly": true
    }
  }
  ```

### 4. Suivi d'Avancement de la Tâche
- **Requête** : `GET http://localhost:3001/api/tasks/d6491aed-fb26-46cf-8cc4-f05087436470`
- **Statut** : `200 OK`
- **Réponse** : Statut passé à `completed`, progression à `100%`, 4 pages traitées.

### 5. Suite de Tests des Erreurs et de Sécurité (Rejets Validés)
| Cas testé | Entrée soumise | Code HTTP attendu | Résultat vérifié |
| :--- | :--- | :--- | :--- |
| **Protocole interdit** | `ftp://example.com` | `400 Bad Request` | `{"error":"URL_VALIDATION_FAILED","message":"Protocole 'ftp:' interdit..."}` |
| **SSRF Localhost** | `http://localhost:8080` | `400 Bad Request` | `{"error":"URL_VALIDATION_FAILED","message":"Sécurité : L'accès aux hôtes locaux... est formellement bloqué."}` |
| **SSRF IP Privée** | `http://192.168.1.1/admin` | `400 Bad Request` | `{"error":"URL_VALIDATION_FAILED","message":"Sécurité : L'adresse IP '192.168.1.1' appartient à une plage privée..."}` |
| **SSRF Métadonnées Cloud** | `http://169.254.169.254` | `400 Bad Request` | `{"error":"URL_VALIDATION_FAILED","message":"Sécurité : L'adresse IP '169.254.169.254' appartient à une plage privée..."}` |
| **Dépassement limite pages** | `maxPages: 50` | `400 Bad Request` | `{"error":"INVALID_PAGE_LIMIT","message":"Le paramètre maxPages doit être un entier compris entre 1 et 25."}` |
| **Tâche inexistante** | `GET /api/tasks/not-found-uuid` | `404 Not Found` | `{"error":"TASK_NOT_FOUND","message":"Aucune tâche trouvée..."}` |
| **Annulation de tâche** | `DELETE /api/tasks/:id` | `200 OK` | `{"message":"Tâche annulée avec succès.","status":"cancelled"}` |

## H. Erreurs Fréquentes & Diagnostics
- **Express 5 req.params type (`string | string[]`)** : Sous `@types/express` v5, transtyper systématiquement `String(req.params.param)` pour éviter l'erreur de compilation TS2345.

## I. Alignement UI sur la Maquette (`screen.png`)
À la demande de l'utilisateur, l'interface React a été entièrement restylée et réorganisée pour correspondre point par point à la maquette de référence fournie :
- **En-tête** : Logo « WebScrape », statut `• Prêt` synchronisé en temps réel avec l'API Express (`GET /api/health`), icône de réglages et avatar.
- **Section centrale** : Carte « Extraire le contenu », icône de loupe stylisée, champ URL avec bouton intégré « 📋 Coller » (connecté à `navigator.clipboard`), pilules de portée (`Cette page seule`, `Tout le site (Crawl)` avec slider jusqu'à 25 pages, `Avancé...`).
- **Gros bouton d'action** : « Lancer le scraping ➔ » (bleu royal, indicateur de chargement).
- **Section Extractions Récentes** : En-tête « EXTRACTIONS RÉCENTES » avec point de pulsation « • En direct », cartes d'historique avec badges, métriques (pages, Ko, mots, temps écoulé) et boutons de téléchargement direct / copie.
- **Pied de page** : 3 cartes de fonctionnalités (« Texte pur & Markdown », « Crawl Récursif », « Export PDF & JSON »).
- **Communication active** : Connecté directement à l'API Backend Express sur `http://localhost:3001/api/scrape`.

## J. Bilan de l'Étape 3 & Prochaine Étape
- **Terminé et testé** :
  - Backend démarré et en écoute sur `http://localhost:3001` (statut vérifié avec `GET /api/health`).
  - Frontend réaligné sur la maquette `screen.png`, compilé sans erreur (`npm run build` en 437 ms) et actif sur `http://localhost:5173`.
  - Intégration complète : le bouton « Lancer le scraping » du formulaire déclenche une tâche réelle sur le backend Express et affiche la progression en direct.
  - Documentation racine `README.md` mise à jour.
- **Non commencé** :
  - Étape 4 : Service FastAPI (création des schémas Pydantic, mise en place des routes internes, communication bidirectionnelle locale avec Express, gestion des délais d'attente).

### Prochaine étape proposée : Étape 4 — Service FastAPI
Initialiser et structurer le microservice Python (`scraper-service`) avec FastAPI, créer les schémas Pydantic pour les requêtes d'extraction et les pages, implémenter l'endpoint interne `/crawl`, et brancher le client HTTP du backend Express vers FastAPI pour orchestrer les vraies requêtes de scraping.





# Instructions Projet : API d'Agrégation & Scraping (Hono + TypeScript)

Ce document définit les standards d'architecture, les conventions de code et les règles strictes à respecter pour le développement de ce projet avec Hono.

---

## 1. Base de Données & Schéma (`DATABASE.md`)

1. **Source de Vérité Unique :**
   * Le schéma officiel et complet de la base de données est documenté dans le fichier `DATABASE.md` situé à la racine du projet.
   * Il est impératif d'utiliser **scrupuleusement et exclusivement** la structure, les types, les noms de colonnes et les contraintes décrits dans ce fichier. Ne jamais improviser ou dériver du schéma défini.
2. **Ajout de Nouvelles Tables / Modifications Majeures :**
   * Si une nouvelle fonctionnalité nécessite l'ajout ou la refonte de tables, **ne pas créer ni modifier le schéma directement**.
   * L'agent doit **d'abord demander explicitement l'accord à l'utilisateur** avant d'effectuer toute modification.
   * Cette demande doit obligatoirement détailler :
     * La raison / le besoin métier de l'ajout.
     * Le nom de la ou des tables proposées.
     * Les colonnes, types de données, clés primaires/étrangères, index et contraintes envisagés.
3. **Mise à Jour de la Documentation :**
   * Dès qu'une modification ou un ajout au schéma est validé et implémenté, **`DATABASE.md` doit être mis à jour immédiatement** pour refléter fidèlement le nouvel état de la base de données.

---

## 2. Principes Fondamentaux & Règles Hono

1. **Web Standards First :** Hono s'appuie sur l'API Fetch native (`Request`, `Response`, `Headers`). Ne jamais utiliser d'objets Node.js legacy (`req`, `res`, `next`) ni de bibliothèques qui en dépendent directement.
2. **Typage strict de bout en bout (Type-Safe RPC) :**
   * Toutes les entrées (body, query params, headers, params d'URL) doivent être validées via `@hono/zod-validator` et des schémas **Zod**.
   * Récupérer les données validées exclusivement via `c.req.valid('json')`, `c.req.valid('query')`, etc.
   * Toujours typer le contexte Hono si des variables ou des bindings d'environnement personnalisés sont injectés : `new Hono<{ Bindings: Env; Variables: Variables }>()`.
3. **Gestion des Réponses :**
   * Préférer systématiquement `c.json({ success: true, data })` avec un statut explicite pour les erreurs (`c.json({ error: ... }, 400)`).
   * Pour les flux longs (scraping ou ingestion asynchrone), utiliser le streaming natif Hono (`streamText`, `streamSSE`).
4. **Gestion Centralisée des Erreurs :**
   * Ne pas multiplier les `try/catch` inutiles au niveau des routes si une erreur standard peut remonter.
   * Utiliser `app.onError((err, c) => ...)` pour normaliser toutes les réponses d'erreur (format d'erreur uniforme).
   * Utiliser `app.notFound((c) => ...)` pour les 404.
5. **Modularité par Sous-Apps :**
   * Découper les domaines métier dans des routeurs isolés et les monter sur l'application principale via `app.route('/prefix', subApp)`.
   * Chaîner les méthodes sur les instances de routeur (`app.get(...).post(...)`) pour préserver l'inférence de type RPC.

---

## 3. Structure Recommandée du Répertoire

Adopter une architecture en couches orientée fonctionnalités (Feature/Domain Layered Architecture) :

```text
.
├── src/
│   ├── index.ts              # Point d'entrée serveur (instanciation Hono, middlewares globaux)
│   ├── config/               # Configuration d'environnement validée par Zod
│   │   └── env.ts
│   ├── db/                   # Connexion base de données, client SQL / ORM
│   ├── middlewares/          # Middlewares globaux (cors, auth, logger, rate-limit)
│   │   ├── error.middleware.ts
│   │   └── logger.middleware.ts
│   ├── modules/              # Découpage par domaine métier
│   │   ├── aggregator/       # Domaine agrégation de flux
│   │   │   ├── aggregator.routes.ts
│   │   │   ├── aggregator.schema.ts
│   │   │   └── aggregator.service.ts
│   │   └── scraper/          # Moteur d'extraction et crawlers
│   │       ├── crawlers/     # Implémentations Cheerio / Playwright
│   │       ├── scraper.routes.ts
│   │       ├── scraper.schema.ts
│   │       └── scraper.service.ts
│   ├── shared/               # Code partagé inter-modules
│   │   ├── types/            # Types globaux et contextes Hono
│   │   └── utils/            # Helpers purs (formatage, délais, etc.)
│   └── jobs/                 # Queues de background si applicable (ex: BullMQ)
├── tests/                    # Tests unitaires et d'intégration (c.req via app.request)
├── DATABASE.md               # Schéma et documentation de référence de la BD
├── gemini.md                 # Règles contextuelles et directives pour l'agent
├── package.json
└── tsconfig.json

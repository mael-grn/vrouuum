# React Project Architecture & Standards (`GEMINI.md`)

Ce document définit les normes d'ingénierie, l'architecture logicielle et les conventions de code applicables à l'ensemble du projet.

---

## 1. Stack Technique & Principes Fondamentaux

* **Runtime & Framework** : React 19 / React 18 avec TypeScript en mode strict (`strict: true`).
* **Paradigme** : Composants fonctionnels exclusifs avec Hooks (`useMemo`, `useCallback`, Hooks personnalisés).
* **Styling** : Utilitaire Tailwind CSS (ou modules CSS isolés) ; styles déclaratifs et absence totale de styles inline non dynamiques.
* **Immutabilité** : Manipulation immuable obligatoire des états et props.

---

## 2. Architecture des Dossiers (Feature-Driven / Modular)

L'organisation repose sur le regroupement par domaine fonctionnel (*features*) plutôt que par type de fichier purement technique.

```text
src/
├── app/                  # Configuration globale, routeur, providers racines
├── assets/               # Fichiers statiques globaux (icônes, images, polices)
├── components/           # Composants UI partagés / transverses ("dumb" ou design system)
│   ├── ui/               # Atomes UI (Button, Input, Modal, Badge)
│   └── feedback/         # Composants d'état global (ErrorBoundary, Loader)
├── features/             # Modules métier autonomes
│   └── <feature_name>/
│       ├── api/          # Requêtes serveur, mutateurs, queries associées au domaine
│       ├── components/   # Composants spécifiques à cette fonctionnalité
│       ├── hooks/        # Logique réutilisable et cycle de vie dédiés
│       ├── types/        # Schémas et interfaces TypeScript
│       └── utils/        # Fonctions pures et calculs spécifiques
├── hooks/                # Hooks transverses (useDebounce, useMediaQuery)
├── lib/                  # Configurations d'outils tiers (clients HTTP, analytics)
├── types/                # Types globaux (utilisateurs, API responses, env)
└── utils/                # Fonctions pures universelles (formatage, validations)

```

---

## 3. Conception et Cycle de Vie des Composants

### Séparation Métier / Présentation

* **Composants Conteneurs / Pages** : Récupèrent les données via des hooks et gèrent l'état d'orchestration.
* **Composants Présentationnels** : Reçoivent des props, n'ont pas d'effets secondaires et émettent des événements via callbacks.

### Règles d'Or des Hooks

1. **Limiter `useEffect**` :
* Ne jamais synchroniser deux états locaux avec un effet (calculer directement dans le rendu).
* Préférer les bibliothèques de requêtage (TanStack Query, SWR) pour le fetch de données au lieu d'associer `useEffect` + `useState`.


2. **Hooks Personnalisés** :
* Extraire systématiquement la logique contenant plus de deux hooks couplés dans un hook dédié (`useUserProfile`, `useTableFilter`).


3. **Nettoyage d'Effet** :
* Retourner systématiquement une fonction de cleanup pour les abonnements, `AbortController`, timers ou écouteurs d'événements.



---

## 4. Gestion de l'État (State Management)

| Niveau d'État | Solution Recommandée | Cas d'Usage |
| --- | --- | --- |
| **Local** | `useState`, `useReducer` | Formulaires, toggles UI, état éphémère |
| **Serveur / Cache** | TanStack Query (React Query) | Données d'API, mutations, pagination, mise en cache |
| **Global Client** | Zustand ou Context API léger | Session utilisateur, thème actif, notifications |
| **URL** | Paramètres de recherche (`searchParams`) | Filtres, pagination, onglets, tri |

> **Règle Context API** : Ne pas utiliser React Context pour stocker des données qui changent à haute fréquence (risque de re-rendus en cascade sur l'ensemble du sous-arbre).

---

## 5. TypeScript & Typage Strict

* **Typage explicite des props** :
```typescript
interface UserCardProps {
  readonly id: string;
  readonly name: string;
  readonly role: 'admin' | 'user' | 'guest';
  readonly onSelect: (id: string) => void;
}

```


* **Bannissement de `any**` : Utiliser `unknown` combiné avec des types guards ou des schémas de validation (Zod) pour les données inconnues.
* **Prop-drilling évité** : Ne pas passer plus de 3 niveaux de props descendantes ; composer les composants (`children` pattern) ou utiliser un contexte dédié.

---

## 6. Performance & Optimisations

1. **Memoization Ciblée** :
* Ne pas sur-optimiser : utiliser `useMemo` uniquement pour les calculs algorithmiquement coûteux ou la stabilisation de références passées en dépendance.
* Utiliser `React.memo` uniquement sur des composants feuilles lourds qui re-rendent fréquemment avec des props stables.


2. **Code Splitting** :
* Charger dynamiquement les routes et les modales volumineuses via `React.lazy` et `Suspense`.


3. **Gestion des Listes** :
* Attribuer des `key` stables et uniques (identifiant base de données ou UUID).
* Bannir l'index du tableau (`index`) comme clé si la liste peut être filtrée, triée ou modifiée.
* Virtualiser les listes excédant 100 éléments (TanStack Virtual).



---

## 7. Gestion des Erreurs et Cas Limites

* **Error Boundaries** : Encapsuler chaque route et chaque widget indépendant dans un composant `ErrorBoundary` pour isoler les crashs.
* **États Dérivés Systématiques** : Pour tout affichage asynchrone, gérer et tester explicitement les quatre états :
* *Chargement initial* (skeleton ou spinner)
* *Succès avec données*
* *Succès sans données* (empty state explicite)
* *Erreur avec action de reprise* (bouton retry)



---

## 8. Qualité de Code, Tests & CI/CD

* **Linting & Formatage** : ESLint avec `eslint-plugin-react-hooks` en mode erreur + Prettier.
* **Stratégie de Test** :
* *Tests Unitaires* (Vitest) : Fonctions utilitaires, calculs purs, transformations de données.
* *Tests d'Intégration* (React Testing Library) : Comportement orienté utilisateur (interactions réelles, requêtes via `MSW` mock service worker), sans tester l'implémentation interne ni les états privés.
* *End-to-End* (Playwright) : Parcours critiques (authentification, tunnels d'achat/validation).

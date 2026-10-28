# Référence Base de Données : Schéma Relationnel Motorsport

Ce fichier documente de manière exhaustive le schéma relationnel officiel de la base de données.
Toute requête (SQL, ORM, Zod) écrite par l'agent doit respecter rigoureusement les tables, champs et relations documentés ci-dessous.

---

## 1. Vue d'Ensemble des Tables

Le modèle est articulé autour de la compétition automobile (championnats, saisons, événements, sessions de course, engagements d'équipages et résultats) :

* **Référentiel Compétition :** `championships`, `categories`, `championship_category`, `seasons`, `events`, `circuits`.
* **Référentiel Technique & Équipes :** `brands`, `cars`, `teams`, `pilots`.
* **Engagements & Résultats :** `entries`, `entry_pilot`, `sessions`, `session_results`.

---

## 2. Définition Détaillée des Entités

### A. Hiérarchie Championnat & Calendrier

#### `championships`
Représente un championnat ou une série (ex: WEC, F1, ELMS).
* `id` : Clé primaire
* `name` : Nom du championnat
* `logo` : URL ou chemin vers le logo du championnat

#### `categories`
Classes ou catégories de véhicules (ex: Hypercar, LMGT3, LMP2).
* `id` : Clé primaire
* `name` : Nom de la catégorie
* `logo` : URL ou chemin vers l'icône / logo de la catégorie

#### `championship_category`
Table de liaison plusieurs-à-plusieurs (Many-to-Many) liant un championnat à ses catégories admises.
* `id` : Clé primaire (ou clé composite)
* `championship_id` : Clé étrangère vers `championships(id)`
* `category_id` : Clé étrangère vers `categories(id)`

#### `seasons`
Édition annuelle ou saisonnière d'un championnat.
* `id` : Clé primaire
* `championship_id` : Clé étrangère vers `championships(id)`
* `name` : Désignation de la saison (ex: "2024", "2025-2026")

#### `circuits`
Tracé / circuit accueillant des courses.
* `id` : Clé primaire
* `name` : Nom officiel du circuit (ex: "Circuit de Spa-Francorchamps")
* `country` : Pays où est situé le circuit
* `length` : Longueur du tracé (en km ou mètres)
* `type` : Type de tracé (ex: permanent, urbain, mixte)

#### `events`
Manche ou week-end de course au sein d'une saison.
* `id` : Clé primaire
* `season_id` : Clé étrangère vers `seasons(id)`
* `circuit_id` : Clé étrangère vers `circuits(id)`
* `name` : Nom de l'événement (ex: "6 Heures de Spa", "24 Heures du Mans")
* `date` : Date / week-end de déroulement

#### `sessions`
Séance spécifique au sein d'un événement (ex: Essais libres 1, Qualifications, Course).
* `id` : Clé primaire
* `event_id` : Clé étrangère vers `events(id)`
* `name` : Nom de la session (ex: "Free Practice 1", "Qualifying", "Race")
* `type` : Type de séance (ex: practice, qualifying, race)
* `date` : Date et heure programmées de la session

---

### B. Constructeurs, Véhicules & Participants

#### `brands`
Constructeur / marque automobile.
* `id` : Clé primaire
* `name` : Nom de la marque (ex: Porsche, Ferrari, Toyota)
* `logo` : URL du logo de la marque
* `country` : Pays d'origine de la marque

#### `cars`
Modèle de voiture homologué.
* `id` : Clé primaire
* `brand_id` : Clé étrangère vers `brands(id)`
* `name` : Modèle de la voiture (ex: "499P", "963", "Valkyrie AMR-LMH")
* `power` : Puissance (en ch / kW)
* `weight` : Poids (en kg)
* `year` : Année d'homologation ou de production

#### `teams`
Écurie / équipe engageant des voitures.
* `id` : Clé primaire
* `name` : Nom de l'écurie
* `logo` : URL du logo de l'écurie
* `country` : Pays sous licence duquel court l'équipe

#### `pilots`
Pilote individuel.
* `id` : Clé primaire
* `name` : Prénom
* `surname` : Nom de famille
* `country` : Nationalité / pays de licence
* `photo` : URL de la photo officielle du pilote

---

### C. Engagements & Résultats de Course

#### `entries`
Voiture engagée lors d'un événement (véhicule précis d'une écurie dans une catégorie pour un événement donné).
* `id` : Clé primaire
* `event_id` : Clé étrangère vers `events(id)`
* `team_id` : Clé étrangère vers `teams(id)`
* `car_id` : Clé étrangère vers `cars(id)`
* `category_id` : Clé étrangère vers `categories(id)`
* `number` : Numéro de course arboré par la voiture (ex: #51, #7)

#### `entry_pilot`
Table de liaison Many-to-Many associant les pilotes à une voiture engagée (particulièrement pour l'endurance avec équipages de 2 à 3 pilotes).
* `id` : Clé primaire (ou clé composite)
* `entry_id` : Clé étrangère vers `entries(id)`
* `pilot_id` : Clé étrangère vers `pilots(id)`

#### `session_results`
Ligne de classement / résultat d'un engagement lors d'une session donnée.
* `id` : Clé primaire
* `session_id` : Clé étrangère vers `sessions(id)`
* `entry_id` : Clé étrangère vers `entries(id)`
* `number` : Numéro de course reporté sur la session
* `status` : Statut final (ex: Finished, DNF, DSQ, DNS)
* `position` : Position finale obtenue
* `laps_completed` : Nombre de tours bouclés
* `total_time` : Temps total de course
* `best_lap` : Meilleur temps au tour réalisé
* `point_gained` : Points marqués attribués pour cette session

---

## 3. Matrice des Relations & Clés Étrangères

| Table Source | Champ Clé Étrangère | Table Cible | Type de Relation |
| :--- | :--- | :--- | :--- |
| `seasons` | `championship_id` | `championships` | Many-to-One |
| `championship_category` | `championship_id` | `championships` | Many-to-One |
| `championship_category` | `category_id` | `categories` | Many-to-One |
| `events` | `season_id` | `seasons` | Many-to-One |
| `events` | `circuit_id` | `circuits` | Many-to-One |
| `sessions` | `event_id` | `events` | Many-to-One |
| `cars` | `brand_id` | `brands` | Many-to-One |
| `entries` | `event_id` | `events` | Many-to-One |
| `entries` | `team_id` | `teams` | Many-to-One |
| `entries` | `car_id` | `cars` | Many-to-One |
| `entries` | `category_id` | `categories` | Many-to-One |
| `entry_pilot` | `entry_id` | `entries` | Many-to-One |
| `entry_pilot` | `pilot_id` | `pilots` | Many-to-One |
| `session_results` | `session_id` | `sessions` | Many-to-One |
| `session_results` | `entry_id` | `entries` | Many-to-One |

---

## 4. Consignes Strictes pour l'Agent

1. **Intégrité Référentielle :** Lors de l'ingestion / scraping de résultats, toujours résoudre ou insérer d'abord les entités parentes (`brands` -> `cars`, `events` -> `entries`, etc.) avant de créer les lignes de `session_results`.
2. **Pas de Champs Non Documentés :** Ne pas insérer ni requêter de colonnes qui ne figurent pas dans cette spécification.
3. **Évolution du Schéma :** Si une source scrapée contient des métriques supplémentaires (ex: vitesse de pointe, météo, statut des pneus), demander systématiquement l'accord à l'utilisateur avant d'étendre une table ou d'en créer une nouvelle.

# Spécifications & Décisions de Design — Backoffice Vrouuum

Ce document consigne l'ensemble des règles visuelles, principes d'ergonomie (UX) et choix d'implémentation de l'interface utilisateur pour le projet **Backoffice Vrouuum**.

---

## 1. Philosophie Visuelle : "Material 3 Expressive & Racing Velocity (Flat Design Vibrant)"

L'interface du backoffice adopte un parti-pris radical : **le Flat Design vibrant et saturé inspiré de Material 3 Expressive et de l'adrénaline du sport automobile** :
* **Flat Design Pur & Zéro Faux-Verre** :
  * Abandon total du glassmorphism flou ou transparent (`backdrop-blur`) au profit de surfaces solides, nettes et contrastées.
  * Tonalités stratifiées inspirées des surfaces Material 3 : conteneurs profonds (`#0b0405`), cartes solides (`#16080a`), conteneurs tonals surélevés (`#240d11`, `#351218`).
* **Déformations & Formes Expressives** :
  * **Asymétrie cinétique** : coins asymétriques (`racing-shape-asymmetric` : `28px 12px 28px 12px`).
  * **Racing Slant** : découpes et inclinaisons aérodynamiques (`skew-x-[-6deg]`).
  * **Grandes capsules & squircles** : boutons et pastilles en `rounded-2xl`, `rounded-3xl` ou `rounded-full` affirmés.
* **Typographie Puissante ("Bold Display")** :
  * Titres et numéros de course en **Unbounded** (police géométrique ultra-bold / black, italique expressif, tracking resserré).
  * Métriques de télémétrie et chronos en **JetBrains Mono** pour la précision technique.
  * Corps de texte et navigation en **Plus Jakarta Sans** pour une lisibilité parfaite.

---

## 2. Palette de Couleurs : "Racing Red & Variants"

Le rouge racing emblématique de la Scuderia et du sport automobile constitue le cœur battant du design system, décliné en variantes tonales vibrantes :

* **Couleurs Primaires Racing** :
  * *Racing Red Primary* (`#e10600`) : Boutons d'action majeurs, états actifs de navigation, accents de vitesse.
  * *High-Vis Scarlet* (`#ff1f24`, `#ff4d4d`) : Éléments critiques, alertes, flammes de meilleur tour.
  * *Deep Crimson / Wine* (`#8a0300`, `#48060a`, `#2b0100`) : Ombres plates (`shadow-flat-racing`), bordures de contraste, surfaces secondaires.
* **Surfaces Sombres Tonalisées (Paddock Night)** :
  * Fond principal : `#0b0405` (noir carbone profond avec nuance rouge subtile).
  * Cartes plates : `#16080a` avec bordures contrastées `rgba(255, 60, 60, 0.25)`.
  * Conteneurs surélevés : `#220c0f` / `#341116`.
* **Accents Piste & Podium** :
  * *Pole Position Gold* (`#ffd000` / `#ffea00`) : P1 au classement, qualifications, catégories phares.
  * *Track Green* (`#00e676`) : Statut API connectée, voiture franchissant la ligne d'arrivée.
  * *Racing White* (`#f7f0f0`) : Texte hautement contrasté.

---

## 3. Ergonomie & Menu Latéral (Sidebar Navigation)

Conformément aux impératifs d'efficacité du backoffice :
* **Suppression de la barre haute** : Remplacement de l'ancien header supérieur par un **Menu Latéral (Sidebar)** vertical persistant sur desktop (`w-72 sm:w-80`).
* **Organisation de la Sidebar** :
  1. **Header Marque** : Logo expressif "VROUUUM" en typographie display italique avec insigne flamme rouge racing et badge "RACING BACKOFFICE".
  2. **Navigation Principale** : Onglets larges sous forme de capsules tactiles vibrantes avec icône dédiée, label en gras et badge contextuel. Le tab actif est mis en valeur par un fond rouge racing solide animé (`layoutId="activeSidebarTab"`).
  3. **Pied de Sidebar** : Moniteur de santé serveur en direct ("API CONNECTÉE / REST OK") avec diode animée et version du système.
* **Adaptabilité Mobile** : En écran restreint, la navigation bascule sur un tiroir latéral accessible via un menu burger dynamique.

---

## 4. Composants UI & Micro-Interactions Tactiles

* **Flat Buttons (`GlassButton`)** :
  * Style `primary` : Rouge racing vibrant (`bg-racing-500`), ombre plate marquée (`shadow-flat-racing`), retour tactile par enfoncement physique (`active:translate-y-0.5`).
  * Style `secondary` : Conteneur tonal sombre avec bordure rouge racing.
* **Flat Cards (`GlassCard`)** :
  * Surfaces opaques texturées, bordure supérieure d'accent rouge vif, survol réactif avec border-glow énergique.
* **Badges Expressifs (`GlassBadge`)** :
  * Capsules déformées ou inclinées (`racing-slant`), typographie monospace en capitales percutantes.
* **Inputs & Formulaires (`GlassInput`, `GlassSelect`)** :
  * Champs plats sur fond `#150709`, focus ring rouge racing affirmé, étiquettes en petits labels monospace vifs.

---

## 5. Historique des Décisions Design

| Date | Décision | Justification |
| :--- | :--- | :--- |
| 2026-10-24 | Transition vers **Flat Design Vibrant & Material 3 Expressive** | Élimination du flou glassmorphic pour une esthétique percutante, colorée, ultra-lisible et moderne. |
| 2026-10-24 | Palette exclusive **Rouge Racing & Variantes** | Identité motorsport forte (Scuderia / F1), déclinée en nuances écarlates, crimson, bordeaux et fond carbone. |
| 2026-10-24 | Adoption du **Menu Latéral (Sidebar)** | Meilleure densité d'information, navigation plus naturelle pour un backoffice de gestion complexe. |
| 2026-10-24 | Typographie de vitesse : **Unbounded** + **JetBrains Mono** | En-têtes massifs, chiffres de course impactants et télémétrie authentique. |
| 2026-10-24 | Formes asymétriques & Slants (`skew-x-[-6deg]`) | Expression visuelle du mouvement, de la vélocité et de la dynamique de course. |

# Documentation Technique — SkillHub

> Projet : Plateforme de gestion de formations en ligne  
> Stack : Laravel 11 (API REST) + React 18 (Vite) + MySQL + MongoDB (logs optionnels)  
> Date de rédaction : 14 avril 2026

---

## Table des matières

1. [Vue d'ensemble du projet](#1-vue-densemble-du-projet)
2. [Architecture globale](#2-architecture-globale)
3. [Backend — Laravel](#3-backend--laravel)
   - 3.1 [Structure des dossiers](#31-structure-des-dossiers)
   - 3.2 [Base de données et modèles](#32-base-de-données-et-modèles)
   - 3.3 [Authentification JWT (faite maison)](#33-authentification-jwt-faite-maison)
   - 3.4 [Middleware de protection](#34-middleware-de-protection)
   - 3.5 [Référence complète de l'API REST](#35-référence-complète-de-lapi-rest)
   - 3.6 [Journalisation MongoDB](#36-journalisation-mongodb)
4. [Frontend — React](#4-frontend--react)
   - 4.1 [Structure des dossiers](#41-structure-des-dossiers)
   - 4.2 [Routage et protection des routes](#42-routage-et-protection-des-routes)
   - 4.3 [Couche service API (Axios)](#43-couche-service-api-axios)
   - 4.4 [Gestion de session côté client](#44-gestion-de-session-côté-client)
   - 4.5 [Pages et rôles](#45-pages-et-rôles)
5. [Flux de données de bout en bout](#5-flux-de-données-de-bout-en-bout)
6. [Règles métier et contraintes](#6-règles-métier-et-contraintes)
7. [Lancement du projet en local](#7-lancement-du-projet-en-local)

---

## 1. Vue d'ensemble du projet

SkillHub est une plateforme d'apprentissage en ligne (LMS) permettant à deux types d'utilisateurs d'interagir :

| Rôle          | Capacités                                                                  |
| ------------- | -------------------------------------------------------------------------- |
| **Formateur** | Créer, modifier et supprimer ses propres formations + modules              |
| **Apprenant** | Parcourir le catalogue, s'inscrire à des formations, suivre sa progression |

Les deux parties (backend et frontend) communiquent exclusivement via une **API REST JSON**. Il n'y a aucun rendu côté serveur. Le backend génère et valide les **tokens JWT** sans librairie externe dédiée.

---

## 2. Architecture globale

```
┌─────────────────────────────┐        HTTP/JSON         ┌──────────────────────────────┐
│       Frontend              │ ───────────────────────► │         Backend              │
│   React 18 + Vite           │                          │      Laravel 11              │
│   Port : 5173 (dev)         │ ◄─────────────────────── │      Port : 8000             │
│                             │    Réponses JSON          │                              │
│  /src/services/api.js       │                          │  routes/api.php              │
│  (client Axios centralisé)  │                          │  app/Http/Controllers/       │
└─────────────────────────────┘                          └───────────┬──────────────────┘
                                                                      │
                                              ┌───────────────────────┴──────────────────────┐
                                              │                                              │
                                    ┌─────────▼──────────┐                      ┌───────────▼──────────┐
                                    │   Base MySQL        │                      │  MongoDB (optionnel) │
                                    │   users             │                      │  Collection :        │
                                    │   formations        │                      │  activity_logs       │
                                    │   modules           │                      │  (événements métier) │
                                    │   enrollments       │                      └──────────────────────┘
                                    └────────────────────┘
```

La variable d'environnement `VITE_API_URL` dans le fichier `.env` du frontend pointe vers le backend. Par défaut : `http://127.0.0.1:8000/api`.

---

## 3. Backend — Laravel

### 3.1 Structure des dossiers

```
backend/
├── app/
│   ├── Http/
│   │   ├── Controllers/          ← Logique métier des endpoints
│   │   │   ├── AuthController.php
│   │   │   ├── FormationController.php
│   │   │   ├── ModuleController.php
│   │   │   └── EnrollmentController.php
│   │   └── Middleware/
│   │       └── VerifierJetonJwt.php   ← Filtre JWT sur les routes protégées
│   ├── Models/
│   │   ├── User.php
│   │   ├── Formation.php
│   │   ├── Module.php
│   │   └── Enrollment.php
│   └── Services/
│       ├── ServiceJwt.php             ← Génération/validation JWT HS256 maison
│       └── MongoActivityLogger.php    ← Journalisation MongoDB (graceful si absent)
├── database/
│   └── migrations/                   ← Historique incrémental du schéma SQL
└── routes/
    └── api.php                        ← Toutes les routes REST
```

---

### 3.2 Base de données et modèles

Le schéma SQL est construit via des migrations Laravel successives.

#### Table `users`

| Colonne                     | Type                           | Description                         |
| --------------------------- | ------------------------------ | ----------------------------------- |
| `id`                        | BIGINT PK                      | Identifiant auto-incrémenté         |
| `name`                      | VARCHAR(255)                   | Nom affiché                         |
| `email`                     | VARCHAR(255) UNIQUE            | Adresse email (login)               |
| `password`                  | VARCHAR(255)                   | Mot de passe haché (bcrypt)         |
| `role`                      | ENUM(`formateur`, `apprenant`) | Rôle déterminant les droits d'accès |
| `created_at` / `updated_at` | TIMESTAMP                      | Horodatage Laravel                  |

> Le champ `role` a été ajouté via la migration `2026_03_05_000100_add_role_to_users_table.php`.

#### Table `formations`

| Colonne       | Type                                          | Description                                                 |
| ------------- | --------------------------------------------- | ----------------------------------------------------------- |
| `id`          | BIGINT PK                                     | —                                                           |
| `user_id`     | BIGINT FK → users                             | Formateur propriétaire                                      |
| `titre`       | VARCHAR(255)                                  | Titre de la formation                                       |
| `description` | TEXT                                          | Description longue                                          |
| `category`    | VARCHAR(100)                                  | Catégorie (ex : Développement, Design…)                     |
| `date`        | DATE                                          | Date de début prévue                                        |
| `statut`      | VARCHAR(60)                                   | Ex : « À venir », « En cours », « Terminé »                 |
| `price`       | DECIMAL(10,2)                                 | Prix en euros                                               |
| `duration`    | INT                                           | Durée en heures                                             |
| `level`       | ENUM(`beginner`, `intermediaire`, `advanced`) | Niveau requis                                               |
| `vues`        | INT                                           | Compteur de vues incrémenté à chaque `GET /formations/{id}` |

#### Table `modules`

| Colonne        | Type                   | Description                     |
| -------------- | ---------------------- | ------------------------------- |
| `id`           | BIGINT PK              | —                               |
| `formation_id` | BIGINT FK → formations | Formation parente               |
| `titre`        | VARCHAR(255)           | Titre du module                 |
| `contenu`      | TEXT                   | Contenu pédagogique             |
| `ordre`        | INT                    | Position d'affichage croissante |

> Règle métier : une formation doit avoir **au minimum 3 modules**. Si aucun n'est fourni à la création, le backend injecte automatiquement trois modules par défaut (Introduction, Concepts fondamentaux, Projet pratique).

#### Table `enrollments`

| Colonne            | Type                   | Description                 |
| ------------------ | ---------------------- | --------------------------- |
| `id`               | BIGINT PK              | —                           |
| `utilisateur_id`   | BIGINT FK → users      | Apprenant inscrit           |
| `formation_id`     | BIGINT FK → formations | Formation concernée         |
| `progression`      | INT                    | Progression en % (0–100)    |
| `date_inscription` | DATETIME               | Horodatage de l'inscription |

#### Relations Eloquent

```
User ──────────────────────► Formation (hasMany via user_id)
User ──────────────────────► Enrollment (hasMany via utilisateur_id)
Formation ─────────────────► Module (hasMany via formation_id, trié par ordre)
Formation ─────────────────► Enrollment (hasMany via formation_id)
Enrollment ────────────────► Formation (belongsTo)
Enrollment ────────────────► User (belongsTo)
Module ─────────────────────► Formation (belongsTo)
```

---

### 3.3 Authentification JWT (faite maison)

Le projet n'utilise **aucune librairie JWT externe** (pas de `firebase/php-jwt`, pas de `tymon/jwt-auth`). L'implémentation complète se trouve dans `app/Services/ServiceJwt.php`.

#### Algorithme utilisé : HS256

```
JWT = Base64Url(header) + "." + Base64Url(payload) + "." + Base64Url(HMAC-SHA256(header.payload, APP_KEY))
```

La clé secrète est la valeur de `APP_KEY` du fichier `.env` Laravel.

#### Structure du payload JWT

```json
{
  "sub": 42,
  "email": "utilisateur@example.com",
  "role": "formateur",
  "iat": 1744632000,
  "exp": 1744660800
}
```

| Champ   | Signification                          |
| ------- | -------------------------------------- |
| `sub`   | ID de l'utilisateur en base            |
| `email` | Email (pour information)               |
| `role`  | Rôle (`formateur` ou `apprenant`)      |
| `iat`   | Date d'émission (Unix timestamp)       |
| `exp`   | Date d'expiration : **iat + 8 heures** |

#### Cycle de vie d'un token

1. **Génération** : lors de `POST /inscription` ou `POST /connexion`, le backend génère un token et le retourne.
2. **Transmission** : le frontend stocke le token dans `localStorage` et le joint à chaque requête via l'en-tête `Authorization: Bearer <token>`.
3. **Validation** : le middleware `VerifierJetonJwt` vérifie la signature HMAC, l'expiration, et que l'utilisateur existe toujours en base.
4. **Invalidation** (blacklist) : lors du `POST /deconnexion`, le hash SHA-256 du token est mis en cache Laravel avec un TTL égal au temps restant avant expiration. Tout token blacklisté est rejeté avec HTTP 403 même si sa signature est encore valide.

---

### 3.4 Middleware de protection

Le middleware `VerifierJetonJwt` est appliqué via l'alias `jwt` dans `bootstrap/app.php`.

**Logique d'exécution :**

```
Requête entrante
      │
      ▼
 Bearer token présent ?  ──Non──► 401 { "message": "Jeton manquant." }
      │ Oui
      ▼
 Token dans la blacklist ? ──Oui──► 403 { "message": "Jeton invalide ou expiré." }
      │ Non
      ▼
 Signature HMAC valide ?  ──Non──► 403
      │ Oui
      ▼
 Token expiré ?  ──Oui──► 403
      │ Non
      ▼
 Utilisateur trouvé en BDD ?  ──Non──► 401 { "message": "Utilisateur introuvable." }
      │ Oui
      ▼
 Injecte $request->user() = $utilisateur
      │
      ▼
 Passe au contrôleur suivant
```

---

### 3.5 Référence complète de l'API REST

> **Base URL :** `http://127.0.0.1:8000/api`  
> **Format :** JSON  
> **Authentification :** `Authorization: Bearer <token>` (routes protégées)

---

####  Routes publiques (sans token)

---

##### `POST /inscription` — Créer un compte

**Corps de la requête :**

```json
{
  "nom": "Alice Dupont",
  "email": "alice@example.com",
  "mot_de_passe": "Azerty@1",
  "role": "apprenant"
}
```

**Contraintes de validation :**

- `nom` : requis, string, max 255 caractères
- `email` : requis, format email valide, unique en base
- `mot_de_passe` : requis, min 8 caractères, **doit contenir au moins 1 majuscule, 1 chiffre et 1 caractère spécial** (regex : `^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$`)
- `role` : requis, valeur autorisée : `formateur` ou `apprenant`

**Réponse 201 (succès) :**

```json
{
  "token": "eyJ...",
  "token_type": "Bearer",
  "expires_at": 1744660800,
  "utilisateur": {
    "id": 1,
    "nom": "Alice Dupont",
    "email": "alice@example.com",
    "role": "apprenant"
  }
}
```

**Réponse 422 (validation échouée) :** Retourne les erreurs de validation Laravel.

---

##### `POST /connexion` (alias : `POST /login`) — Se connecter

**Corps de la requête :**

```json
{
  "email": "alice@example.com",
  "mot_de_passe": "Azerty@1"
}
```

**Réponse 200 (succès) :** Même structure que `/inscription` (avec token).

**Réponse 401 :**

```json
{ "message": "Identifiants invalides." }
```

---

##### `GET /formations` — Lister le catalogue

**Paramètres de requête (query string) optionnels :**

| Paramètre               | Description                               | Exemple                   |
| ----------------------- | ----------------------------------------- | ------------------------- |
| `recherche` ou `search` | Recherche dans le titre et la description | `?recherche=python`       |
| `category`              | Filtre par catégorie exacte               | `?category=Développement` |
| `level`                 | Filtre par niveau                         | `?level=beginner`         |

> Si la requête est faite avec un token de **formateur**, seules ses propres formations sont retournées. Sans token ou avec un token d'apprenant, toutes les formations sont retournées.

**Réponse 200 :**

```json
[
  {
    "id": 5,
    "titre": "Apprendre Python",
    "description": "Formation complète sur Python 3.",
    "category": "Développement",
    "date": "2026-05-01",
    "statut": "À venir",
    "price": 49.99,
    "duration": 20,
    "level": "beginner",
    "vues": 142,
    "apprenants": 37,
    "formateur": "Jean Martin"
  }
]
```

---

##### `GET /formations/{id}` — Détail d'une formation

> Incrémente le compteur `vues` à chaque appel. Charge les modules ordonnés.  
> Journalise l'événement `course_viewed` dans MongoDB.

**Réponse 200 :**

```json
{
  "id": 5,
  "titre": "Apprendre Python",
  "description": "...",
  "category": "Développement",
  "date": "2026-05-01",
  "statut": "À venir",
  "price": 49.99,
  "duration": 20,
  "level": "beginner",
  "vues": 143,
  "apprenants": 37,
  "formateur": "Jean Martin",
  "modules": [
    { "id": 1, "titre": "Introduction", "contenu": "...", "ordre": 1 },
    { "id": 2, "titre": "Variables", "contenu": "...", "ordre": 2 },
    { "id": 3, "titre": "Projet final", "contenu": "...", "ordre": 3 }
  ]
}
```

**Réponse 404 :** Formation introuvable (gérée par le model binding Laravel).

---

##### `GET /formations/{id}/modules` — Lister les modules d'une formation

**Réponse 200 :**

```json
[
  {
    "id": 1,
    "titre": "Introduction",
    "contenu": "...",
    "ordre": 1,
    "formation_id": 5
  },
  {
    "id": 2,
    "titre": "Variables",
    "contenu": "...",
    "ordre": 2,
    "formation_id": 5
  }
]
```

---

####  Routes protégées (token JWT requis)

---

##### `GET /profil` (alias : `GET /profile`) — Profil de l'utilisateur connecté

**Réponse 200 :**

```json
{
  "id": 1,
  "nom": "Alice Dupont",
  "email": "alice@example.com",
  "role": "apprenant"
}
```

---

##### `POST /deconnexion` (alias : `POST /logout`) — Se déconnecter

> Ajoute le token actuel dans la blacklist Redis/cache jusqu'à son expiration naturelle.

**Réponse 200 :**

```json
{ "message": "Déconnexion effectuée." }
```

---

##### `GET /my-formations` — Mes formations _(formateur uniquement)_

> Retourne uniquement les formations créées par le formateur connecté.

**Réponse 200 :** Tableau de formations (identique à `GET /formations` mais avec `user_id` inclus).

**Réponse 403 :** Si l'utilisateur n'est pas formateur.

---

##### `POST /formations` — Créer une formation _(formateur uniquement)_

**Corps de la requête :**

```json
{
  "titre": "Maîtriser React",
  "description": "Formation complète sur React 18.",
  "category": "Développement",
  "date": "2026-06-01",
  "statut": "À venir",
  "price": 79.0,
  "duration": 30,
  "level": "intermediaire",
  "modules": [
    { "titre": "Introduction à React", "contenu": "JSX, composants, props." },
    { "titre": "Hooks", "contenu": "useState, useEffect, useContext." },
    { "titre": "Projet final", "contenu": "Application complète." }
  ]
}
```

**Contraintes de validation :**

- `titre` : requis, max 255
- `description` : requis
- `category` : requis, max 100
- `date` : requis, format date valide
- `price` : requis, numérique ≥ 0
- `duration` : requis, entier ≥ 1
- `level` : requis, valeur parmi `beginner`, `intermediaire`, `advanced`
- `modules` : optionnel, tableau d'au moins 3 éléments si fourni
- `modules.*.titre` : requis si modules fournis
- `modules.*.contenu` : requis si modules fournis

> Si `modules` n'est pas fourni, trois modules par défaut sont créés automatiquement.  
> Journalise `course_created` dans MongoDB.

**Réponse 201 :** Objet formation créée (avec `user_id`).

---

##### `PUT /formations/{id}` — Modifier une formation _(formateur, propriétaire uniquement)_

> Même corps de requête que `POST /formations`. Si `modules` est fourni, les anciens sont **entièrement remplacés**.  
> Journalise `course_update` avec les anciennes et nouvelles valeurs dans MongoDB.

**Réponse 200 :** Formation mise à jour.

**Réponse 403 :**

```json
{ "message": "Cette formation ne vous appartient pas." }
```

---

##### `DELETE /formations/{id}` — Supprimer une formation _(formateur, propriétaire uniquement)_

> Journalise `course_deleted` dans MongoDB.

**Réponse 200 :**

```json
{ "message": "Formation supprimée avec succès." }
```

---

##### `POST /formations/{id}/modules` — Ajouter un module _(formateur, propriétaire uniquement)_

**Corps de la requête :**

```json
{
  "titre": "Nouveau module",
  "contenu": "Contenu du module.",
  "ordre": 4
}
```

> `ordre` est optionnel : si absent, il est calculé comme `max(ordre) + 1`.  
> Journalise `module_created`.

**Réponse 201 :** Module créé.

---

##### `PUT /modules/{id}` — Modifier un module _(formateur, propriétaire de la formation)_

**Corps :**

```json
{
  "titre": "Titre mis à jour",
  "contenu": "Nouveau contenu.",
  "ordre": 2
}
```

> Journalise `module_updated`.

**Réponse 200 :** Module mis à jour.

---

##### `DELETE /modules/{id}` — Supprimer un module _(formateur, propriétaire de la formation)_

> Journalise `module_deleted`.

**Réponse 200 :**

```json
{ "message": "Module supprimé." }
```

---

##### `POST /formations/{id}/inscription` — S'inscrire à une formation _(apprenant uniquement)_

> Utilise `firstOrCreate` : si l'apprenant est déjà inscrit, retourne l'inscription existante sans doublon.  
> Journalise `course_enrollment`.

**Réponse 201 :**

```json
{
  "id": 10,
  "utilisateur_id": 3,
  "formation_id": 5,
  "progression": 0,
  "date_inscription": "2026-04-14T09:00:00+00:00"
}
```

**Réponse 403 :** Si l'utilisateur n'est pas apprenant.

---

##### `DELETE /formations/{id}/inscription` — Se désinscrire _(apprenant uniquement)_

**Réponse 200 :**

```json
{ "message": "Désinscription effectuée." }
```

---

##### `GET /apprenant/formations` — Mes formations inscrites _(apprenant uniquement)_

> Retourne toutes les formations auxquelles l'apprenant est inscrit, avec la progression et les modules.

**Réponse 200 :**

```json
[
  {
    "id": 5,
    "titre": "Apprendre Python",
    "description": "...",
    "category": "Développement",
    "date": "2026-05-01",
    "statut": "À venir",
    "price": 49.99,
    "duration": 20,
    "level": "beginner",
    "vues": 143,
    "apprenants": 37,
    "formateur": "Jean Martin",
    "progression": 40,
    "modules": [
      { "id": 1, "titre": "Introduction", "contenu": "...", "ordre": 1 }
    ]
  }
]
```

---

#### Tableau récapitulatif des endpoints

| Méthode | Endpoint                       | Auth   | Rôle      | Description              |
| ------- | ------------------------------ | ------ | --------- | ------------------------ |
| POST    | `/inscription`                 | —      | Tous      | Créer un compte          |
| POST    | `/connexion`                   | —      | Tous      | Se connecter             |
| GET     | `/formations`                  | —      | Tous      | Catalogue des formations |
| GET     | `/formations/{id}`             | —      | Tous      | Détail + modules         |
| GET     | `/formations/{id}/modules`     | —      | Tous      | Modules d'une formation  |
| GET     | `/profil`                      |  JWT | Tous      | Profil connecté          |
| POST    | `/deconnexion`                 |  JWT | Tous      | Déconnexion + blacklist  |
| GET     | `/my-formations`               |  JWT | Formateur | Ses formations           |
| POST    | `/formations`                  |  JWT | Formateur | Créer une formation      |
| PUT     | `/formations/{id}`             |  JWT | Formateur | Modifier sa formation    |
| DELETE  | `/formations/{id}`             |  JWT | Formateur | Supprimer sa formation   |
| POST    | `/formations/{id}/modules`     |  JWT | Formateur | Ajouter un module        |
| PUT     | `/modules/{id}`                |  JWT | Formateur | Modifier un module       |
| DELETE  | `/modules/{id}`                |  JWT | Formateur | Supprimer un module      |
| POST    | `/formations/{id}/inscription` |  JWT | Apprenant | S'inscrire               |
| DELETE  | `/formations/{id}/inscription` |  JWT | Apprenant | Se désinscrire           |
| GET     | `/apprenant/formations`        |  JWT | Apprenant | Ses formations inscrites |

---

### 3.6 Journalisation MongoDB

Le service `MongoActivityLogger` enregistre des événements métier dans une collection MongoDB **de façon silencieuse** : si MongoDB n'est pas configuré (driver absent ou `MONGODB_URI` vide), les appels sont ignorés sans lever d'exception.

**Variables d'environnement requises :**

```
MONGODB_URI=mongodb://localhost:27017
MONGODB_DATABASE=skillhub
MONGODB_COLLECTION=activity_logs
```

**Événements journalisés :**

| Événement           | Déclenché par                       |
| ------------------- | ----------------------------------- |
| `course_viewed`     | `GET /formations/{id}`              |
| `course_created`    | `POST /formations`                  |
| `course_update`     | `PUT /formations/{id}`              |
| `course_deleted`    | `DELETE /formations/{id}`           |
| `course_enrollment` | `POST /formations/{id}/inscription` |
| `module_created`    | `POST /formations/{id}/modules`     |
| `module_updated`    | `PUT /modules/{id}`                 |
| `module_deleted`    | `DELETE /modules/{id}`              |

**Structure d'un document MongoDB :**

```json
{
  "event": "course_created",
  "course_id": 5,
  "created_by": 2,
  "timestamp": "2026-04-14T09:00:00+00:00"
}
```

---

## 4. Frontend — React

### 4.1 Structure des dossiers

```
frontend/src/
├── App.jsx                  ← Routeur principal (BrowserRouter)
├── pages/
│   ├── Accueil.jsx          ← Page d'accueil publique
│   ├── Formations.jsx       ← Catalogue public des formations + filtres
│   ├── DetailFormation.jsx  ← Fiche détail d'une formation
│   ├── Connexion.jsx        ← Formulaire de connexion
│   ├── Inscription.jsx      ← Formulaire d'inscription
│   ├── Formateur.jsx        ← Tableau de bord formateur
│   ├── Apprenant.jsx        ← Tableau de bord apprenant
│   ├── CreerAtelier.jsx     ← Formulaire de création de formation
│   ├── ModifierFormation.jsx← Formulaire de modification
│   ├── SuiviFormation.jsx   ← Suivi d'une formation (modules)
│   └── Ateliers.jsx         ← Liste générale des ateliers
├── components/
│   └── RouteProtegee.jsx    ← Composant de garde de route
└── services/
    ├── api.js               ← Instance Axios centralisée + intercepteurs
    ├── auth.js              ← Lecture/écriture du localStorage
    ├── authApi.js           ← Appels API d'authentification
    ├── formationsApi.js     ← Appels API formations, modules, inscriptions
    └── session.js           ← Vérification de session au démarrage
```

---

### 4.2 Routage et protection des routes

Le routage est géré par **React Router v6**.

#### Arborescence des routes

```
/                          → Accueil (public)
/formations                → Catalogue (public)
/formation/:id             → Détail formation (public)

/connexion                 → Connexion (invité uniquement)
/inscription               → Inscription (invité uniquement)

/dashboard/formateur       → Dashboard formateur (rôle : formateur)
/creer-atelier             → Créer une formation (rôle : formateur)
/modifier-formation/:id    → Modifier une formation (rôle : formateur)

/dashboard/apprenant       → Dashboard apprenant (rôle : apprenant)
/apprendre/:id             → Suivi d'une formation (rôle : apprenant)

/mes-ateliers              → Mes ateliers (tout utilisateur connecté)
/dashboard                 → Redirection automatique selon le rôle
*                          → Redirection vers /
```

#### Composant `RouteProtegee`

Ce composant vérifie la session via `verifierSession()` (appel à `GET /profil`) avant d'autoriser l'accès. Selon le résultat :

- Non authentifié → redirige vers `/connexion`
- Rôle non autorisé → redirige vers `/connexion`
- Authentifié avec le bon rôle → affiche le contenu (`<Outlet />`)

#### Composant `RouteInvite`

Pour les pages `/connexion` et `/inscription` : si l'utilisateur est **déjà connecté**, il est redirigé vers son tableau de bord ; il ne peut pas accéder aux pages de connexion/inscription.

---

### 4.3 Couche service API (Axios)

#### `services/api.js` — Instance Axios centrale

```javascript
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api",
  headers: { "Content-Type": "application/json" },
});
```

**Intercepteur de requête :** Lit le token JWT dans `localStorage` et l'ajoute automatiquement à chaque requête dans l'en-tête `Authorization: Bearer <token>`. Aucun composant n'a besoin de gérer le token manuellement.

**Intercepteur de réponse :** Si le backend répond `401`, la session est supprimée du `localStorage` automatiquement.

#### `services/formationsApi.js` — Formations, modules, inscriptions

| Fonction                         | Méthode | Endpoint                       |
| -------------------------------- | ------- | ------------------------------ |
| `listerFormations(filtres)`      | GET     | `/formations`                  |
| `detailFormation(id)`            | GET     | `/formations/{id}`             |
| `listerModules(id)`              | GET     | `/formations/{id}/modules`     |
| `creerModule(idFormation, data)` | POST    | `/formations/{id}/modules`     |
| `modifierModule(idModule, data)` | PUT     | `/modules/{id}`                |
| `supprimerModule(idModule)`      | DELETE  | `/modules/{id}`                |
| `listerMesFormations()`          | GET     | `/my-formations`               |
| `creerFormation(data)`           | POST    | `/formations`                  |
| `modifierFormation(id, data)`    | PUT     | `/formations/{id}`             |
| `supprimerFormation(id)`         | DELETE  | `/formations/{id}`             |
| `inscrireFormation(id)`          | POST    | `/formations/{id}/inscription` |
| `desinscrireFormation(id)`       | DELETE  | `/formations/{id}/inscription` |
| `listerFormationsApprenant()`    | GET     | `/apprenant/formations`        |

#### `services/authApi.js` — Authentification

| Fonction                                 | Méthode | Endpoint       |
| ---------------------------------------- | ------- | -------------- |
| `inscrire(nom, email, motDePasse, role)` | POST    | `/inscription` |
| `connecter(email, motDePasse)`           | POST    | `/connexion`   |
| `profilConnecte()`                       | GET     | `/profil`      |
| `deconnecter()`                          | POST    | `/deconnexion` |

---

### 4.4 Gestion de session côté client

La session est stockée dans `localStorage` avec deux clés :

- `jeton_auth` : le token JWT brut
- `utilisateur_auth` : objet JSON `{ id, nom, email, role }`

**`services/auth.js`** fournit les fonctions utilitaires :

- `sauvegarderSession(token, utilisateur)` — sauvegarde
- `recupererJeton()` — lit le token
- `recupererUtilisateur()` — lit et désérialise l'utilisateur
- `supprimerSession()` — efface tout (utilisé à la déconnexion)
- `estConnecte()` — retourne `true` si un token est présent

**`services/session.js`** — `verifierSession()` : valide la session en appelant `GET /profil` sur le backend. Si le token est expiré ou invalide, la session locale est supprimée.

---

### 4.5 Pages et rôles

| Page                    | Route                     | Rôle      | Données API consommées                                             |
| ----------------------- | ------------------------- | --------- | ------------------------------------------------------------------ |
| **Accueil**             | `/`                       | Public    | Aucune (page statique)                                             |
| **Catalogue**           | `/formations`             | Public    | `GET /formations` (+ filtres)                                      |
| **Détail formation**    | `/formation/:id`          | Public    | `GET /formations/{id}`                                             |
| **Connexion**           | `/connexion`              | Invité    | `POST /connexion`                                                  |
| **Inscription**         | `/inscription`            | Invité    | `POST /inscription`                                                |
| **Dashboard formateur** | `/dashboard/formateur`    | Formateur | `GET /my-formations`, `DELETE /formations/{id}`                    |
| **Créer atelier**       | `/creer-atelier`          | Formateur | `POST /formations`                                                 |
| **Modifier formation**  | `/modifier-formation/:id` | Formateur | `GET /formations/{id}`, `PUT /formations/{id}`                     |
| **Dashboard apprenant** | `/dashboard/apprenant`    | Apprenant | `GET /apprenant/formations`, `DELETE /formations/{id}/inscription` |
| **Suivi formation**     | `/apprendre/:id`          | Apprenant | `GET /formations/{id}`                                             |
| **Mes ateliers**        | `/mes-ateliers`           | Connecté  | `GET /formations`                                                  |

---

## 5. Flux de données de bout en bout

### Flux : Connexion d'un utilisateur

```
1. Utilisateur saisit email + mot_de_passe dans Connexion.jsx
2. Appel : POST /connexion { email, mot_de_passe }
3. Backend vérifie Hash::check(mot_de_passe, user.password)
4. Backend génère JWT (payload: sub, email, role, iat, exp)
5. Réponse : { token, utilisateur }
6. Frontend stocke token dans localStorage["jeton_auth"]
7. Frontend stocke utilisateur dans localStorage["utilisateur_auth"]
8. React Router redirige vers /dashboard/formateur ou /dashboard/apprenant
```

### Flux : Appel d'une route protégée

```
1. Composant appelle formationsApi.listerMesFormations()
2. Axios interceptor ajoute : Authorization: Bearer eyJ...
3. Middleware VerifierJetonJwt.handle() s'exécute :
   a. Extrait le bearer token
   b. Vérifie la blacklist cache
   c. Décode et valide la signature HMAC
   d. Vérifie l'expiration
   e. Charge l'utilisateur depuis la BDD
   f. Injecte $request->user()
4. FormationController::myFormations() s'exécute
5. Retourne JSON des formations du formateur
6. Axios résout la promesse avec la réponse
7. React met à jour le state et re-render
```

### Flux : Inscription à une formation

```
1. Apprenant clique "S'inscrire" sur DetailFormation.jsx
2. Appel : POST /formations/{id}/inscription
3. Middleware JWT valide le token
4. EnrollmentController::store() vérifie que role === "apprenant"
5. firstOrCreate crée ou récupère l'enrollment
6. MongoActivityLogger::log("course_enrollment", {...}) (silencieux si MongoDB absent)
7. Réponse 201 avec l'objet enrollment
8. Frontend met à jour l'état (bouton "S'inscrire" → "Se désinscrire")
```

---

## 6. Règles métier et contraintes

| Règle                                                         | Implémentation                                                   |
| ------------------------------------------------------------- | ---------------------------------------------------------------- |
| Seul un formateur peut créer/modifier/supprimer une formation | Contrôle `$utilisateur->role !== 'formateur'` dans le contrôleur |
| Un formateur ne peut modifier que ses propres formations      | Contrôle `$formation->user_id !== $utilisateur->id`              |
| Seul un apprenant peut s'inscrire/se désinscrire              | Contrôle `$utilisateur->role !== 'apprenant'`                    |
| Une formation doit avoir au moins 3 modules                   | Validation `min:3` + injection de modules par défaut si absent   |
| Le mot de passe doit contenir maj + chiffre + spécial         | Regex appliquée côté backend Laravel                             |
| `user_id` jamais envoyé par le frontend                       | Il est injecté depuis `$request->user()->id` côté backend        |
| Token JWT valide 8 heures                                     | `CarbonImmutable::now()->addHours(8)->timestamp`                 |
| Déconnexion = blacklist du token                              | Cache Laravel avec TTL = temps restant du token                  |
| Compteur de vues incrémenté à chaque consultation             | `$formation->increment('vues')` sur `GET /formations/{id}`       |

---

## 7. Lancement du projet en local

### Prérequis

- PHP 8.2+, Composer
- Node.js 20+, npm
- MySQL (XAMPP ou autre)
- MongoDB optionnel (pour les logs)

### Backend

```bash
cd backend
composer install
cp .env.example .env
# Editer .env : DB_DATABASE, DB_USERNAME, DB_PASSWORD, APP_KEY
php artisan key:generate
php artisan migrate
php artisan serve
# → http://127.0.0.1:8000
```

### Frontend

```bash
cd frontend
npm install
# Créer .env.local avec :
# VITE_API_URL=http://127.0.0.1:8000/api
npm run dev
# → http://localhost:5173
```

### Documentation Swagger (Swagger UI intégrée)

La documentation interactive de l'API est accessible à l'adresse :

```
http://127.0.0.1:8000/swagger.html
```

Elle est générée depuis le fichier `openapi.yaml` à la racine du projet.

---

_Document généré automatiquement à partir du code source — SkillHub v1.1.0_

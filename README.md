# SkillHub – Bloc 03 – Cloud, DevOps et Architecture

## Sommaire

1. Présentation générale
2. Architecture technique
3. Système SSO & gestion JWT
4. Fonctionnalités détaillées
5. Règles métier & endpoints
6. Structure du dépôt
7. Installation & démarrage
8. Configuration & variables d'environnement
9. Outils DevOps
10. Cycle de vie CI/CD
11. Sécurité & bonnes pratiques
12. Dépannage & FAQ
13. Contribution
14. Références & documentation
15. Pages et routes principales (Frontend)

---

## 1. Présentation générale

SkillHub est une plateforme web collaborative de mise en relation entre formateurs et apprenants, développée dans le cadre du Bachelor Concepteur Développeur Web Full Stack (Bloc 03 : Cloud, DevOps et Architecture, Promotion 2025/2026).

Ce dépôt regroupe :

- Un **frontend React** (Vite)
- Un **microservice d'authentification Spring Boot** (Java 17, sécurité HMAC, JWT)
- Deux **microservices Laravel** (catalog, inscription)
- Une **orchestration Docker Compose**
- Un **pipeline CI/CD complet** (GitHub Actions + SonarCloud)

Objectifs Bloc 03 : industrialisation, conteneurisation, automatisation, qualité logicielle.

---

## 2. Architecture technique

### Vue d'ensemble

```
┌──────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                      │
│                  React 19 + Vite – port 5173                 │
└───────────────────────────┬──────────────────────────────────┘
                            │ HTTP / JWT
          ┌─────────────────┼──────────────────┐
          ▼                 ▼                  ▼
┌─────────────────┐ ┌──────────────┐ ┌─────────────────┐
│  auth-spring-   │ │  catalog_api │ │ inscription_api  │
│  boot (Java 17) │ │  (Laravel)   │ │  (Laravel)       │
│  port 8001      │ │  port 8002   │ │  port 8003       │
└────────┬────────┘ └──────┬───────┘ └────────┬─────────┘
         │                 │                  │
         └─────────────────┼──────────────────┘
                           ▼
                    ┌─────────────┐
                    │    MySQL    │
                    │  (par BDD)  │
                    └─────────────┘
```

### Frontend

- **React 19** (Vite)
- Authentification JWT/HMAC, gestion de session, routing protégé, UI moderne

### Backend – Microservice Authentification (Spring Boot)

- **Java 17 / Spring Boot 3**
- Responsabilités : inscription, connexion, changement de mot de passe, émission et validation des JWT
- Sécurité : HMAC anti-rejeu (nonce + timestamp + signature), Master Key pour le chiffrement des mots de passe
- Base de données dédiée : `db_auth`
- Port : **8001**

### Backend – Microservice Catalogue (Laravel)

- **Laravel 11 / PHP 8.2**
- Responsabilités : CRUD formations, modules, recherche filtrée, catégories, niveaux, statuts
- Base de données dédiée : `db_catalog`
- Port : **8002**

### Backend – Microservice Inscriptions (Laravel)

- **Laravel 11 / PHP 8.2**
- Responsabilités : inscription à une formation, suivi des apprenants, validation, annulation
- Applique la règle métier du maximum de 5 cours actifs simultanés
- Base de données dédiée : `db_inscription`
- Port : **8003**

### Base de données

- **MySQL 8** – une base par microservice (isolation stricte)
- Migrations et seeders automatisés au démarrage

### Orchestration & DevOps

- **Docker Compose** : orchestration multi-conteneurs
- **GitHub Actions** : lint, tests, build, analyse SonarCloud, Quality Gate
- **SonarCloud** : analyse de code, couverture, duplications, bugs

---

## 3. Système SSO & gestion JWT

### Vue d'ensemble du SSO

SkillHub implémente un mécanisme de **Single Sign-On (SSO) centralisé** : le microservice Spring Boot est l'unique autorité d'authentification. Tous les autres microservices (catalog, inscription) **ne gèrent pas de session propre** — ils délèguent entièrement la validation des identités au service auth.

### Flux d'authentification

```
1. L'utilisateur soumet ses identifiants + HMAC via le Frontend
         │
         ▼
2. Spring Boot vérifie :
   - Existence de l'utilisateur en base
   - Validité de l'ancien mot de passe (déchiffré via Master Key)
   - Signature HMAC (nonce + timestamp non rejoué)
         │
         ▼
3. Spring Boot émet un JWT signé (HS256, clé secrète JWT_SECRET)
   contenant : sub (email), role, iat, exp
         │
         ▼
4. Le Frontend stocke le JWT (mémoire / sessionStorage)
   et l'envoie dans chaque requête : Authorization: Bearer <token>
         │
         ▼
5. catalog_api et inscription_api valident le JWT localement
   en vérifiant la signature avec JWT_SECRET (clé partagée)
   — aucun appel réseau vers auth pour valider
```

### Intégration du microservice Spring Boot

Le service auth expose les endpoints suivants :

| Méthode | Endpoint                          | Description                        |
| ------- | --------------------------------- | ---------------------------------- |
| `POST`  | `/api/auth/login`                 | Connexion, retourne un JWT         |
| `POST`  | `/api/auth/register`              | Inscription d'un nouvel utilisateur|
| `PUT`   | `/api/auth/change-password`       | Changement de mot de passe sécurisé|

Exemple de requête de connexion avec HMAC :

```json
{
  "email": "toto@example.com",
  "nonce": "a3f9c21b4d8e7f05",
  "timestamp": 1714900000,
  "hmac": "8f3a1d2c9b74e6f0..."
}
```

Exemple de réponse succès (`200 OK`) :

```json
{
  "success": true,
  "message": "Authentification réussie",
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "email": "toto@example.com",
  "expiresIn": 3600
}
```

### Structure du JWT

```
Header  : { "alg": "HS256", "typ": "JWT" }
Payload : { "sub": "toto@example.com", "role": "apprenant", "iat": 1714900000, "exp": 1714903600 }
Signature : HMACSHA256(base64(header) + "." + base64(payload), JWT_SECRET)
```

### Sécurité anti-rejeu (nonce + timestamp)

Chaque requête sensible doit inclure :
- **`nonce`** : identifiant unique de requête (UUID ou chaîne aléatoire 16 caractères), rejeté si déjà utilisé
- **`timestamp`** : epoch Unix, rejeté si écart > 5 minutes par rapport à l'heure serveur
- **`hmac`** : `HMAC-SHA256(email + nonce + timestamp, APP_MASTER_KEY)`

---

## 4. Fonctionnalités détaillées

### Authentification & sécurité

- Inscription, connexion, déconnexion, changement de mot de passe
- JWT pour l'authentification, HMAC pour la sécurité des requêtes sensibles
- Middleware anti-rejeu (nonce, timestamp, signature)
- Gestion des rôles (formateur, apprenant)

### Catalogue de formations

- CRUD formations, modules, recherche filtrée
- Attribution des formations aux formateurs
- Gestion des statuts, catégories, niveaux, durée, prix

### Inscriptions

- Inscription à une formation, suivi des apprenants
- Gestion des listes d'inscrits, validation, annulation
- **Limite de 5 cours actifs simultanés par apprenant** (voir règle métier section 5)

### Frontend

- Dashboard dynamique selon le rôle
- Routing public/privé, redirections intelligentes
- UI réactive, filtres, recherche, tableaux, sidebar, topbar, dark mode

### Communication inter-services

- Appels HTTP entre microservices via noms Docker (ex : `http://auth_api:8001`)
- Aucun code partagé, chaque service est indépendant

### Qualité & tests

- Tests unitaires pour chaque microservice (PHPUnit / JUnit)
- Linting JS/PHP, ESLint côté frontend
- Analyse SonarCloud sur chaque PR

---

## 5. Règles métier & endpoints

### Règle métier – Limite de 5 cours actifs

**Un apprenant ne peut pas s'inscrire à une nouvelle formation s'il a déjà 5 cours actifs en cours.**

Si cette condition est violée, le microservice `inscription_api` retourne une erreur HTTP **400 Bad Request**.

#### Endpoint concerné

```
PUT /api/inscriptions/{id}/inscrire
```

| Paramètre | Type     | Description                          |
| --------- | -------- | ------------------------------------ |
| `id`      | `integer`| Identifiant de la formation          |

**Headers requis :**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Cas nominal – Inscription réussie (`201 Created`) :**

```json
{
  "success": true,
  "message": "Inscription enregistrée avec succès",
  "inscription_id": 42,
  "formation_id": 7,
  "apprenant_email": "toto@example.com"
}
```

**Cas d'erreur – 5 cours actifs atteints (`400 Bad Request`) :**

```json
{
  "success": false,
  "error": "LIMIT_ACTIVE_COURSES_REACHED",
  "message": "Vous avez atteint la limite de 5 cours actifs simultanés. Veuillez terminer ou annuler un cours avant de vous inscrire à une nouvelle formation.",
  "active_courses_count": 5
}
```

**Autres cas d'erreur :**

| Code HTTP | Cas                                          |
| --------- | -------------------------------------------- |
| `400`     | Déjà inscrit à cette formation               |
| `400`     | 5 cours actifs atteints                      |
| `401`     | Token JWT absent ou invalide                 |
| `403`     | Rôle insuffisant (formateur ne peut s'inscrire)|
| `404`     | Formation introuvable                        |

**Logique de vérification côté service (pseudo-code) :**

```
1. Vérifier que le JWT est valide → 401 si non
2. Vérifier que le rôle est "apprenant" → 403 si non
3. Vérifier que la formation existe → 404 si non
4. Compter les inscriptions actives de l'apprenant
   → Si count >= 5 → lever une exception → 400
5. Vérifier que l'apprenant n'est pas déjà inscrit → 400 si oui
6. Créer l'inscription → 201
```

---

## 6. Structure du dépôt

```
/frontend                   # Application React.js (Vite)
/services/auth-spring-boot  # Microservice Authentification (Spring Boot – Java 17)
/services/auth              # Microservice Authentification (Laravel – legacy)
/services/catalog           # Microservice Catalogue (Laravel)
/services/inscription       # Microservice Inscriptions (Laravel)
/docker-compose.yml         # Orchestration multi-conteneurs
/DOCUMENTATION_TECHNIQUE.md # Doc technique détaillée
/contributing.md            # Guide de contribution
/sonar-project.properties   # Configuration SonarCloud
```

Chaque microservice contient :

- `app/`, `routes/`, `database/`, `config/`, `tests/`, `.env`, `composer.json` (ou `pom.xml`), `Dockerfile`

---

## 7. Installation & démarrage

### Prérequis

- **Docker** & **Docker Compose** (v2.x minimum)
- **Node.js 18+** (pour le frontend en mode développement)
- **Git**


### Démarrage complet (Docker)

La commande suivante construit toutes les images et démarre l'ensemble des conteneurs (bases de données, microservices, frontend) :

```sh
docker compose up --build
```

> **Premier lancement :** Les migrations sont exécutées automatiquement. Patientez que tous les services soient marqués `healthy` avant d'utiliser l'application.

### URLs d'accès

| Service              | URL                         |
| -------------------- | --------------------------- |
| Frontend (React)     | http://localhost:5173       |
| Auth (Spring Boot)   | http://localhost:8001       |
| Catalog (Laravel)    | http://localhost:8002       |
| Inscription (Laravel)| http://localhost:8003       |

### Initialisation des bases de données (optionnel)

Pour réinitialiser et reseeder les bases :

```sh
docker compose exec auth_api php artisan migrate:fresh --seed       # si auth Laravel
docker compose exec catalog_api php artisan migrate:fresh --seed
docker compose exec inscription_api php artisan migrate:fresh --seed
```

### Lancer le frontend en mode développement (hors Docker)

```sh
cd frontend
npm install
npm run dev
```

### Arrêter les conteneurs

```sh
docker compose down          # arrêt sans supprimer les volumes
docker compose down -v       # arrêt + suppression des volumes (reset BDD)
```

---

## 8. Configuration & variables d'environnement

Chaque microservice possède son propre fichier `.env` (copier `.env.example` dans chaque dossier).

### Microservice Auth – Spring Boot (`services/auth-spring-boot/.env`)

| Variable          | Description                                         | Exemple                          |
| ----------------- | --------------------------------------------------- | -------------------------------- |
| `APP_MASTER_KEY`  | Clé de chiffrement AES des mots de passe            | `my_super_secret_master_key_32!` |
| `JWT_SECRET`      | Clé secrète pour signer et valider les JWT (HS256)  | `jwt_secret_key_very_long_256bit`|
| `JWT_EXPIRATION`  | Durée de validité du JWT en millisecondes           | `3600000` (1 heure)              |
| `DB_HOST`         | Hôte MySQL                                          | `db_auth`                        |
| `DB_PORT`         | Port MySQL                                          | `3306`                           |
| `DB_NAME`         | Nom de la base de données                           | `db_auth`                        |
| `DB_USERNAME`     | Utilisateur MySQL                                   | `root`                           |
| `DB_PASSWORD`     | Mot de passe MySQL                                  | `secret`                         |
| `NONCE_VALIDITY_SECONDS` | Durée de validité d'un nonce anti-rejeu     | `300` (5 minutes)                |

### Microservice Catalog – Laravel (`services/catalog/.env`)

| Variable       | Description                                      | Exemple                          |
| -------------- | ------------------------------------------------ | -------------------------------- |
| `APP_KEY`      | Clé d'application Laravel                        | `base64:...`                     |
| `JWT_SECRET`   | Même clé que Spring Boot pour valider les JWT    | `jwt_secret_key_very_long_256bit`|
| `DB_HOST`      | Hôte MySQL                                       | `db_catalog`                     |
| `DB_DATABASE`  | Nom de la base de données                        | `db_catalog`                     |
| `DB_USERNAME`  | Utilisateur MySQL                                | `root`                           |
| `DB_PASSWORD`  | Mot de passe MySQL                               | `secret`                         |

### Microservice Inscription – Laravel (`services/inscription/.env`)

| Variable                | Description                                   | Exemple                          |
| ----------------------- | --------------------------------------------- | -------------------------------- |
| `APP_KEY`               | Clé d'application Laravel                     | `base64:...`                     |
| `JWT_SECRET`            | Même clé que Spring Boot pour valider les JWT | `jwt_secret_key_very_long_256bit`|
| `DB_HOST`               | Hôte MySQL                                    | `db_inscription`                 |
| `DB_DATABASE`           | Nom de la base de données                     | `db_inscription`                 |
| `DB_USERNAME`           | Utilisateur MySQL                             | `root`                           |
| `DB_PASSWORD`           | Mot de passe MySQL                            | `secret`                         |
| `MAX_ACTIVE_COURSES`    | Limite de cours actifs par apprenant          | `5`                              |

### Frontend (`frontend/.env`)

| Variable        | Description                              | Exemple                     |
| --------------- | ---------------------------------------- | --------------------------- |
| `VITE_API_AUTH` | URL du microservice Auth                 | `http://localhost:8001`     |
| `VITE_API_CATALOG` | URL du microservice Catalog           | `http://localhost:8002`     |
| `VITE_API_INSCRIPTION` | URL du microservice Inscription   | `http://localhost:8003`     |

> ⚠️ **Ne jamais versionner les secrets en clair.** Ajouter tous les fichiers `.env` au `.gitignore`. Utiliser GitHub Secrets pour la CI/CD.

---

## 9. Outils DevOps

### Docker – Conteneurisation

**Docker** permet d'empaqueter chaque microservice et ses dépendances dans un **conteneur isolé**, garantissant que l'application fonctionne de manière identique en développement, test et production.

**Architecture Docker SkillHub :**

```
docker-compose.yml
├── frontend          → Image Node/Vite, port 5173
├── auth_springboot   → Image OpenJDK 17, port 8001
├── catalog_api       → Image PHP 8.2-fpm + Nginx, port 8002
├── inscription_api   → Image PHP 8.2-fpm + Nginx, port 8003
├── db_auth           → Image MySQL 8, volume persistant
├── db_catalog        → Image MySQL 8, volume persistant
└── db_inscription    → Image MySQL 8, volume persistant
```

**Commandes essentielles :**

```sh
docker compose up --build        # Build et démarrage complet
docker compose down -v           # Arrêt et nettoyage des volumes
docker compose logs auth_api     # Logs d'un service spécifique
docker compose ps                # État de tous les conteneurs
docker compose exec catalog_api bash  # Shell dans un conteneur
```

**Structure d'un Dockerfile (exemple Spring Boot) :**

```dockerfile
FROM openjdk:17-jdk-slim
WORKDIR /app
COPY target/app.jar app.jar
EXPOSE 8001
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
```

---

### GitHub Actions – CI/CD

**GitHub Actions** automatise l'intégralité du cycle de vie du code : à chaque `push` ou `pull request`, un pipeline est déclenché pour garantir la qualité avant tout merge.

**Pipeline SkillHub (`.github/workflows/ci.yml`) :**

```
Push / PR
    │
    ▼
┌─────────────────────────────────────────┐
│  1. Checkout du code                    │
│  2. Installation JDK 17 + PHP 8.2       │
│  3. Build du projet (mvn clean package) │
│  4. Exécution des tests (JUnit/PHPUnit) │──── ÉCHEC → Pipeline bloquée
│  5. Analyse SonarCloud                  │──── Quality Gate KO → Pipeline bloquée
│  6. Build des images Docker             │──── ÉCHEC → Pipeline bloquée
└─────────────────────────────────────────┘
```

**Extrait du fichier `ci.yml` :**

```yaml
name: CI Build Test Sonar Docker

on:
  push:
    branches: ["main"]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Install JDK 17
        uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: 17

      - name: Build project
        run: mvn clean package

      - name: Run tests
        run: mvn test

      - name: SonarCloud analysis
        env:
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
        run: mvn sonar:sonar

      - name: Build Docker image
        run: docker build -t cdwfs-auth-app .
```

**Secrets GitHub à configurer (Settings → Secrets) :**

| Secret          | Description                          |
| --------------- | ------------------------------------ |
| `SONAR_TOKEN`   | Token d'authentification SonarCloud  |
| `APP_MASTER_KEY`| Master Key de chiffrement            |
| `JWT_SECRET`    | Clé secrète JWT                      |

---

### SonarCloud – Analyse de qualité

**SonarCloud** analyse automatiquement la qualité du code source à chaque CI. Il détecte les bugs, vulnérabilités, code smells, duplications et mesure la couverture de tests.

**Métriques surveillées :**

| Métrique            | Description                                        | Seuil Quality Gate |
| ------------------- | -------------------------------------------------- | ------------------ |
| Coverage            | % de code couvert par les tests                    | ≥ 80 %             |
| Duplications        | % de code dupliqué                                 | ≤ 3 %              |
| Bugs                | Erreurs détectées dans le code                     | 0                  |
| Vulnerabilities     | Failles de sécurité                                | 0                  |
| Code Smells         | Mauvaises pratiques / dette technique              | Note A             |

**Configuration (`sonar-project.properties`) :**

```properties
sonar.projectKey=skillhub
sonar.organization=votre-organisation
sonar.sources=src
sonar.tests=tests
sonar.java.coveragePlugin=jacoco
sonar.coverage.jacoco.xmlReportPaths=target/site/jacoco/jacoco.xml
```

> Le **Quality Gate** est bloquant : si les seuils ne sont pas atteints, la pipeline GitHub Actions échoue et le merge est impossible.

---

## 10. Cycle de vie CI/CD

### Pipeline GitHub Actions

- Lint, tests unitaires, build, analyse SonarCloud à chaque push/PR
- Quality Gate bloquante — aucun merge possible si KO

### SonarCloud

- Analyse de code, duplications, bugs, couverture
- Organisation : à renseigner dans `sonar-project.properties`

---

## 11. Sécurité & bonnes pratiques

- Authentification JWT centralisée (SSO via Spring Boot)
- Signature HMAC, anti-rejeu (nonce + timestamp)
- Chiffrement des mots de passe avec Master Key (AES)
- Séparation stricte des responsabilités (aucun code monolithe)
- Variables d'environnement pour tous les secrets (jamais en clair dans le code)
- Tests unitaires obligatoires (JUnit + PHPUnit)
- Convention de nommage Git (Conventional Commits)
- Règles métier encapsulées dans les services, pas dans les contrôleurs

---

## 12. Dépannage & FAQ

### Problèmes courants

- **Erreur 401** : vérifier le token JWT, sa date d'expiration, la cohérence de `JWT_SECRET` entre services
- **Erreur 400 – LIMIT_ACTIVE_COURSES_REACHED** : l'apprenant a déjà 5 cours actifs, il doit en terminer ou annuler un
- **Connexion refusée entre services** : vérifier les noms Docker (`auth_springboot:8001`, `catalog_api:8002`)
- **Pipeline CI/CD échouée** : vérifier la config SonarCloud, les secrets GitHub, la présence des tests
- **Données non affichées** : vérifier le rôle dans le JWT, la session, les réponses API (F12 → Network)
- **Erreur `crypto is not defined` dans Postman** : utiliser `CryptoJS` (bibliothèque intégrée Postman) au lieu de l'API Web Crypto native

### Commandes utiles

```sh
# Rebuild complet
docker compose down -v
docker compose up --build

# Logs d'un service
docker compose logs auth_springboot
docker compose logs catalog_api
docker compose logs inscription_api

# Shell dans un conteneur
docker compose exec catalog_api bash
docker compose exec inscription_api php artisan tinker
```

---

## 13. Contribution

- Fork, branche thématique, PR, review
- Respecter le guide `contributing.md`
- Convention de commit : `type: sujet court`
  - Exemples : `feat: add change-password endpoint`, `fix: limit active courses`, `docs: update README`
- Tests et lint obligatoires avant merge

---

## 14. Références & documentation

- Documentation technique : `DOCUMENTATION_TECHNIQUE.md`
- Guide de contribution : `contributing.md`
- OpenAPI : `openapi.yaml`
- SonarCloud : https://sonarcloud.io
- GitHub Actions : https://docs.github.com/actions
- Docker Compose : https://docs.docker.com/compose

---

## 15. Pages et routes principales (Frontend)

### Pages React

- **/ (Accueil)** : Page d'accueil publique, présentation de la plateforme, témoignages, accès rapide aux formations.
- **/formations** : Liste filtrable de toutes les formations disponibles.
- **/formation/:id** : Détail d'une formation (description, modules, inscription).
- **/connexion** : Page de connexion utilisateur (formateur ou apprenant).
- **/inscription** : Page d'inscription avec validation locale et serveur.
- **/dashboard/formateur** : Tableau de bord du formateur (création, gestion, suppression de formations).
- **/dashboard/apprenant** : Tableau de bord de l'apprenant (formations suivies, inscription, progression).
- **/creer-atelier** : Création d'une nouvelle formation (formateur).
- **/modifier-formation/:idFormation** : Modification d'une formation existante (formateur).
- **/apprendre/:id** : Suivi détaillé d'une formation par l'apprenant (progression, modules).
- **/mes-ateliers** : Liste des ateliers/formations de l'utilisateur connecté (formateur ou apprenant).

### Routing (React Router)

| Route                     | Accès       | Composant/Page     | Description principale                               |
| ------------------------- | ----------- | ------------------ | ---------------------------------------------------- |
| `/`                       | Public      | Accueil            | Page d'accueil, présentation, accès rapide           |
| `/formations`             | Public      | Formations         | Catalogue filtrable de toutes les formations         |
| `/formation/:id`          | Public      | DetailFormation    | Détail d'une formation, bouton inscription           |
| `/connexion`              | Invité      | Connexion          | Authentification, redirection selon rôle             |
| `/inscription`            | Invité      | Inscription        | Création de compte, validation locale/serveur        |
| `/dashboard/formateur`    | Formateur   | Formateur          | Dashboard formateur, gestion formations/modules      |
| `/dashboard/apprenant`    | Apprenant   | Apprenant          | Dashboard apprenant, formations suivies              |
| `/creer-atelier`          | Formateur   | CreerAtelier       | Création d'une formation (formateur)                 |
| `/modifier-formation/:id` | Formateur   | ModifierFormation  | Modification d'une formation (formateur)             |
| `/apprendre/:id`          | Apprenant   | SuiviFormation     | Suivi détaillé d'une formation (apprenant)           |
| `/mes-ateliers`           | Authentifié | Ateliers           | Liste des ateliers/formations de l'utilisateur       |
| `/dashboard`              | Authentifié | RedirectionAccueil | Redirige selon le rôle connecté                      |
| `*`                       | Public      | Redirect           | Redirection vers l'accueil pour toute route inconnue |

**Remarque** : Les accès sont contrôlés par des guards (`RouteProtegee`, `RouteInvite`) selon le rôle et la session JWT.

---

## Auteurs & Encadrement

Projet réalisé par l'étudiant MU202618 dans le cadre du Bachelor CDWFS.

---

## Licence

Usage pédagogique interne uniquement.

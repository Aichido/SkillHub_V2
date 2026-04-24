# Dashboards (frontend)

Frontend React/Vite de SkillHub.
Cette application gère l’authentification JWT, l’autorisation par rôle (`formateur` / `apprenant`),
et la consommation des endpoints Laravel pour le cycle de vie des formations.

## 1) Stack et versions

### Runtime / build

- React `19.2.0`
- React DOM `19.2.0`
- React Router DOM `7.13.0`
- Axios `1.11.0`
- Vite via `rolldown-vite 7.2.5`

### Qualité de code

- ESLint `9.39.1`
- `eslint-plugin-react-hooks`
- `eslint-plugin-react-refresh`

## 2) Démarrage

Prérequis:

- Node.js 18+
- npm 9+
- API Laravel active (projet `dash-laravel`)

Installation:

```bash
npm install
```

Scripts:

```bash
npm run dev
npm run build
npm run preview
npm run lint
```

## 3) Configuration API

La base URL est définie par:

- `VITE_API_URL` (si présent)
- sinon fallback sur `http://127.0.0.1:8000/api`

Exemple de fichier `.env` (frontend):

```env
VITE_API_URL=http://127.0.0.1:8000/api
```

## 4) Architecture applicative

### Entrée et routing

- `src/main.jsx` initialise l’app sous `StrictMode`.
- `src/App.jsx` déclare les routes publiques et privées.
- Le composant `RedirectionAccueil` redirige vers:
  - `/connexion` si session absente
  - `/formateur` ou `/apprenant` selon le rôle en session

### Garde d’accès

- `RouteProtegee` verrouille les pages privées.
- Accès par rôle:
  - `formateur`: `/formateur`, `/creer-atelier`, `/modifier-formation/:idFormation`
  - `apprenant`: `/apprenant`
  - commun authentifié: `/mes-ateliers`

### Couches techniques

- `src/pages/`: logique d’écran (chargement, validation, orchestration).
- `src/components/`: briques UI (navigation, tableau, cartes, filtres, résumé).
- `src/services/`: accès réseau et gestion de session.
- `src/styles/`: styles globaux et styles orientés composants/pages.

## 5) Flux d’authentification (JWT)

### Stockage session

- Token: clé `jeton_auth`
- Utilisateur sérialisé: clé `utilisateur_auth`

### Cycle standard

1. L’utilisateur se connecte ou s’inscrit.
2. Le token + profil sont stockés en local.
3. L’interceptor Axios ajoute `Authorization: Bearer <token>` sur les requêtes.
4. Si le backend renvoie `401`, la session locale est supprimée automatiquement.

## 6) Contrats API utilisés

### Auth

- `POST /inscription`
  - payload: `{ nom, email, mot_de_passe, role }`
- `POST /connexion`
  - payload: `{ email, mot_de_passe }`
- `GET /profil`
- `POST /deconnexion`

### Formations

- `GET /formations` (catalogue)
- `GET /my-formations` (formations du formateur connecté)
- `POST /formations`
- `PUT /formations/:id`
- `DELETE /formations/:id`

### Champs formation manipulés côté frontend

- `id`
- `titre`
- `description`
- `date`
- `statut` (`À venir` / `Terminé`)
- `price`
- `duration`
- `level` (`beginner` / `intermediaire` / `advanced`)
- `vues` (utilisé comme compteur affiché)

## 7) Logique métier frontend importante

- Filtrage dashboard: recherche texte + tranche de prix (`≤ 5000 Rs` / `> 5000 Rs`).
- Redirection post-auth: pilotée par le rôle reçu du backend.
- Validation client sur inscription et formulaires formation avant appel API.
- `Mes ateliers` charge des données différentes selon le rôle connecté.

## 8) Navigation UI

### Sidebar

- Dashboard
- Documentation API
- Mes ateliers
- Paramètres
- Déconnexion

### Topbar

- Message de bienvenue
- Switch thème clair/sombre (clair par défaut)
- Bouton retour contextuel

## 9) Arborescence utile

```text
src/
	components/      # Sidebar, Topbar, Table, Summary, Filtre, AtelierCard...
	pages/           # Connexion, Inscription, Formateur, Apprenant, Ateliers...
	services/        # api.js, auth.js, authApi.js, formationsApi.js
	styles/          # feuilles CSS par zone
	App.jsx          # routing principal
	main.jsx         # bootstrap React
```

## 10) Dépannage technique

### `npm run dev` échoue

Checklist:

1. Réinstaller les dépendances:

```bash
rm -rf node_modules package-lock.json
npm install
```

2. Vérifier la version Node (`node -v`, recommander 18+).
3. Vérifier le port Vite (5173 par défaut) et conflits éventuels.
4. Vérifier la connectivité backend (`http://127.0.0.1:8000/api`).

### Erreurs 401 en boucle

- Le backend a probablement invalidé le token.
- Supprimer la session locale (déconnexion / clear storage) puis se reconnecter.

### Données non affichées

- Vérifier que l’utilisateur est sur le bon rôle.
- Vérifier les réponses réseau dans l’onglet Network.
- Vérifier la cohérence de `VITE_API_URL`.

## 11) Intégration avec le backend Laravel

Le frontend est conçu pour l’API du dossier `dash-laravel`.
La documentation OpenAPI/Swagger backend est accessible depuis le menu latéral via “Documentation API”.

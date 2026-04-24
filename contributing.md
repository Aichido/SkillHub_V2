# Guide de Contribution (CONTRIBUTING.md) - Projet Skill Hub

Ce document définit les règles d'organisation et de collaboration de l'équipe pour le Bloc 03 portant sur l'industrialisation de la plateforme Skill Hub. 
Il doit être mis en place dès le premier jour de l'initialisation du dépôt.

## 1. Répartition des Rôles

Conformément aux exigences du projet, chaque membre est responsable d'un rôle principal. L'équipe est structurée de la manière suivante :

* **Cloud Architect** (Parfait) : Pilote le rapport d'audit cloud, le tableau comparatif des offres, le schéma d'architecture et le plan budgétaire.
* **DevOps Engineer** (Liwell) : En charge des fichiers Dockerfiles, de la configuration du fichier `docker-compose.yml` et de la mise en place du pipeline CI/CD.
* **Tech Lead** (Mirana) : Responsable du versionning Git, de la rédaction de ce fichier `CONTRIBUTING.md`, du `README.md`, de l'orchestration globale, des scans de vulnérabilités et de la coordination de l'équipe.

## 2. Stratégie de Branches

Afin de garantir un code lisible et d'assurer une bonne traçabilité de nos contributions, nous appliquons une stratégie de branches stricte:

* `main` : Branche de production qui accueille uniquement le code stable. 
**Aucun commit direct n'y est autorisé**.
* `dev` : Branche d'intégration de travail par défaut qui accumule toutes les fonctionnalités validées.
* `feature/<nom>` : Branche utilisée pour développer une nouvelle fonctionnalité ou réaliser une tâche spécifique. Tout développement doit passer par ce type de branche.
* `hotfix/<nom>` : Branche dédiée aux correctifs urgents. Il est recommandé de fusionner ces correctifs vers `main` et `dev`.

## 3. Format des Commits (Conventional Commits)

Le dépôt Git servant de preuve de notre contribution individuelle, nous exigeons des commits réguliers pour chaque auteur. Les messages de commit doivent obligatoirement respecter la convention *Conventional Commits*:

* `feat` : Pour l'ajout d'une nouvelle fonctionnalité.
* `fix` : Pour la correction d'un bug.
* `docker` : Pour l'ajout ou la modification des fichiers de conteneurisation.
* `ci` : Pour toute modification apportée au pipeline d'intégration et de déploiement continu (CI/CD).
* `docs` : Pour la mise à jour ou l'ajout de documentation.
* `chore` : Pour les tâches de maintenance.

## 4. Procédure de Pull Request (PR)

Pour valider l'intégration du code sur les branches principales (`dev` et `main`), le processus suivant doit être respecté :

* Les développements se font obligatoirement via une branche `feature` et ne sont jamais poussés directement sur `main`.
* Lors de l'ouverture d'une Pull Request, celle-ci doit explicitement mentionner l'auteur à l'origine de la demande.
* La Pull Request doit impérativement contenir une description précise du travail effectué.

## 5. Procédure de Résolution de Conflits

*(Conformément au barème du livrable, voici la procédure de résolution de l'équipe)*

* **Conflits Git** : En cas de conflit lors d'une fusion, le développeur concerné synchronise sa branche locale avec la branche cible, résout les conflits localement en discutant avec l'auteur des modifications conflictuelles, puis valide la résolution.
* **Désaccords techniques** : En cas de désaccord sur la base de code initiale (le dépôt de référence), la situation doit être signalée dès le premier jour et le formateur tranchera.
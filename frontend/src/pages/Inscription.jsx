/*
| Projet: SkillHub
| Rôle du fichier: Page inscription utilisateur
| Dernière modification: 2026-03-06
*/

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { inscrire } from "../services/authApi";
import { sauvegarderSession } from "../services/auth";
import "../styles/connexion.css";

function Inscription() {
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [motDePasseConfirmation, setMotDePasseConfirmation] = useState("");
  const [role, setRole] = useState("");
  const [erreursChamps, setErreursChamps] = useState({});
  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(false);
  const navigate = useNavigate();

  const expressionEmail = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/;
  const expressionMotDePasseRobuste = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

  // Validation locale pour éviter un aller-retour serveur quand les données sont clairement invalides.
  const validerFormulaire = (valeurs) => {
    const erreurs = {};

    if (valeurs.nom.length < 3) {
      erreurs.nom = "Le nom doit contenir au moins 3 caractères.";
    }

    if (!expressionEmail.test(valeurs.email)) {
      erreurs.email = "Veuillez saisir une adresse e-mail valide.";
    }

    if (!expressionMotDePasseRobuste.test(valeurs.motDePasse)) {
      erreurs.motDePasse = "Le mot de passe doit contenir 8 caractères minimum, une majuscule, un chiffre et un caractère spécial.";
    }

    if (valeurs.motDePasseConfirmation !== valeurs.motDePasse) {
      erreurs.motDePasseConfirmation = "La confirmation du mot de passe ne correspond pas.";
    }

    if (!valeurs.role) {
      erreurs.role = "Veuillez sélectionner un rôle.";
    }

    return erreurs;
  };

  // Laravel renvoie un objet d'erreurs par champ ; on prend le premier message utile pour l'affichage global.
  const extrairePremiereErreurValidation = (erreursLaravel) => {
    const entree = Object.values(erreursLaravel ?? {}).find(
      (valeur) => Array.isArray(valeur) && valeur.length > 0,
    );

    return entree?.[0] || "Données invalides.";
  };

  const gererSaisieNom = (evenement) => {
    setNom(evenement.target.value);
    setErreursChamps((precedent) => ({ ...precedent, nom: "" }));
  };

  const gererSaisieEmail = (evenement) => {
    const valeurSansEspaces = evenement.target.value.replace(/\s/g, "");
    setEmail(valeurSansEspaces);
    setErreursChamps((precedent) => ({ ...precedent, email: "" }));
  };

  const gererSaisieMotDePasse = (evenement) => {
    setMotDePasse(evenement.target.value);
    setErreursChamps((precedent) => ({ ...precedent, motDePasse: "" }));
  };

  const gererSaisieConfirmationMotDePasse = (evenement) => {
    setMotDePasseConfirmation(evenement.target.value);
    setErreursChamps((precedent) => ({ ...precedent, motDePasseConfirmation: "" }));
  };

  const gererSaisieRole = (evenement) => {
    setRole(evenement.target.value);
    setErreursChamps((precedent) => ({ ...precedent, role: "" }));
  };

  // On bloque l'espace à la saisie pour limiter les erreurs de frappe sur l'email.
  const bloquerEspacesEmail = (evenement) => {
    if (evenement.key === " ") {
      evenement.preventDefault();
    }
  };

  const gererInscription = async (evenement) => {
    if (chargement) {
      return;
    }

    evenement.preventDefault();
    setErreur("");

    // On normalise les valeurs avant validation/envoi (trim + email en minuscule).
    const donneesFormulaire = {
      nom: nom.trim(),
      email: email.trim().toLowerCase(),
      motDePasse,
      motDePasseConfirmation,
      role,
    };

    const erreursValidation = validerFormulaire(donneesFormulaire);
    setErreursChamps(erreursValidation);

    if (Object.keys(erreursValidation).length > 0) {
      return;
    }

    setChargement(true);

    try {
      const donnees = await inscrire(
        donneesFormulaire.nom,
        donneesFormulaire.email,
        donneesFormulaire.motDePasse,
        donneesFormulaire.role,
      );

      sauvegarderSession(donnees.token, donnees.utilisateur);

      // La redirection est pilotée par le rôle réellement renvoyé par le backend.
      const routeTableauDeBord = donnees.utilisateur?.role === "apprenant" ? "/dashboard/apprenant" : "/dashboard/formateur";
      navigate(routeTableauDeBord, { replace: true });
    } catch (e) {
      const statut = e.response?.status;
      const donneesErreur = e.response?.data;

      if (statut === 422) {
        // On mappe les erreurs backend champ par champ pour garder les messages au bon endroit dans le formulaire.
        const erreursLaravel = donneesErreur?.errors ?? {};
        setErreursChamps((precedent) => ({
          ...precedent,
          nom: erreursLaravel.nom?.[0] ?? precedent.nom,
          email: erreursLaravel.email?.[0] ?? precedent.email,
          motDePasse: erreursLaravel.mot_de_passe?.[0] ?? precedent.motDePasse,
          role: erreursLaravel.role?.[0] ?? precedent.role,
        }));
        setErreur(extrairePremiereErreurValidation(erreursLaravel));
      } else if (statut === 409) {
        setErreursChamps((precedent) => ({
          ...precedent,
          email: "Cette adresse e-mail est déjà utilisée.",
        }));
        setErreur("Cette adresse e-mail est déjà utilisée.");
      } else {
        const message = donneesErreur?.message || "Inscription impossible.";
        setErreur(message);
      }
    } finally {
      setChargement(false);
    }
  };

  return (
    <main className="connexion-page">
      <section className="connexion-carte" aria-labelledby="titre-inscription">
        <h1 id="titre-inscription">Inscription</h1>
        <p>Créez votre compte pour accéder au dashboard.</p>

        <form onSubmit={gererInscription} className="connexion-formulaire" noValidate>
          <label>
            Nom complet
            <input
              type="text"
              value={nom}
              onChange={gererSaisieNom}
              aria-invalid={Boolean(erreursChamps.nom)}
              aria-describedby={erreursChamps.nom ? "erreur-nom" : undefined}
              required
            />
            {erreursChamps.nom && <p id="erreur-nom" className="connexion-erreur-champ">{erreursChamps.nom}</p>}
          </label>

          <label>
            Adresse e-mail
            <input
              type="email"
              value={email}
              onChange={gererSaisieEmail}
              onKeyDown={bloquerEspacesEmail}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck="false"
              inputMode="email"
              aria-invalid={Boolean(erreursChamps.email)}
              aria-describedby={erreursChamps.email ? "erreur-email" : undefined}
              required
            />
            {erreursChamps.email && <p id="erreur-email" className="connexion-erreur-champ">{erreursChamps.email}</p>}
          </label>

          <label>
            Mot de passe
            <input
              type="password"
              value={motDePasse}
              onChange={gererSaisieMotDePasse}
              minLength={8}
              aria-invalid={Boolean(erreursChamps.motDePasse)}
              aria-describedby={erreursChamps.motDePasse ? "erreur-mot-de-passe" : undefined}
              required
            />
            {erreursChamps.motDePasse && (
              <p id="erreur-mot-de-passe" className="connexion-erreur-champ">{erreursChamps.motDePasse}</p>
            )}
          </label>

          <label>
            Confirmer le mot de passe
            <input
              type="password"
              value={motDePasseConfirmation}
              onChange={gererSaisieConfirmationMotDePasse}
              minLength={8}
              aria-invalid={Boolean(erreursChamps.motDePasseConfirmation)}
              aria-describedby={erreursChamps.motDePasseConfirmation ? "erreur-confirmation-mot-de-passe" : undefined}
              required
            />
            {erreursChamps.motDePasseConfirmation && (
              <p id="erreur-confirmation-mot-de-passe" className="connexion-erreur-champ">{erreursChamps.motDePasseConfirmation}</p>
            )}
          </label>

          <label>
            Rôle
            <select
              value={role}
              onChange={gererSaisieRole}
              aria-invalid={Boolean(erreursChamps.role)}
              aria-describedby={erreursChamps.role ? "erreur-role" : undefined}
              required
            >
              <option value="" disabled>Choisir un rôle</option>
              <option value="formateur">Formateur</option>
              <option value="apprenant">Apprenant</option>
            </select>
            {erreursChamps.role && <p id="erreur-role" className="connexion-erreur-champ">{erreursChamps.role}</p>}
          </label>

          {erreur && <p className="connexion-erreur" role="alert">{erreur}</p>}

          <button type="submit" className="connexion-bouton" disabled={chargement}>
            {chargement ? (
              <span className="connexion-bouton-contenu">
                <span className="connexion-spinner" aria-hidden="true"></span>
                Inscription en cours...
              </span>
            ) : "S'inscrire"}
          </button>

          <p className="connexion-lien-secondaire">
            Déjà inscrit ? <Link to="/connexion">Se connecter</Link>
          </p>
        </form>
      </section>
    </main>
  );
}

export default Inscription;

/*
| Projet: SkillHub
| Rôle du fichier: Page connexion utilisateur
| Dernière modification: 2026-03-06
*/

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { connecter } from "../services/authApi";
import { sauvegarderSession } from "../services/auth";
import "../styles/connexion.css";

// Page de connexion : authentifie l'utilisateur et redirige selon son rôle.
function Connexion() {
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [roleSelectionne, setRoleSelectionne] = useState("formateur");
  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(false);
  const navigate = useNavigate();

  // Vérifie les identifiants, contrôle le rôle sélectionné, puis enregistre la session locale.
  const gererConnexion = async (evenement) => {
    evenement.preventDefault();
    setErreur("");
    setChargement(true);

    try {
      const donnees = await connecter(email, motDePasse);

      if (donnees.utilisateur?.role !== roleSelectionne) {
        setErreur("Le rôle sélectionné ne correspond pas à ce compte.");
        return;
      }

      sauvegarderSession(donnees.token, donnees.utilisateur);

      const routeTableauDeBord = donnees.utilisateur?.role === "apprenant" ? "/dashboard/apprenant" : "/dashboard/formateur";
      navigate(routeTableauDeBord, { replace: true });
    } catch (e) {
      const message = e.response?.data?.message || "Connexion impossible.";
      setErreur(message);
    } finally {
      setChargement(false);
    }
  };

  return (
    <main className="connexion-page">
      <section className="connexion-carte" aria-labelledby="titre-connexion">
        <h1 id="titre-connexion">Connexion</h1>
        <p>Connectez-vous pour accéder au dashboard.</p>

        <form onSubmit={gererConnexion} className="connexion-formulaire">
          <label>
            Adresse e-mail
            <input
              type="email"
              value={email}
              onChange={(evenement) => setEmail(evenement.target.value)}
              required
            />
          </label>

          <label>
            Mot de passe
            <input
              type="password"
              value={motDePasse}
              onChange={(evenement) => setMotDePasse(evenement.target.value)}
              required
            />
          </label>

          <label>
            Rôle
            <select
              value={roleSelectionne}
              onChange={(evenement) => setRoleSelectionne(evenement.target.value)}
              required
            >
              <option value="formateur">Formateur</option>
              <option value="apprenant">Apprenant</option>
            </select>
          </label>

          {erreur && <p className="connexion-erreur">{erreur}</p>}

          <button type="submit" className="connexion-bouton" disabled={chargement}>
            {chargement ? "Connexion en cours..." : "Se connecter"}
          </button>

          <p className="connexion-lien-secondaire">
            Pas encore de compte ? <Link to="/inscription">Créer un compte</Link>
          </p>
        </form>
      </section>
    </main>
  );
}

export default Connexion;

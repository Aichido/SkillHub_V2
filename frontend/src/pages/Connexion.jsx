/*
| Projet: SkillHub
| Rôle du fichier: Page de redirection vers l'authentification Java
| Dernière modification: 2026-04-24
*/

import { Link } from "react-router-dom";
import "../styles/connexion.css";

function Connexion() {
  const authPageBase = import.meta.env.VITE_AUTH_PAGE_URL || "http://127.0.0.1:8081";
  const returnUrl = `${window.location.origin}/auth/callback`;

  const redirigerVersAuthJava = () => {
    const url = new URL(`${authPageBase}/connexion.html`);
    url.searchParams.set("returnUrl", returnUrl);
    window.location.href = url.toString();
  };

  return (
    <main className="connexion-page">
      <section className="connexion-carte" aria-labelledby="titre-connexion-java">
        <h1 id="titre-connexion-java">Connexion</h1>
        <p>Vous allez être redirigé vers la page d'authentification du service Java.</p>

        <button type="button" className="connexion-bouton" onClick={redirigerVersAuthJava}>
          Se connecter avec le service Java
        </button>

        <p className="connexion-lien-secondaire">
          Pas encore de compte ? <Link to="/inscription">Créer un compte</Link>
        </p>
      </section>
    </main>
  );
}

export default Connexion;

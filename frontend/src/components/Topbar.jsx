import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faMoon, faSun } from "@fortawesome/free-solid-svg-icons";
import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "../assets/logo.svg";
import { deconnecter } from "../services/authApi";
import { recupererUtilisateur, supprimerSession } from "../services/auth";
import "../styles/topbar.css";

function Topbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const utilisateur = recupererUtilisateur();
  const routeDashboard = utilisateur?.role === "apprenant" ? "/dashboard/apprenant" : "/dashboard/formateur";
  const nomUtilisateur = utilisateur?.nom || "Utilisateur";
  const [theme, setTheme] = useState("light");
  const afficherBoutonRetour = !["/dashboard/formateur", "/dashboard/apprenant"].includes(location.pathname);

  useEffect(() => {
    const themeSauvegarde = localStorage.getItem("theme-dashboard");
    const themeInitial = themeSauvegarde === "dark" ? "dark" : "light";

    setTheme(themeInitial);
    document.documentElement.dataset.theme = themeInitial;
  }, []);

  const basculerTheme = () => {
    const prochainTheme = theme === "dark" ? "light" : "dark";
    setTheme(prochainTheme);
    localStorage.setItem("theme-dashboard", prochainTheme);
    document.documentElement.dataset.theme = prochainTheme;
  };

  const gererRetour = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate(routeDashboard, { replace: true });
  };

  const gererDeconnexion = async () => {
    try {
      await deconnecter();
    } catch { /* ignore */ } finally {
      supprimerSession();
      navigate("/", { replace: true });
    }
  };

  return (
    <header className="topbar">
      <Link to={routeDashboard} className="topbar-logo" aria-label="Retour au dashboard">
        <img src={logo} alt="Logo SkillHub" className="topbar-logo-img" />
      </Link>

      <nav className="topbar-links" aria-label="Navigation principale">
        <Link to={routeDashboard}>Dashboard</Link>
        <Link to="/">Accueil</Link>
        <Link to="/formations">Formations</Link>
      </nav>

      <div className="topbar-actions">
        <span className="topbar-username">{nomUtilisateur}</span>
        {afficherBoutonRetour && (
          <button type="button" className="back_btn" onClick={gererRetour}>
            <FontAwesomeIcon icon={faArrowLeft} aria-hidden="true" />
            <span>Retour</span>
          </button>
        )}
        <button
          type="button"
          className="theme_btn"
          onClick={basculerTheme}
          aria-label={theme === "dark" ? "Passer en mode clair" : "Passer en mode sombre"}
          title={theme === "dark" ? "Mode clair" : "Mode sombre"}
        >
          <FontAwesomeIcon icon={theme === "dark" ? faSun : faMoon} aria-hidden="true" />
          <span>{theme === "dark" ? "Clair" : "Sombre"}</span>
        </button>
        <button type="button" className="logout_btn" onClick={gererDeconnexion}>
          Déconnexion
        </button>
      </div>
    </header>
  );
}

export default Topbar;

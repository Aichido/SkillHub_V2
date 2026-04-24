import logo from "../assets/logo.svg";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBook, faSignOutAlt } from "@fortawesome/free-solid-svg-icons";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { deconnecter } from "../services/authApi";
import { recupererUtilisateur, supprimerSession } from "../services/auth";
import "../styles/sidebar.css";

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const utilisateur = recupererUtilisateur();
  const routeTableauDeBord = utilisateur?.role === "apprenant" ? "/dashboard/apprenant" : "/dashboard/formateur";

  const gererDeconnexion = async () => {
    try {
      await deconnecter();
    } catch { /* ignore */ } finally {
      supprimerSession();
      navigate("/", { replace: true });
    }
  };

  return (
    <aside className="sidebar" aria-label="Menu principal">
      <div className="sidebar_logo">
        <img
          src={logo}
          alt="Logo SkillHub"
          className="logo"
          loading="lazy"
        />
      </div>

      <ul className="menu-top">
        <li>
          <Link
            to={routeTableauDeBord}
            className={`sidebar-item ${location.pathname === routeTableauDeBord ? "active" : ""}`}
          >
            <FontAwesomeIcon icon={faBook} aria-hidden="true" />
            <span>Dashboard</span>
          </Link>
        </li>

        <li>
          <Link
            to="/mes-ateliers"
            className={`sidebar-item ${location.pathname === "/mes-ateliers" ? "active" : ""}`}
          >
            <FontAwesomeIcon icon={faBook} aria-hidden="true" />
            <span>Mes ateliers</span>
          </Link>
        </li>
      </ul>

      <ul className="menu-bottom">
        <li className="sidebar-item">
          <button type="button" className="sidebar-btn" onClick={gererDeconnexion}>
            <FontAwesomeIcon icon={faSignOutAlt} aria-hidden="true" />
            <span>Déconnexion</span>
          </button>
        </li>
      </ul>
    </aside>
  );
}

export default Sidebar;

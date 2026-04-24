import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { recupererUtilisateur, supprimerSession } from "../services/auth";
import { deconnecter } from "../services/authApi";
import { listerFormations } from "../services/formationsApi";
import logoSkillHub from "../assets/logo.svg";
import "../styles/formations-page.css";

const CATEGORIES = ["", "dev", "design", "business", "marketing"];
const LABELS_CATEGORIES = {
  "": "Toutes",
  dev: "Développement",
  design: "Design",
  business: "Business",
  marketing: "Marketing",
};

const IMAGES_FORMATIONS = [
  "/assets/images/learning/learning-hero.jpg",
  "/assets/images/learning/learning-laptop.jpg",
  "/assets/images/learning/learning-notes.jpg",
  "/assets/images/learning/learning-team.jpg",
];

function mapperCategorie(category) {
  const valeur = (category || "").toLowerCase();

  if (valeur.includes("développement") || valeur.includes("developpement") || valeur.includes("web")) {
    return "dev";
  }

  if (valeur.includes("design")) {
    return "design";
  }

  if (valeur.includes("marketing")) {
    return "marketing";
  }

  if (valeur.includes("data") || valeur.includes("devops")) {
    return "business";
  }

  return "dev";
}

function niveauAffichage(level) {
  if (level === "advanced") {
    return "Avancé";
  }

  if (level === "intermediaire") {
    return "Intermédiaire";
  }

  return "Débutant";
}

function Formations() {
  const navigate = useNavigate();
  const modalRef = useRef(null);
  const lastFocusedRef = useRef(null);
  const [menuOuvert, setMenuOuvert] = useState(false);
  const [modalOuverte, setModalOuverte] = useState(false);
  const [recherche, setRecherche] = useState("");
  const [categorie, setCategorie] = useState("");
  const [niveau, setNiveau] = useState("");
  const [minHeures, setMinHeures] = useState("");
  const [maxHeures, setMaxHeures] = useState("");
  const [minPrix, setMinPrix] = useState("");
  const [maxPrix, setMaxPrix] = useState("");
  const [formations, setFormations] = useState([]);
  const [formationsFiltrees, setFormationsFiltrees] = useState([]);
  const [erreur, setErreur] = useState(false);

  const utilisateur = recupererUtilisateur();

  useEffect(() => {
    document.title = "Formations";
  }, []);

  useEffect(() => {
    let actif = true;

    const charger = async () => {
      try {
        const data = await listerFormations();

        if (!actif) {
          return;
        }

        const normalisees = (data || []).map((item) => ({
          id: item.id,
          nom: item.titre || "Formation",
          description: item.description || "",
          formateur: item.formateur || "N/A",
          prix: Number(item.price || 0),
          duree: Number(item.duration || 0),
          categorie: mapperCategorie(item.category),
          level: item.level || "beginner",
          apprenants: Number(item.apprenants || 0),
          vues: Number(item.vues || 0),
        }));

        setFormations(normalisees);
        setFormationsFiltrees(normalisees);
        setErreur(false);
      } catch {
        if (!actif) {
          return;
        }

        setFormations([]);
        setFormationsFiltrees([]);
        setErreur(true);
      }
    };

    charger();

    return () => {
      actif = false;
    };
  }, []);

  useEffect(() => {
    const temporisation = globalThis.setTimeout(() => {
      const query = recherche.trim().toLowerCase();
      const minH = Number.isNaN(Number.parseFloat(minHeures)) ? 0 : Number.parseFloat(minHeures);
      const maxH = Number.isNaN(Number.parseFloat(maxHeures)) ? Number.POSITIVE_INFINITY : Number.parseFloat(maxHeures);
      const minP = Number.isNaN(Number.parseFloat(minPrix)) ? 0 : Number.parseFloat(minPrix);
      const maxP = Number.isNaN(Number.parseFloat(maxPrix)) ? Number.POSITIVE_INFINITY : Number.parseFloat(maxPrix);

      const resultat = formations.filter((formation) => {
        const matchQuery =
          formation.nom.toLowerCase().includes(query)
          || formation.description.toLowerCase().includes(query)
          || formation.categorie.toLowerCase().includes(query);

        const matchFiltres =
          (categorie === "" || formation.categorie === categorie)
          && (niveau === "" || formation.level === niveau)
          && formation.duree >= minH
          && formation.duree <= maxH
          && formation.prix >= minP
          && formation.prix <= maxP;

        return matchQuery && matchFiltres;
      });

      setFormationsFiltrees(resultat);
    }, 180);

    return () => {
      globalThis.clearTimeout(temporisation);
    };
  }, [recherche, categorie, niveau, minHeures, maxHeures, minPrix, maxPrix, formations]);

  const appliquerRechercheEtFiltres = () => {
    const query = recherche.trim().toLowerCase();
    const minH = Number.isNaN(parseFloat(minHeures)) ? 0 : parseFloat(minHeures);
    const maxH = Number.isNaN(parseFloat(maxHeures)) ? Number.POSITIVE_INFINITY : parseFloat(maxHeures);
    const minP = Number.isNaN(parseFloat(minPrix)) ? 0 : parseFloat(minPrix);
    const maxP = Number.isNaN(parseFloat(maxPrix)) ? Number.POSITIVE_INFINITY : parseFloat(maxPrix);

    const resultat = formations.filter((formation) => {
      const matchQuery =
        formation.nom.toLowerCase().includes(query)
        || formation.description.toLowerCase().includes(query)
        || formation.categorie.toLowerCase().includes(query);

      const matchFiltres =
        (categorie === "" || formation.categorie === categorie)
        && (niveau === "" || formation.level === niveau)
        && formation.duree >= minH
        && formation.duree <= maxH
        && formation.prix >= minP
        && formation.prix <= maxP;

      return matchQuery && matchFiltres;
    });

    setFormationsFiltrees(resultat);
  };

  const gererDeconnexion = async () => {
    try { await deconnecter(); } catch { /* ignore */ }
    finally { supprimerSession(); navigate("/connexion", { replace: true }); }
  };

  const ouvrirModal = () => {
    lastFocusedRef.current = document.activeElement;
    setModalOuverte(true);
  };

  const fermerModal = () => setModalOuverte(false);
  const soumettreModal = (e) => { e.preventDefault(); navigate("/inscription"); };

  const rechercher = (event) => {
    event.preventDefault();
  };

  return (
    <>
      <header className="header">
        <nav className="navbar" aria-label="Navigation principale">
          <div className="logo">
            <img src={logoSkillHub} alt="Logo SkillHub" />
          </div>
          <button
            className="menuburger"
            id="burger"
            aria-label="Ouvrir le menu"
            aria-expanded={menuOuvert}
            aria-controls="navigation-menu"
            type="button"
            onClick={() => setMenuOuvert((valeur) => !valeur)}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
          <ul className={`liens-navigation ${menuOuvert ? "active" : ""}`} id="navigation-menu">
            <li><Link to="/">Accueil</Link></li>
            <li><a href="#">À propos</a></li>
            <li><a href="#footer">Contact</a></li>
            {!utilisateur && (
              <li><Link to="/connexion">Se connecter</Link></li>
            )}
          </ul>
          <div className="bouton-inscription">
            {utilisateur ? (
              <button className="btn-login btn-logout" type="button" onClick={gererDeconnexion}>
                Se déconnecter
              </button>
            ) : (
              <button id="openModal" className="btn-login" aria-haspopup="dialog" type="button" onClick={ouvrirModal}>
                S'inscrire
              </button>
            )}
          </div>
        </nav>
      </header>

      <main id="contenu">
        <section className="hero" aria-labelledby="hero-title">
          <div className="illustration_2">
            <div className="ill2">
              <img src="/assets/images/learning/learning-hero.jpg" alt="" />
            </div>
          </div>
          <div className="title">
            <h1 id="hero-title">Découvre nos formations</h1>
            <p>Explore des parcours modernes, orientés pratique et progression continue.</p>
          </div>
          <form className="search barre-recherche" aria-label="Recherche sur le site" role="search" onSubmit={rechercher}>
            <div className="search-input">
              <input
                type="text"
                id="search-bar"
                name="search"
                placeholder="Rechercher une formation..."
                value={recherche}
                onChange={(event) => setRecherche(event.target.value)}
              />
              <button type="submit">Chercher</button>
            </div>
          </form>
        </section>

        <section className="formations" aria-label="Formations disponibles">
          <aside className="filtre" aria-labelledby="filtre-title">
            <h2 id="filtre-title">Filtrer par :</h2>
            <label htmlFor="categoryFilter">Catégorie</label>
            <select id="categoryFilter" name="category" value={categorie} onChange={(event) => setCategorie(event.target.value)}>
              {CATEGORIES.map((option) => (
                <option key={option || "all"} value={option}>{LABELS_CATEGORIES[option]}</option>
              ))}
            </select>
            <label htmlFor="levelFilter">Niveau</label>
            <select id="levelFilter" name="level" value={niveau} onChange={(event) => setNiveau(event.target.value)}>
              <option value="">Tous</option>
              <option value="beginner">Débutant</option>
              <option value="intermediaire">Intermédiaire</option>
              <option value="advanced">Avancé</option>
            </select>
            <label htmlFor="minHours">Durée minimum (heures)</label>
            <input
              type="number"
              id="minHours"
              name="minHours"
              placeholder="Heure min"
              min="0"
              value={minHeures}
              onChange={(event) => setMinHeures(event.target.value)}
            />
            <label htmlFor="maxHours">Durée maximum (heures)</label>
            <input
              type="number"
              id="maxHours"
              name="maxHours"
              placeholder="Heure max"
              min="0"
              value={maxHeures}
              onChange={(event) => setMaxHeures(event.target.value)}
            />
            <label htmlFor="minPrice">Prix minimum (Rs)</label>
            <input
              type="number"
              id="minPrice"
              name="minPrice"
              placeholder="Prix min"
              min="0"
              value={minPrix}
              onChange={(event) => setMinPrix(event.target.value)}
            />
            <label htmlFor="maxPrice">Prix maximum (Rs)</label>
            <input
              type="number"
              id="maxPrice"
              name="maxPrice"
              placeholder="Prix max"
              min="0"
              value={maxPrix}
              onChange={(event) => setMaxPrix(event.target.value)}
            />
            <button id="filterBtn" type="button" onClick={appliquerRechercheEtFiltres}>Filtrer</button>
          </aside>
          <div className="cards-container" id="cardsContainer" aria-live="polite">
            {erreur && <p>Impossible de charger les formations.</p>}
            {!erreur && formationsFiltrees.length === 0 && <p>Aucune formation trouvée.</p>}
            {!erreur && formationsFiltrees.map((formation, index) => (
              <div className="card" key={formation.id}>
                <span className={`card-badge ${formation.categorie}`}>{formation.categorie}</span>
                <img src={IMAGES_FORMATIONS[index % IMAGES_FORMATIONS.length]} alt="Illustration formation" />
                <h3>{formation.nom}</h3>
                <p>Formateur : {formation.formateur || "N/A"}</p>
                <p>{formation.description || "Aucune description disponible."}</p>
                <p>Niveau : {niveauAffichage(formation.level)}</p>
                <p>Apprenants : {formation.apprenants} • Vues : {formation.vues}</p>
                <div className="card-bottom">
                  <span><i className="fa-regular fa-clock"></i>{formation.duree}h</span>
                  <span><i className="fa-solid fa-tag"></i>{formation.prix} Rs</span>
                </div>
                <Link to={`/formation/${formation.id}`} style={{ marginTop: "8px" }}>Voir détail</Link>
              </div>
            ))}
          </div>
        </section>
      </main>

      {modalOuverte && (
        <div id="modalOverlay" className="overlay" aria-hidden="true" onClick={fermerModal} onKeyDown={fermerModal}></div>
      )}
      {modalOuverte && (
        <div id="modal" className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title-formations" ref={modalRef}>
          <h2 id="modal-title-formations">Rejoindre SkillHub</h2>
          <p className="modal-subtitle">Créez votre compte gratuitement</p>
          <form onSubmit={soumettreModal}>
            <div className="champ">
              <label htmlFor="f-modal-nom">Nom</label>
              <input id="f-modal-nom" type="text" placeholder="Votre nom" required />
            </div>
            <div className="champ">
              <label htmlFor="f-modal-email">Email</label>
              <input id="f-modal-email" type="email" placeholder="votre@email.com" required />
            </div>
            <div className="champ">
              <label htmlFor="f-modal-mdp">Mot de passe</label>
              <input id="f-modal-mdp" type="password" placeholder="••••••••" required />
            </div>
            <div className="modal-actions">
              <button type="submit">Créer le compte</button>
              <button type="button" onClick={fermerModal}>Annuler</button>
            </div>
          </form>
          <p className="modal-login-link">
            Déjà inscrit ?{" "}
            <Link to="/connexion" onClick={fermerModal}>Se connecter</Link>
          </p>
        </div>
      )}

      <footer className="footer" id="footer">
        <div className="footer-container">
          <div className="footer_logo-p">
            <img src="/assets/images/logo.svg" alt="Logo de SkillHub" className="footer-logo" />
            <p className="footer-texte">Apprendre, partager et progresser ensemble.</p>
          </div>
          <nav className="footer-nav" aria-label="Navigation du footer">
            <h2 className="footer-titre">Navigation</h2>
            <ul className="footer-liste">
              <li><a href="#">Accueil</a></li>
              <li><a href="#">Cours</a></li>
              <li><a href="#">Communauté</a></li>
              <li><a href="#">À propos</a></li>
            </ul>
          </nav>
          <div className="footer_categ">
            <h2 className="footer-titre">Catégories</h2>
            <ul className="footer-liste">
              <li><a href="#">Développement web</a></li>
              <li><a href="#">Design</a></li>
              <li><a href="#">Marketing</a></li>
              <li><a href="#">Management</a></li>
            </ul>
          </div>
          <div className="footer-social">
            <h2 className="footer-titre">Réseaux</h2>
            <div className="footer-social-liens">
              <a href="https://facebook.com" aria-label="Facebook" className="lien">
                <img src="/assets/images/facebook.svg" alt="" className="footer-icone" />
                Facebook
              </a>
              <a href="https://linkedin.com" aria-label="LinkedIn" className="lien">
                <img src="/assets/images/linkedin.svg" alt="" className="footer-icone" />
                Linkedin
              </a>
              <a href="https://gmail.com" aria-label="Gmail" className="lien">
                <img src="/assets/images/gmail.svg" alt="" className="footer-icone" />
                Mail
              </a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2026 SkillHub MCCI - Projet fil rouge Licence. Tous droits réservés.</p>
        </div>
      </footer>
    </>
  );
}

export default Formations;

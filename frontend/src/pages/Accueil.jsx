import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { recupererUtilisateur, supprimerSession } from "../services/auth";
import { deconnecter } from "../services/authApi";
import { listerFormations } from "../services/formationsApi";
import logoSkillHub from "../assets/logo.svg";
import "../styles/accueil.css";

const TEMOIGNAGES = [
  {
    nom: "Nandrianina",
    photo: "/assets/images/profile1.jfif",
    texte: "SkillHub m'a permis d'avancer rapidement.",
  },
  {
    nom: "Maholy",
    photo: "/assets/images/profile1.jfif",
    texte: "J'ai adoré la progression module par module.",
  },
  {
    nom: "Irene",
    photo: "/assets/images/profile1.jfif",
    texte: "Les ateliers sont très bien structurés.",
  },
  {
    nom: "Mathieu",
    photo: "/assets/images/profile1.jfif",
    texte: "Une plateforme claire et efficace.",
  },
];

const IMAGES_APPRENTISSAGE = [
  "/assets/images/learning/learning-hero.jpg",
  "/assets/images/learning/learning-laptop.jpg",
  "/assets/images/learning/learning-notes.jpg",
  "/assets/images/learning/learning-team.jpg",
];

function niveauAffichage(level) {
  if (level === "advanced") {
    return "Avancé";
  }

  if (level === "intermediaire") {
    return "Intermédiaire";
  }

  return "Débutant";
}

function Accueil() {
  const navigate = useNavigate();
  const modalRef = useRef(null);
  const lastFocusedRef = useRef(null);

  const [menuOuvert, setMenuOuvert] = useState(false);
  const [modalOuverte, setModalOuverte] = useState(false);
  const [pointActif, setPointActif] = useState(0);
  const [formationsMisesEnAvant, setFormationsMisesEnAvant] = useState([]);
  const [erreurFormations, setErreurFormations] = useState(false);

  const [formulaire, setFormulaire] = useState({
    nom: "",
    email: "",
    mdp: "",
    confirmer: "",
  });
  const [erreurs, setErreurs] = useState({
    nom: "",
    email: "",
    mdp: "",
    confirmer: "",
  });
  const [messageEnvoi, setMessageEnvoi] = useState("");

  const utilisateur = recupererUtilisateur();
  const lienHeroFormateur = utilisateur?.role === "formateur" ? "/dashboard/formateur" : "/connexion";
  const lienHeroApprenant = utilisateur?.role === "apprenant" ? "/dashboard/apprenant" : "/formations";

  useEffect(() => {
    document.title = "SkillHub";
  }, []);

  useEffect(() => {
    let actif = true;

    const chargerFormations = async () => {
      try {
        const donnees = await listerFormations();

        if (!actif) {
          return;
        }

        setFormationsMisesEnAvant(donnees.slice(0, 3));
        setErreurFormations(false);
      } catch {
        if (!actif) {
          return;
        }

        setFormationsMisesEnAvant([]);
        setErreurFormations(true);
      }
    };

    chargerFormations();

    return () => {
      actif = false;
    };
  }, []);

  useEffect(() => {
    if (!modalOuverte) {
      document.body.classList.remove("no-scroll");
      return;
    }

    document.body.classList.add("no-scroll");

    const premierInput = modalRef.current?.querySelector("input");
    premierInput?.focus();

    const gererClavier = (event) => {
      if (event.key === "Escape") {
        setModalOuverte(false);
      }

      if (event.key !== "Tab" || !modalRef.current) {
        return;
      }

      const focusables = modalRef.current.querySelectorAll(
        "button, input, [tabindex]:not([tabindex='-1'])",
      );

      if (!focusables.length) {
        return;
      }

      const premier = focusables[0];
      const dernier = focusables[focusables.length - 1];

      if (event.shiftKey && document.activeElement === premier) {
        event.preventDefault();
        dernier.focus();
      }

      if (!event.shiftKey && document.activeElement === dernier) {
        event.preventDefault();
        premier.focus();
      }
    };

    document.addEventListener("keydown", gererClavier);

    return () => {
      document.body.classList.remove("no-scroll");
      document.removeEventListener("keydown", gererClavier);
      lastFocusedRef.current?.focus();
    };
  }, [modalOuverte]);

  useEffect(() => {
    if (!("IntersectionObserver" in window)) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.15,
      },
    );

    const elements = document.querySelectorAll(
      ".hero-highlight-card, .hero-stat-card, .guide-carte, .valeur-carte, .temoignage-container",
    );

    elements.forEach((element) => {
      element.classList.add("reveal-on-scroll");
      observer.observe(element);
    });

    return () => {
      observer.disconnect();
    };
  }, [formationsMisesEnAvant]);

  useEffect(() => {
    if (!TEMOIGNAGES.length) {
      return;
    }

    const timer = window.setTimeout(() => {
      setPointActif((precedent) => (precedent + 1) % TEMOIGNAGES.length);
    }, 3000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [pointActif]);

  const gererDeconnexion = async () => {
    try {
      await deconnecter();
    } catch { /* ignore */ } finally {
      supprimerSession();
      navigate("/connexion", { replace: true });
    }
  };

  const ouvrirModal = () => {
    lastFocusedRef.current = document.activeElement;
    setModalOuverte(true);
  };

  const fermerModal = () => {
    setModalOuverte(false);
  };

  const soumettreModal = (event) => {
    event.preventDefault();
    navigate("/inscription");
  };

  const changerChamp = (event) => {
    const { name, value } = event.target;
    setFormulaire((precedent) => ({
      ...precedent,
      [name]: value,
    }));
    setErreurs((precedent) => ({
      ...precedent,
      [name]: "",
    }));
  };

  const emailValide = (email) => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);

  const soumettreInscription = (event) => {
    event.preventDefault();

    const nouvellesErreurs = {
      nom: "",
      email: "",
      mdp: "",
      confirmer: "",
    };

    let valide = true;

    if (!formulaire.nom.trim()) {
      nouvellesErreurs.nom = "Le nom est obligatoire";
      valide = false;
    }

    if (!emailValide(formulaire.email)) {
      nouvellesErreurs.email = "Email invalide";
      valide = false;
    }

    if (formulaire.mdp.length < 6) {
      nouvellesErreurs.mdp = "Mot de passe trop court";
      valide = false;
    }

    if (formulaire.confirmer !== formulaire.mdp) {
      nouvellesErreurs.confirmer = "Les mots de passe ne correspondent pas";
      valide = false;
    }

    setErreurs(nouvellesErreurs);

    if (valide) {
      setMessageEnvoi("Redirection vers l'inscription...");
      navigate("/inscription");
      return;
    }

    setMessageEnvoi("");
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
            aria-controls="menu-principal"
            type="button"
            onClick={() => setMenuOuvert((valeur) => !valeur)}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
          <ul className={`liens-navigation ${menuOuvert ? "active" : ""}`} id="menu-principal">
            <li><Link to="/" aria-current="page">Accueil</Link></li>
            <li><Link to="/formations">Formations</Link></li>
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
          <div className="illustration illu1">
            <img src="/assets/images/learning/learning-laptop.jpg" alt="" aria-hidden="true" />
          </div>
          <div className="illustration illu2">
            <img src="/assets/images/learning/learning-notes.jpg" alt="" aria-hidden="true" />
          </div>
          <h1 className="hero-titre" id="hero-title">
            Apprends. <span className="progresse">Progresse</span>. Réussis.
          </h1>
          <p className="hero-texte">
            Ici, chaque effort compte. Tu apprends, tu pratiques,
            et tu vois tes progrès se transformer en vraies victoires. <br />
            SkillHub rend ton chemin plus fluide et inspirant.
          </p>
          <div className="hero-boutons">
            <Link to={lienHeroFormateur} className="btn btn-formateur" role="button"><i className="fa-solid fa-chalkboard-user"></i>{' '}Formateurs</Link>
            <Link to={lienHeroApprenant} className="btn btn-apprenant" role="button"><i className="fa-solid fa-book-open-reader"></i>{' '}Apprenants</Link>
          </div>
        </section>
      </main>

      <section className="guide" id="guide" aria-labelledby="guide-title">
        <div className="guide-header">
          <h2 id="guide-title">Comment <br />ça marche ?</h2>
        </div>
        <div className="guide-cartes">
          <div className="guide-column guide-formateurs">
            <p className="guide-role">Formateurs</p>
            <article className="guide-carte">
              <div className="carte-header">
                <img src="/assets/images/icon_profile.svg" alt="" className="guide-icon" aria-hidden="true" />
                <h3 className="guide-titre">Créez votre cours</h3>
              </div>
              <div className="guide-texte">
                <p>
                  Déposez facilement vos formations en ligne, ajoutez vidéos, documents et quiz,
                  et configurez vos modules selon votre style d’enseignement.
                </p>
              </div>
            </article>
            <article className="guide-carte">
              <div className="carte-header">
                <img src="/assets/images/icon-robot.svg" alt="" className="guide-icon" aria-hidden="true" />
                <h3 className="guide-titre">Publiez et atteignez vos élèves</h3>
              </div>
              <div className="guide-texte">
                <p>
                  Une fois votre cours prêt, publiez-le et touchez une
                  communauté d’apprenants motivés. Suivez les progrès et
                  récoltez des avis pour améliorer votre impact.
                </p>
              </div>
            </article>
          </div>
          <div className="guide-column guide-apprenants">
            <p className="guide-role">Apprenants</p>
            <article className="guide-carte">
              <div className="carte-header">
                <img src="/assets/images/icon-search.svg" alt="" className="guide-icon" aria-hidden="true" />
                <h3 className="guide-titre">Explorez et choisissez</h3>
              </div>
              <div className="guide-texte">
                <p>
                  Parcourez notre catalogue de formations par catégorie ou niveau,
                  comparez les cours et sélectionnez celui qui correspond à vos objectifs.
                </p>
              </div>
            </article>
            <article className="guide-carte">
              <div className="carte-header">
                <img src="/assets/images/icons_book.svg" alt="" className="guide-icon" aria-hidden="true" />
                <h3 className="guide-titre">Apprenez à votre rythme</h3>
              </div>
              <div className="guide-texte">
                <p>
                  Accédez à vos cours en ligne depuis n’importe quel appareil,
                  avancez à votre rythme, faites des quiz et suivez votre progression facilement.
                </p>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="valeurs valeurs-highlights" aria-labelledby="valeurs-title">
        <div className="valeurs-header">
          <h2 id="valeurs-title">Nos valeurs</h2>
        </div>
        <div className="valeurs_container valeurs-list">
          <article className="valeur-item">
            <h3><i className="fa-solid fa-layer-group"></i> Modules guidés</h3>
            <p className="texte-carte">Des parcours découpés clairement pour avancer étape par étape.</p>
          </article>
          <article className="valeur-item">
            <h3><i className="fa-solid fa-chart-line"></i> Progression visible</h3>
            <p className="texte-carte">Suivi d'apprentissage et montée en compétences en continu.</p>
          </article>
          <article className="valeur-item">
            <h3><i className="fa-solid fa-shield-heart"></i> Expérience rassurante</h3>
            <p className="texte-carte">Une interface claire, pédagogique et facile à prendre en main.</p>
          </article>
        </div>
      </section>

      <section className="temoignages" aria-labelledby="temoignages-title">
        <h2 id="temoignages-title">Témoignages</h2>
        <div className="temoignage-container" id="temoignageCarte" aria-live="polite">
          {TEMOIGNAGES.map((temoignage, index) => (
            <article className={`temoignage-carte ${index === pointActif ? "active" : ""}`} key={temoignage.nom}>
              <span className="temoignage-quote" aria-hidden="true">“</span>
              <img src={temoignage.photo} className="temoignage-profil" alt="" />
              <h3 className="temoignage-nom">{temoignage.nom}</h3>
              <p className="temoignage-texte">{temoignage.texte}</p>
            </article>
          ))}
        </div>
        <div className="temoignage-dots" id="temoignagePoints" role="tablist">
          {TEMOIGNAGES.map((temoignage, index) => (
            <span
              key={`${temoignage.nom}-dot`}
              className={`temoignage-point ${index === pointActif ? "active" : ""}`}
              onClick={() => setPointActif(index)}
              onKeyDown={(e) => e.key === 'Enter' && setPointActif(index)}
              role="tab"
              tabIndex={0}
            ></span>
          ))}
        </div>
      </section>

      <section className="valeurs featured-formations" aria-labelledby="formations-mises-en-avant-title">
        <div className="valeurs-header">
          <h2 id="formations-mises-en-avant-title">Formations mises en avant</h2>
        </div>
        <div className="valeurs_container featured-grid" id="featuredFormations" aria-live="polite">
          {!erreurFormations && formationsMisesEnAvant.map((formation, index) => (
            <article className="valeur-carte featured-card" key={formation.id}>
              <div className="featured-thumb">
                <img src={IMAGES_APPRENTISSAGE[index % IMAGES_APPRENTISSAGE.length]} alt="" className="icon-carte featured-image" aria-hidden="true" />
              </div>
              <div className="featured-content">
                <h3><i className="fa-solid fa-graduation-cap"></i> {formation.titre}</h3>
                <p className="texte-carte featured-meta"><i className="fa-solid fa-signal"></i> Niveau : {niveauAffichage(formation.level)}</p>
                <p className="texte-carte featured-meta"><i className="fa-solid fa-chalkboard-user"></i> Formateur : {formation.formateur || "N/A"}</p>
              </div>
            </article>
          ))}
          {erreurFormations && <p>Impossible de charger les formations mises en avant.</p>}
        </div>
        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <Link to="/formations" className="btn btn-apprenant" role="button">Voir toutes les formations</Link>
        </div>
      </section>

      <section className="inscription" aria-labelledby="inscription-title">
        <form id="inscription" noValidate onSubmit={soumettreInscription}>
          <h2 id="inscription-title">Inscription</h2>
          <div className="champ">
            <label htmlFor="nom-form">Nom</label>
            <input
              type="text"
              id="nom-form"
              name="nom"
              required
              value={formulaire.nom}
              onChange={changerChamp}
              className={erreurs.nom ? "erreur-bordure" : ""}
            />
            <small className="error" aria-live="assertive">{erreurs.nom}</small>
          </div>
          <div className="champ">
            <label htmlFor="email-form">Email</label>
            <input
              type="email"
              id="email-form"
              name="email"
              required
              value={formulaire.email}
              onChange={changerChamp}
              className={erreurs.email ? "erreur-bordure" : ""}
            />
            <small className="error" aria-live="assertive">{erreurs.email}</small>
          </div>
          <div className="champ">
            <label htmlFor="mdp-form">Mot de passe</label>
            <input
              type="password"
              id="mdp-form"
              name="mdp"
              required
              value={formulaire.mdp}
              onChange={changerChamp}
              className={erreurs.mdp ? "erreur-bordure" : ""}
            />
            <small className="error" aria-live="assertive">{erreurs.mdp}</small>
          </div>
          <div className="champ">
            <label htmlFor="confirmer-form">Confirmer mot de passe</label>
            <input
              type="password"
              id="confirmer-form"
              name="confirmer"
              required
              value={formulaire.confirmer}
              onChange={changerChamp}
              className={erreurs.confirmer ? "erreur-bordure" : ""}
            />
            <small className="error" aria-live="assertive">{erreurs.confirmer}</small>
          </div>
          <button type="submit">S'inscrire</button>
          <p id="envoiReussi" aria-live="polite">{messageEnvoi}</p>
        </form>
      </section>

      <div id="modalOverlay" className="overlay" aria-hidden="true" hidden={!modalOuverte} onClick={fermerModal} onKeyDown={fermerModal}></div>
      <div
        id="modal"
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="title"
        hidden={!modalOuverte}
        ref={modalRef}
      >
        <h2 id="title">Rejoindre SkillHub</h2>
        <p className="modal-subtitle">Créez votre compte gratuitement</p>
        <form onSubmit={soumettreModal}>
          <div className="champ">
            <label htmlFor="modal-nom">Nom</label>
            <input id="modal-nom" type="text" placeholder="Votre nom" required />
          </div>
          <div className="champ">
            <label htmlFor="modal-email">Email</label>
            <input id="modal-email" type="email" placeholder="votre@email.com" required />
          </div>
          <div className="champ">
            <label htmlFor="modal-mdp">Mot de passe</label>
            <input id="modal-mdp" type="password" placeholder="••••••••" required />
          </div>
          <div className="modal-actions">
            <button type="submit">Créer le compte</button>
            <button type="button" id="closeModal" onClick={fermerModal}>Annuler</button>
          </div>
        </form>
        <p className="modal-login-link">
          Déjà inscrit ?{" "}
          <Link to="/connexion" onClick={fermerModal}>Se connecter</Link>
        </p>
      </div>

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
                <img src="/assets/images/facebook.svg" alt="" className="footer-icone" aria-hidden="true" />
                Facebook
              </a>
              <a href="https://linkedin.com" aria-label="LinkedIn" className="lien">
                <img src="/assets/images/linkedin.svg" alt="" className="footer-icone" aria-hidden="true" />
                Linkedin
              </a>
              <a href="https://gmail.com" aria-label="Gmail" className="lien">
                <img src="/assets/images/gmail.svg" alt="" className="footer-icone" aria-hidden="true" />
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

export default Accueil;

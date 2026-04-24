import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { detailFormation, inscrireFormation } from "../services/formationsApi";
import { estConnecte } from "../services/auth";
import "../styles/public.css";

function DetailFormation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formation, setFormation] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [inscriptionEnCours, setInscriptionEnCours] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const charger = async () => {
      try {
        setChargement(true);
        const donnees = await detailFormation(id);
        setFormation(donnees);
      } finally {
        setChargement(false);
      }
    };

    charger();
  }, [id]);

  const niveau = useMemo(
    () => ({ beginner: "Débutant", intermediaire: "Intermédiaire", advanced: "Avancé" }),
    [],
  );

  const gererSuivre = async () => {
    if (!estConnecte()) {
      navigate("/connexion", { replace: true });
      return;
    }

    try {
      setInscriptionEnCours(true);
      await inscrireFormation(id);
      setMessage("Inscription réussie. Redirection vers le suivi...");
      setTimeout(() => navigate(`/apprendre/${id}`), 500);
    } catch (e) {
      const texte = e.response?.data?.message || "Impossible de suivre cette formation.";
      setMessage(texte);
    } finally {
      setInscriptionEnCours(false);
    }
  };

  if (chargement) {
    return null;
  }

  if (!formation) {
    return <main className="public-page"><p className="status-banner">Formation introuvable.</p></main>;
  }

  return (
    <div className="public-page">
      <header className="public-header">
        <div className="public-brand">SkillHub</div>
        <nav className="public-nav" aria-label="Navigation détail">
          <Link to="/">Accueil</Link>
          <Link to="/formations">Formations</Link>
        </nav>
      </header>

      <main className="public-main">
        <section className="public-section detail-layout">
          <h1>{formation.titre}</h1>
          <p>{formation.description}</p>

          <div className="detail-meta">
            <p>Catégorie : {formation.category}</p>
            <p>Niveau : {niveau[formation.level] ?? "Débutant"}</p>
            <p>Formateur : {formation.formateur || "N/A"}</p>
            <p>Apprenants : {formation.apprenants ?? 0}</p>
            <p>Vues : {formation.vues ?? 0}</p>
          </div>

          <h2>Modules</h2>
          <ol className="modules-list">
            {(formation.modules || []).map((module) => (
              <li key={module.id}>
                <strong>Module {module.ordre} — {module.titre}</strong>
                <p>{module.contenu}</p>
              </li>
            ))}
          </ol>

          {message && <p className="status-banner">{message}</p>}

          <button type="button" className="public-btn" onClick={gererSuivre} disabled={inscriptionEnCours}>
            {inscriptionEnCours ? "Inscription..." : "Suivre la formation"}
          </button>
        </section>
      </main>
    </div>
  );
}

export default DetailFormation;

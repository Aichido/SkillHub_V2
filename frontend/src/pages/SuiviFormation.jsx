import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { listerFormationsApprenant } from "../services/formationsApi";
import "../styles/public.css";

function SuiviFormation() {
  const { id } = useParams();
  const [formation, setFormation] = useState(null);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    const charger = async () => {
      try {
        setChargement(true);
        const formations = await listerFormationsApprenant();
        const trouvee = formations.find((item) => String(item.id) === String(id));
        setFormation(trouvee || null);
      } finally {
        setChargement(false);
      }
    };

    charger();
  }, [id]);

  const progressionStyle = useMemo(() => ({ width: `${Math.min(100, Math.max(0, formation?.progression ?? 0))}%` }), [formation]);

  if (chargement) {
    return null;
  }

  if (!formation) {
    return (
      <main className="public-page">
        <p className="status-banner">Cette formation n'est pas dans votre espace apprenant.</p>
        <Link className="public-link-all" to="/dashboard/apprenant">Retour au dashboard</Link>
      </main>
    );
  }

  return (
    <div className="public-page">
      <header className="public-header">
        <div className="public-brand">SkillHub</div>
        <nav className="public-nav" aria-label="Navigation suivi">
          <Link to="/dashboard/apprenant">Dashboard apprenant</Link>
          <Link to="/formations">Formations</Link>
        </nav>
      </header>

      <main className="public-main">
        <section className="public-section detail-layout">
          <h1>{formation.titre}</h1>
          <p>{formation.description}</p>

          <h2>Progression</h2>
          <div className="progress-track">
            <progress className="progress-bar" value={formation.progression ?? 0} max="100" aria-label="Progression de la formation" style={progressionStyle}></progress>
          </div>
          <p>{formation.progression ?? 0}% terminé</p>

          <h2>Modules</h2>
          <ul className="modules-list">
            {(formation.modules || []).map((module) => (
              <li key={module.id}>
                <strong>Module {module.ordre} — {module.titre}</strong>
                <p>{module.contenu}</p>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}

export default SuiviFormation;

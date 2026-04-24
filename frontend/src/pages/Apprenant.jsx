import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import Summary from "../components/Summary";
import Searchbar from "../components/Searchbar";
import AtelierCard from "../components/AtelierCard";
import { desinscrireFormation, inscrireFormation, listerFormations, listerFormationsApprenant } from "../services/formationsApi";
import "../styles/layout.css";
import "../styles/Bouton.css";
import "../styles/atelierCard.css";

const IMAGES_FORMATIONS = [
  "/assets/images/learning/learning-hero.jpg",
  "/assets/images/learning/learning-laptop.jpg",
  "/assets/images/learning/learning-notes.jpg",
  "/assets/images/learning/learning-team.jpg",
];

function Apprenant() {
  const navigate = useNavigate();
  const [recherche, setRecherche] = useState("");
  const [chargement, setChargement] = useState(true);
  const [erreurChargement, setErreurChargement] = useState("");
  const [formationsSuivies, setFormationsSuivies] = useState([]);
  const [catalogue, setCatalogue] = useState([]);
  const [actionEnCours, setActionEnCours] = useState(null);

  useEffect(() => {
    const charger = async () => {
      try {
        setErreurChargement("");
        const [suivies, toutes] = await Promise.all([
          listerFormationsApprenant(),
          listerFormations(),
        ]);
        setFormationsSuivies(suivies);
        setCatalogue(toutes);
      } catch {
        setErreurChargement("Impossible de charger les formations depuis le backend.");
      } finally {
        setChargement(false);
      }
    };

    charger();
  }, []);

  const idsSuivis = useMemo(
    () => new Set(formationsSuivies.map((formation) => formation.id)),
    [formationsSuivies],
  );

  const suggestions = useMemo(
    () => catalogue.filter((formation) => !idsSuivis.has(formation.id)).slice(0, 4),
    [catalogue, idsSuivis],
  );

  const formationsFiltrees = formationsSuivies.filter((formation) =>
    formation.titre.toLowerCase().includes(recherche.toLowerCase()),
  );

  const indicateursResume = [
    { label: "Formations suivies", value: formationsSuivies.length },
    {
      label: "Progression moyenne",
      value:
        formationsSuivies.length === 0
          ? "0%"
          : `${Math.round(formationsSuivies.reduce((total, formation) => total + (formation.progression ?? 0), 0) / formationsSuivies.length)}%`,
    },
    {
      label: "Formations terminées",
      value: formationsSuivies.filter((formation) => (formation.progression ?? 0) >= 100).length,
    },
    {
      label: "À poursuivre",
      value: formationsSuivies.filter((formation) => (formation.progression ?? 0) < 100).length,
    },
  ];

  const gererSuivre = async (idFormation) => {
    try {
      setActionEnCours(`suivre-${idFormation}`);
      await inscrireFormation(idFormation);
      const [suivies, toutes] = await Promise.all([
        listerFormationsApprenant(),
        listerFormations(),
      ]);
      setFormationsSuivies(suivies);
      setCatalogue(toutes);
    } catch (e) {
      setErreurChargement(e.response?.data?.message || "Impossible de suivre cette formation.");
    } finally {
      setActionEnCours(null);
    }
  };

  const gererNePlusSuivre = async (idFormation) => {
    const confirmer = window.confirm("Voulez-vous vraiment vous désinscrire de cette formation ?");

    if (!confirmer) {
      return;
    }

    try {
      setActionEnCours(`desinscrire-${idFormation}`);
      await desinscrireFormation(idFormation);
      setFormationsSuivies((precedentes) => precedentes.filter((formation) => formation.id !== idFormation));
    } catch (e) {
      setErreurChargement(e.response?.data?.message || "Impossible de vous désinscrire.");
    } finally {
      setActionEnCours(null);
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="main-area" role="main">
        <Topbar />

        <section className="page-content" aria-labelledby="page-title">
          <div className="page-head">
            <h2 id="page-title" className="page-title">Tableau de bord apprenant</h2>
            <p className="page-subtitle">Gérez les formations auxquelles vous êtes inscrit</p>
          </div>

          <Summary items={indicateursResume} />

          <div className="toolbar" role="search">
            <Searchbar search={recherche} setSearch={setRecherche} />
            <Link to="/formations" className="btn-secondary">Découvrir des formations</Link>
          </div>

          {erreurChargement && <p className="error">{erreurChargement}</p>}

          {!chargement && !erreurChargement && (
            <>
              <div className="dashboard-panel">
                <h3>Mes formations</h3>
                {formationsFiltrees.length === 0 && <p>Aucune formation suivie pour le moment.</p>}

                <div className="atelier-list">
                  {formationsFiltrees.map((formation) => (
                    <AtelierCard
                      key={formation.id}
                      titre={formation.titre}
                      description={formation.description}
                      date={formation.date}
                      statut={formation.statut}
                      price={formation.price}
                      duration={formation.duration}
                      level={formation.level}
                      inscrits={formation.apprenants ?? 0}
                      actions={(
                        <>
                          <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => navigate(`/apprendre/${formation.id}`)}
                          >
                            Suivre
                          </button>
                          <button
                            type="button"
                            className="btn-delete"
                            onClick={() => gererNePlusSuivre(formation.id)}
                            disabled={actionEnCours === `desinscrire-${formation.id}`}
                          >
                            {actionEnCours === `desinscrire-${formation.id}` ? "Traitement..." : "Ne plus suivre"}
                          </button>
                        </>
                      )}
                    />
                  ))}
                </div>
              </div>

              <div className="dashboard-panel">
                <h3>Suggestions</h3>
                <div className="atelier-list">
                  {suggestions.map((formation, index) => (
                    <AtelierCard
                      key={formation.id}
                      image={IMAGES_FORMATIONS[index % IMAGES_FORMATIONS.length]}
                      titre={formation.titre}
                      description={formation.description}
                      date={formation.date}
                      statut={formation.statut}
                      price={formation.price}
                      duration={formation.duration}
                      level={formation.level}
                      inscrits={formation.apprenants ?? 0}
                      actions={(
                        <>
                          <button
                            type="button"
                            className="btn-create"
                            onClick={() => gererSuivre(formation.id)}
                            disabled={actionEnCours === `suivre-${formation.id}`}
                          >
                            {actionEnCours === `suivre-${formation.id}` ? "Inscription..." : "Suivre"}
                          </button>
                          <Link className="btn-secondary" to={`/formation/${formation.id}`}>Voir détail</Link>
                        </>
                      )}
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}

export default Apprenant;

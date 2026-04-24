/*
| Projet: SkillHub
| Rôle du fichier: Page dashboard formateur
| Dernière modification: 2026-03-06
*/

import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import Summary from "../components/Summary";
import Table from "../components/Table";
import Searchbar from "../components/Searchbar";
import Filtre from "../components/Filtre";
import { Link, useNavigate } from "react-router-dom";
import { creerFormation, listerMesFormations, supprimerFormation } from "../services/formationsApi";
import "../styles/layout.css";
import "../styles/Bouton.css";

function Formateur() {
  const navigate = useNavigate();
  const [recherche, setRecherche] = useState("");
  const [filtre, setFiltre] = useState("");
  const [chargement, setChargement] = useState(true);
  const [erreurChargement, setErreurChargement] = useState("");
  const [suppressionEnCours, setSuppressionEnCours] = useState(null);
  const [modalAjoutOuvert, setModalAjoutOuvert] = useState(false);
  const [creationEnCours, setCreationEnCours] = useState(false);
  const [formulaireAjout, setFormulaireAjout] = useState({
    titre: "",
    description: "",
    category: "Développement web",
    date: "",
    statut: "À venir",
    price: "",
    duration: "",
    level: "beginner",
    modules: [
      { titre: "Introduction", contenu: "Présentation générale de la formation." },
      { titre: "Concepts fondamentaux", contenu: "Notions essentielles à maîtriser." },
      { titre: "Projet pratique", contenu: "Application concrète des acquis." },
    ],
  });
  const [erreursFormulaire, setErreursFormulaire] = useState({});
  const [formations, setFormations] = useState([]);

  useEffect(() => {
    // Au chargement de la page, on récupère uniquement les formations du formateur connecté.
    const chargerFormations = async () => {
      try {
        setErreurChargement("");
        const donnees = await listerMesFormations();
        setFormations(donnees);
      } catch {
        setErreurChargement("Impossible de charger les formations depuis le backend.");
      } finally {
        setChargement(false);
      }
    };

    chargerFormations();
  }, []);

  const gererSuppression = async (idFormation) => {
    setSuppressionEnCours(idFormation);

    try {
      await supprimerFormation(idFormation);
      setFormations((precedentes) => precedentes.filter((formation) => formation.id !== idFormation));
    } catch (e) {
      const message = e.response?.data?.message || "Impossible de supprimer cette formation.";
      setErreurChargement(message);
    } finally {
      setSuppressionEnCours(null);
    }
  };

  const gererModification = (formation) => {
    navigate(`/modifier-formation/${formation.id}`);
  };

  const gererDetail = (formation) => {
    navigate(`/formation/${formation.id}`);
  };

  const ouvrirModalAjout = () => {
    setErreursFormulaire({});
    setModalAjoutOuvert(true);
  };

  const fermerModalAjout = () => {
    setModalAjoutOuvert(false);
  };

  const reinitialiserFormulaireAjout = () => {
    setFormulaireAjout({
      titre: "",
      description: "",
      category: "Développement web",
      date: "",
      statut: "À venir",
      price: "",
      duration: "",
      level: "beginner",
      modules: [
        { titre: "Introduction", contenu: "Présentation générale de la formation." },
        { titre: "Concepts fondamentaux", contenu: "Notions essentielles à maîtriser." },
        { titre: "Projet pratique", contenu: "Application concrète des acquis." },
      ],
    });
    setErreursFormulaire({});
  };

  const gererChangementFormulaireAjout = (champ, valeur) => {
    setFormulaireAjout((precedent) => ({
      ...precedent,
      [champ]: valeur,
    }));
  };

  const gererChangementModuleAjout = (index, champ, valeur) => {
    setFormulaireAjout((precedent) => ({
      ...precedent,
      modules: precedent.modules.map((module, moduleIndex) => (
        moduleIndex === index ? { ...module, [champ]: valeur } : module
      )),
    }));
  };

  const validerFormulaireAjout = () => {
    // Cette validation reste côté frontend pour donner un retour immédiat avant l'appel API.
    const erreurs = {};

    if (!formulaireAjout.titre.trim()) {
      erreurs.titre = "Le titre est obligatoire.";
    }

    if (!formulaireAjout.description.trim()) {
      erreurs.description = "La description est obligatoire.";
    }

    if (!formulaireAjout.category.trim()) {
      erreurs.category = "La catégorie est obligatoire.";
    }

    if (!formulaireAjout.date) {
      erreurs.date = "La date est obligatoire.";
    }

    if (!["À venir", "Terminé"].includes(formulaireAjout.statut)) {
      erreurs.statut = "Le statut sélectionné est invalide.";
    }

    if (!formulaireAjout.price || Number.isNaN(Number(formulaireAjout.price)) || Number(formulaireAjout.price) < 0) {
      erreurs.price = "Le prix doit être un nombre positif ou nul.";
    }

    if (!formulaireAjout.duration || Number.isNaN(Number(formulaireAjout.duration)) || Number(formulaireAjout.duration) < 1) {
      erreurs.duration = "La durée doit être un entier supérieur à 0.";
    }

    if (!["beginner", "intermediaire", "advanced"].includes(formulaireAjout.level)) {
      erreurs.level = "Le niveau sélectionné est invalide.";
    }

    if (!Array.isArray(formulaireAjout.modules) || formulaireAjout.modules.length < 3) {
      erreurs.modules = "La formation doit contenir au minimum 3 modules.";
    } else {
      formulaireAjout.modules.forEach((module, index) => {
        if (!module.titre.trim() || !module.contenu.trim()) {
          erreurs[`module-${index}`] = "Chaque module doit avoir un titre et un contenu.";
        }
      });
    }

    return erreurs;
  };

  const gererSoumissionAjout = async (evenement) => {
    evenement.preventDefault();

    const erreurs = validerFormulaireAjout();
    if (Object.keys(erreurs).length > 0) {
      setErreursFormulaire(erreurs);
      return;
    }

    setCreationEnCours(true);
    setErreursFormulaire({});

    try {
      // On convertit les champs numériques avant l'envoi pour rester aligné avec le contrat backend.
      const formationCreee = await creerFormation({
        titre: formulaireAjout.titre.trim(),
        description: formulaireAjout.description.trim(),
        category: formulaireAjout.category,
        date: formulaireAjout.date,
        statut: formulaireAjout.statut,
        price: Number(formulaireAjout.price),
        duration: Number(formulaireAjout.duration),
        level: formulaireAjout.level,
        modules: formulaireAjout.modules.map((module) => ({
          titre: module.titre.trim(),
          contenu: module.contenu.trim(),
        })),
      });

      // La nouvelle formation est injectée puis triée par date décroissante pour garder l'affichage cohérent.
      setFormations((precedentes) =>
        [formationCreee, ...precedentes].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        ),
      );
      reinitialiserFormulaireAjout();
      fermerModalAjout();
      setErreurChargement("");
    } catch (e) {
      const message = e.response?.data?.message || "Impossible d'ajouter la formation.";
      setErreursFormulaire({ general: message });
    } finally {
      setCreationEnCours(false);
    }
  };

  // Le filtrage combine recherche texte + tranche de prix.
  const formationsFiltrees = formations
    .filter(f => f.titre.toLowerCase().includes(recherche.toLowerCase()))
    .filter(f => {
      if (filtre === "") return true;
      if (filtre === "price-5000") return Number(f.price ?? 0) <= 5000;
      if (filtre === "price-5001") return Number(f.price ?? 0) > 5000;
      return true;
    });

  const indicateursResume = [
    { label: "Ateliers créés", value: formations.length },
    { label: "Ateliers à venir", value: formations.filter(f => f.statut === "À venir").length },
    { label: "Ateliers terminés", value: formations.filter(f => f.statut === "Terminé").length },
    { label: "Apprenants inscrits", value: formations.reduce((t, f) => t + (f.apprenants ?? 0), 0) },
  ];

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="main-area" role="main">
        <Topbar />

        <section className="page-content" aria-labelledby="page-title-formateur">
          <div className="page-head">
            <h2 id="page-title-formateur" className="page-title">Tableau de bord formateur</h2>
            <p className="page-subtitle">Suivez vos formations en temps réel</p>
          </div>

          <Summary items={indicateursResume} />

          <div className="toolbar">
            <Searchbar search={recherche} setSearch={setRecherche} />

            <Filtre
              value={filtre}
              onChange={setFiltre}
              options={[
                { label: "Prix ≤ 5000 Rs", value: "price-5000" },
                { label: "Prix > 5000 Rs", value: "price-5001" },
              ]}
            />

            <div className="toolbar-actions">
              <button type="button" className="btn-create" onClick={ouvrirModalAjout}>
                Ajouter une formation
              </button>
              <Link to="/mes-ateliers" className="btn-secondary">Mes ateliers</Link>
            </div>
          </div>

          {modalAjoutOuvert && (
            <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="titre-modal-ajout">
              <div className="modal-card">
                <div className="modal-header">
                  <h3 id="titre-modal-ajout">Ajouter une formation</h3>
                  <button type="button" className="btn-secondary" onClick={fermerModalAjout}>Fermer</button>
                </div>

                <form className="modal-form" onSubmit={gererSoumissionAjout} noValidate>
                  {erreursFormulaire.general && (
                    <p className="error" role="alert" aria-live="assertive">
                      {erreursFormulaire.general}
                    </p>
                  )}

                  <label>
                    Titre
                    <input
                      type="text"
                      value={formulaireAjout.titre}
                      onChange={(event) => gererChangementFormulaireAjout("titre", event.target.value)}
                    />
                    {erreursFormulaire.titre && <p className="form-error">{erreursFormulaire.titre}</p>}
                  </label>

                  <label>
                    Description
                    <textarea
                      value={formulaireAjout.description}
                      onChange={(event) => gererChangementFormulaireAjout("description", event.target.value)}
                    />
                    {erreursFormulaire.description && <p className="form-error">{erreursFormulaire.description}</p>}
                  </label>

                  <label>
                    Catégorie
                    <select
                      value={formulaireAjout.category}
                      onChange={(event) => gererChangementFormulaireAjout("category", event.target.value)}
                    >
                      <option value="Développement web">Développement web</option>
                      <option value="Data">Data</option>
                      <option value="Design">Design</option>
                      <option value="Marketing">Marketing</option>
                      <option value="DevOps">DevOps</option>
                    </select>
                    {erreursFormulaire.category && <p className="form-error">{erreursFormulaire.category}</p>}
                  </label>

                  <label>
                    Date
                    <input
                      type="date"
                      value={formulaireAjout.date}
                      onChange={(event) => gererChangementFormulaireAjout("date", event.target.value)}
                    />
                    {erreursFormulaire.date && <p className="form-error">{erreursFormulaire.date}</p>}
                  </label>

                  <label>
                    Statut
                    <select
                      value={formulaireAjout.statut}
                      onChange={(event) => gererChangementFormulaireAjout("statut", event.target.value)}
                    >
                      <option value="À venir">À venir</option>
                      <option value="Terminé">Terminé</option>
                    </select>
                    {erreursFormulaire.statut && <p className="form-error">{erreursFormulaire.statut}</p>}
                  </label>

                  <label>
                    Prix
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formulaireAjout.price}
                      onChange={(event) => gererChangementFormulaireAjout("price", event.target.value)}
                    />
                    {erreursFormulaire.price && <p className="form-error">{erreursFormulaire.price}</p>}
                  </label>

                  <label>
                    Durée (heures)
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={formulaireAjout.duration}
                      onChange={(event) => gererChangementFormulaireAjout("duration", event.target.value)}
                    />
                    {erreursFormulaire.duration && <p className="form-error">{erreursFormulaire.duration}</p>}
                  </label>

                  <label>
                    Niveau
                    <select
                      value={formulaireAjout.level}
                      onChange={(event) => gererChangementFormulaireAjout("level", event.target.value)}
                    >
                      <option value="beginner">Débutant</option>
                      <option value="intermediaire">Intermédiaire</option>
                      <option value="advanced">Avancé</option>
                    </select>
                    {erreursFormulaire.level && <p className="form-error">{erreursFormulaire.level}</p>}
                  </label>

                  <fieldset>
                    <legend>Modules de la formation</legend>
                    {formulaireAjout.modules.map((module, index) => (
                      <div key={`module-ajout-${index}`} className="module-editor-block">
                        <label>
                          Titre du module {index + 1}
                          <input
                            type="text"
                            value={module.titre}
                            onChange={(event) => gererChangementModuleAjout(index, "titre", event.target.value)}
                          />
                        </label>

                        <label>
                          Contenu du module {index + 1}
                          <textarea
                            value={module.contenu}
                            onChange={(event) => gererChangementModuleAjout(index, "contenu", event.target.value)}
                          />
                        </label>

                        {erreursFormulaire[`module-${index}`] && <p className="form-error">{erreursFormulaire[`module-${index}`]}</p>}
                      </div>
                    ))}
                    {erreursFormulaire.modules && <p className="form-error">{erreursFormulaire.modules}</p>}
                  </fieldset>

                  <div className="modal-actions">
                    <button type="submit" className="btn-create" disabled={creationEnCours}>
                      {creationEnCours ? "Ajout en cours..." : "Enregistrer"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="dashboard-panel">
            {suppressionEnCours !== null && <p className="status-banner">Suppression de la formation en cours...</p>}
            {erreurChargement && <p className="error">{erreurChargement}</p>}
            {!chargement && !erreurChargement && formationsFiltrees.length === 0 && (
              <p className="status-banner">Aucune formation ne correspond aux filtres</p>
            )}

            <Table
              formations={formationsFiltrees}
              mode="formateur"
              onView={gererDetail}
              onEdit={gererModification}
              onDelete={gererSuppression}
            />
          </div>
        </section>
      </main>
    </div>
  );
}

export default Formateur;

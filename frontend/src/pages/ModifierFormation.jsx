/*
| Projet: SkillHub
| Rôle du fichier: Page modification de formation
| Dernière modification: 2026-03-06
*/

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { detailFormation, modifierFormation } from "../services/formationsApi";
import "../styles/layout.css";
import "../styles/Bouton.css";

function ModifierFormation() {
  const { idFormation } = useParams();
  const navigate = useNavigate();
  const [chargement, setChargement] = useState(true);
  const [sauvegardeEnCours, setSauvegardeEnCours] = useState(false);
  const [erreur, setErreur] = useState("");
  const [succes, setSucces] = useState("");
  const [formulaire, setFormulaire] = useState({
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

  useEffect(() => {
    // On recharge la formation cible à chaque changement d'id dans l'URL.
    const chargerFormation = async () => {
      try {
        setErreur("");
        const formationCible = await detailFormation(idFormation);

        if (!formationCible) {
          setErreur("Formation introuvable.");
          return;
        }

        setFormulaire({
          titre: formationCible.titre ?? "",
          description: formationCible.description ?? "",
          category: formationCible.category ?? "Développement web",
          date: formationCible.date ?? "",
          statut: formationCible.statut ?? "À venir",
          price: String(formationCible.price ?? ""),
          duration: String(formationCible.duration ?? ""),
          level: formationCible.level ?? "beginner",
          modules: (formationCible.modules?.length >= 3
            ? formationCible.modules
            : [
                { titre: "Introduction", contenu: "Présentation générale de la formation." },
                { titre: "Concepts fondamentaux", contenu: "Notions essentielles à maîtriser." },
                { titre: "Projet pratique", contenu: "Application concrète des acquis." },
              ]).map((module) => ({
            titre: module.titre ?? "",
            contenu: module.contenu ?? "",
          })),
        });
      } catch {
        setErreur("Impossible de charger cette formation.");
      } finally {
        setChargement(false);
      }
    };

    chargerFormation();
  }, [idFormation]);

  const gererChangement = (champ, valeur) => {
    setFormulaire((precedent) => ({
      ...precedent,
      [champ]: valeur,
    }));
  };

  const gererChangementModule = (index, champ, valeur) => {
    setFormulaire((precedent) => ({
      ...precedent,
      modules: precedent.modules.map((module, moduleIndex) => (
        moduleIndex === index ? { ...module, [champ]: valeur } : module
      )),
    }));
  };

  // Validation minimale avant mise à jour pour garantir un payload propre côté API.
  const validerFormulaire = () => {
    if (!formulaire.titre.trim()) {
      return "Le titre est obligatoire.";
    }

    if (!formulaire.description.trim()) {
      return "La description est obligatoire.";
    }

    if (!formulaire.category.trim()) {
      return "La catégorie est obligatoire.";
    }

    if (!formulaire.date) {
      return "La date est obligatoire.";
    }

    if (!formulaire.price || Number.isNaN(Number(formulaire.price)) || Number(formulaire.price) < 0) {
      return "Le prix doit être un nombre positif ou nul.";
    }

    if (!formulaire.duration || Number.isNaN(Number(formulaire.duration)) || Number(formulaire.duration) < 1) {
      return "La durée doit être un entier supérieur à 0.";
    }

    if (!["beginner", "intermediaire", "advanced"].includes(formulaire.level)) {
      return "Le niveau sélectionné est invalide.";
    }

    if (!Array.isArray(formulaire.modules) || formulaire.modules.length < 3) {
      return "La formation doit contenir au minimum 3 modules.";
    }

    if (formulaire.modules.some((module) => !module.titre.trim() || !module.contenu.trim())) {
      return "Chaque module doit avoir un titre et un contenu.";
    }

    return "";
  };

  const gererSoumission = async (evenement) => {
    evenement.preventDefault();

    const messageErreur = validerFormulaire();
    if (messageErreur) {
      setErreur(messageErreur);
      return;
    }

    setSauvegardeEnCours(true);
    setErreur("");
    setSucces("");

    try {
      await modifierFormation(idFormation, {
        titre: formulaire.titre.trim(),
        description: formulaire.description.trim(),
        category: formulaire.category,
        date: formulaire.date,
        statut: formulaire.statut,
        price: Number(formulaire.price),
        duration: Number(formulaire.duration),
        level: formulaire.level,
        modules: formulaire.modules.map((module) => ({
          titre: module.titre.trim(),
          contenu: module.contenu.trim(),
        })),
      });

      setSucces("Formation modifiée avec succès.");
      setTimeout(() => {
        navigate("/dashboard/formateur", { replace: true });
      }, 650);
    } catch (e) {
      const message = e.response?.data?.message || "Impossible de modifier cette formation.";
      setErreur(message);
    } finally {
      setSauvegardeEnCours(false);
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="main-area" role="main">
        <Topbar />

        <section className="page-content" aria-labelledby="page-title-modif">
          <div className="page-head">
            <h2 id="page-title-modif" className="page-title">Modifier une formation</h2>
            <p className="page-subtitle">Mettez à jour les informations de la formation sélectionnée.</p>
          </div>

          {erreur && <p className="error">{erreur}</p>}

          {!chargement && !erreur && (
            <form className="form-create" onSubmit={gererSoumission} noValidate>
              <label>
                Titre
                <input
                  type="text"
                  value={formulaire.titre}
                  onChange={(event) => gererChangement("titre", event.target.value)}
                />
              </label>

              <label>
                Description
                <textarea
                  value={formulaire.description}
                  onChange={(event) => gererChangement("description", event.target.value)}
                />
              </label>

              <label>
                Catégorie
                <select
                  value={formulaire.category}
                  onChange={(event) => gererChangement("category", event.target.value)}
                >
                  <option value="Développement web">Développement web</option>
                  <option value="Data">Data</option>
                  <option value="Design">Design</option>
                  <option value="Marketing">Marketing</option>
                  <option value="DevOps">DevOps</option>
                </select>
              </label>

              <label>
                Date
                <input
                  type="date"
                  value={formulaire.date}
                  onChange={(event) => gererChangement("date", event.target.value)}
                />
              </label>

              <label>
                Statut
                <select
                  value={formulaire.statut}
                  onChange={(event) => gererChangement("statut", event.target.value)}
                >
                  <option value="À venir">À venir</option>
                  <option value="Terminé">Terminé</option>
                </select>
              </label>

              <label>
                Prix
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formulaire.price}
                  onChange={(event) => gererChangement("price", event.target.value)}
                />
              </label>

              <label>
                Durée (heures)
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={formulaire.duration}
                  onChange={(event) => gererChangement("duration", event.target.value)}
                />
              </label>

              <label>
                Niveau
                <select
                  value={formulaire.level}
                  onChange={(event) => gererChangement("level", event.target.value)}
                >
                  <option value="beginner">Débutant</option>
                  <option value="intermediaire">Intermédiaire</option>
                  <option value="advanced">Avancé</option>
                </select>
              </label>

              <fieldset>
                <legend>Modules de la formation</legend>
                {formulaire.modules.map((module, index) => (
                  <div key={`module-edit-${index}`} className="module-editor-block">
                    <label>
                      Titre du module {index + 1}
                      <input
                        type="text"
                        value={module.titre}
                        onChange={(event) => gererChangementModule(index, "titre", event.target.value)}
                      />
                    </label>

                    <label>
                      Contenu du module {index + 1}
                      <textarea
                        value={module.contenu}
                        onChange={(event) => gererChangementModule(index, "contenu", event.target.value)}
                      />
                    </label>
                  </div>
                ))}
              </fieldset>

              {succes && <p className="success">{succes}</p>}

              <div className="toolbar">
                <button type="submit" className="btn-create" disabled={sauvegardeEnCours}>
                  {sauvegardeEnCours ? "Enregistrement..." : "Enregistrer les modifications"}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => navigate("/dashboard/formateur")}
                >
                  Annuler
                </button>
              </div>
            </form>
          )}
        </section>
      </main>
    </div>
  );
}

export default ModifierFormation;

/*
| Projet: SkillHub
| Rôle du fichier: Page création de formation
| Dernière modification: 2026-03-06
*/

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { creerFormation } from "../services/formationsApi";
import "../styles/layout.css";

// Cette page sert à créer une formation avec une validation immédiate côté interface.
function CreerAtelier() {
  const [titre, setTitre] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Développement web");
  const [date, setDate] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("");
  const [level, setLevel] = useState("beginner");
  const [erreur, setErreur] = useState("");
  const [succes, setSucces] = useState("");
  const [chargement, setChargement] = useState(false);
  const navigate = useNavigate();

  // On valide d'abord localement pour afficher des messages clairs avant l'appel API.
  const gererSoumission = async (evenement) => {
    evenement.preventDefault();
    if (!titre || !description || !category || !date || !price || !duration || !level) {
      setErreur("Tous les champs sont obligatoires");
      return;
    }

    if (Number.isNaN(Number(price)) || Number(price) < 0) {
      setErreur("Le prix doit être un nombre positif ou nul.");
      return;
    }

    if (Number.isNaN(Number(duration)) || Number(duration) < 1) {
      setErreur("La durée doit être un entier supérieur à 0.");
      return;
    }

    if (!["beginner", "intermediaire", "advanced"].includes(level)) {
      setErreur("Le niveau sélectionné est invalide.");
      return;
    }

    setErreur("");
    setSucces("");
    setChargement(true);

    try {
      await creerFormation({
        titre,
        description,
        category,
        date,
        price: Number(price),
        duration: Number(duration),
        level,
      });

      setSucces("Formation ajoutée avec succès.");
      setTitre("");
      setDescription("");
      setCategory("Développement web");
      setDate("");
      setPrice("");
      setDuration("");
      setLevel("beginner");

      // On laisse un court délai pour que l'utilisateur voie le succès avant de changer de page.
      setTimeout(() => {
        navigate("/mes-ateliers");
      }, 700);
    } catch (e) {
      const message = e.response?.data?.message || "Échec de création côté serveur.";
      setErreur(message);
    } finally {
      setChargement(false);
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="main-area">
        <Topbar />

        <section className="page-content" aria-labelledby="page-title">
          <div className="page-head">
            <h2 id="page-title" className="page-title">Ajouter une formation</h2>
            <p className="page-subtitle">
              Préparez votre nouvelle formation puis publiez-la en quelques secondes.
            </p>
          </div>

          <form onSubmit={gererSoumission} className="form-create" noValidate>
            <label>
              Titre
              <input
                value={titre}
                onChange={evenement => setTitre(evenement.target.value)}
                placeholder="Ex: Atelier React avancé"
              />
            </label>

            <label>
              Description
              <textarea
                value={description}
                onChange={evenement => setDescription(evenement.target.value)}
                placeholder="Décrivez les objectifs et le contenu de la formation"
              />
            </label>

            <label>
              Catégorie
              <select value={category} onChange={evenement => setCategory(evenement.target.value)}>
                <option value="Développement web">Développement web</option>
                <option value="Data">Data</option>
                <option value="Design">Design</option>
                <option value="Marketing">Marketing</option>
                <option value="DevOps">DevOps</option>
              </select>
            </label>

            <label>
              Date
              <input type="date" value={date} onChange={evenement => setDate(evenement.target.value)} />
            </label>

            <label>
              Prix
              <input
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={evenement => setPrice(evenement.target.value)}
              />
            </label>

            <label>
              Durée (heures)
              <input
                type="number"
                min="1"
                step="1"
                value={duration}
                onChange={evenement => setDuration(evenement.target.value)}
              />
            </label>

            <label>
              Niveau
              <select value={level} onChange={evenement => setLevel(evenement.target.value)}>
                <option value="beginner">Débutant</option>
                <option value="intermediaire">Intermédiaire</option>
                <option value="advanced">Avancé</option>
              </select>
            </label>

            {erreur && <p className="error">{erreur}</p>}
            {succes && <p className="success">{succes}</p>}

            <button type="submit" className="btn-create" disabled={chargement}>
              {chargement ? "Ajout en cours..." : "Ajouter la formation"}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}

export default CreerAtelier;

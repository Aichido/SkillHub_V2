import "../styles/atelierCard.css";

//afichage des ateliers une par une
function AtelierCard({ image = null, titre, description, date, statut, inscrits, price, duration, level, actions = null }) {
  const dateAffichee = new Date(date).toLocaleDateString("fr-FR");
  const prixAffiche = `${new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(price ?? 0))} Rs`;
  const niveauxAffichage = {
    beginner: "Débutant",
    intermediaire: "Intermédiaire",
    advanced: "Avancé",
  };

  return (
    <div className="atelier-card" tabIndex="0">
      {image && (
        <div className="atelier-card-image-wrap">
          <img src={image} alt="" className="atelier-card-image" aria-hidden="true" />
        </div>
      )}

      <div className="atelier-card-header">
        <h3>{titre}</h3>
        <span className={`atelier-badge ${statut === "Terminé" ? "atelier-badge-termine" : "atelier-badge-avenir"}`}>
          {statut}
        </span>
      </div>

      <p className="atelier-description">{description || "Aucune description disponible."}</p>

      <div className="atelier-meta">
        <p><strong>Date :</strong> {dateAffichee}</p>
        <p><strong>Prix :</strong> {prixAffiche}</p>
        <p><strong>Durée :</strong> {duration ?? 0} h</p>
        <p><strong>Niveau :</strong> {niveauxAffichage[level] ?? "Débutant"}</p>
        <p><strong>Inscrits :</strong> {inscrits}</p>
      </div>

      {actions && <div className="atelier-actions">{actions}</div>}
    </div>
  );
}

export default AtelierCard;

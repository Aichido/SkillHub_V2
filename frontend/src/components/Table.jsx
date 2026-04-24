import "../styles/table.css";

//table contient les formations
function Table({ formations, onDelete, onEdit, onView, mode }) {
  const formatterPrix = new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const niveauxAffichage = {
    beginner: "Débutant",
    intermediaire: "Intermédiaire",
    advanced: "Avancé",
  };

  return (
    <table className="liste">
      <thead>
        <tr>
          <th scope="col">Cours</th>
          <th scope="col">Statut</th>
          <th scope="col">Date</th>
          <th scope="col">Prix</th>
          <th scope="col">Durée</th>
          <th scope="col">Niveau</th>
          <th scope="col">Inscrits</th>
          <th scope="col">Actions</th>
        </tr>
      </thead>

      <tbody>
        {formations.map((formation) => (
          <tr key={formation.id}>
            <th scope="row">{formation.titre}</th>
            <td>{formation.statut}</td>
            <td>{new Date(formation.date).toLocaleDateString("fr-FR")}</td>
            <td>{formatterPrix.format(Number(formation.price ?? 0))} Rs</td>
            <td>{formation.duration ?? 0} h</td>
            <td>{niveauxAffichage[formation.level] ?? "Débutant"}</td>
            <td>{formation.apprenants ?? 0}</td>
            <td>
              {mode === "formateur" ? (
                <>
                  <button type="button" className="btn-secondary" onClick={() => onView?.(formation)}>
                    Voir détail
                  </button>

                  <button type="button" className="btn-edit" onClick={() => onEdit?.(formation)}>
                    Modifier
                  </button>

                  <button
                    type="button"
                    className="btn-delete"
                    onClick={() => onDelete(formation.id)}
                  >
                    Supprimer
                  </button>
                </>
              ) : (
                <span>Aucune action</span>
              )}
            </td>
          </tr>
        ))}

        {formations.length === 0 && (
          <tr>
            <td colSpan="8">Aucune formation trouvée</td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

export default Table;

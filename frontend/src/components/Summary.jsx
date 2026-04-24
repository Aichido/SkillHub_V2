import "../styles/summary.css";

// Indicateurs du tableau de bord.
function Summary(props) {
  return (
    <div className="summary_dash">
      {/* Cards du résumé */}
      {props.items.map((item, index) => { // Parcourt les éléments du résumé.
        return (
          <div className="summary_card" key={index} tabIndex="0">
            <p>{item.value}</p> {/* Affiche la valeur de l'indicateur. */}
            <h3>{item.label}</h3>  {/* Affiche le label de l'indicateur. */}
          </div>
        );
      })}
    </div>
  );
}

export default Summary;

import "../styles/filtre.css";

// Sélecteur de filtre réutilisable pour les listes de formations.
function Filtre(props) {
  return (
    <>
      <select
        id="filter-select"
        value={props.value}
        onChange={(event) => {
          props.onChange(event.target.value); /* changement du filtre */
        }}
        className="filter_select"
      >
        {/* option par défaut */}
        <option value="">Tous</option>

        {/* options du filtre */}
        {props.options.map((option, i) => {
          return (
            <option key={i} value={option.value}>
              {option.label}
            </option>
          );
        })}
      </select>
    </>
  );
}
export default Filtre;

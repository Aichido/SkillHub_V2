import PropTypes from "prop-types";
import "../styles/filtre.css";

// Sélecteur de filtre réutilisable pour les listes de formations.
function Filtre({ value, onChange, options }) {
  return (
    <select
      id="filter-select"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="filter_select"
    >
      <option value="">Tous</option>
      {options.map((option, i) => (
        <option key={i} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

Filtre.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(PropTypes.shape({
    value: PropTypes.string,
    label: PropTypes.string,
  })).isRequired,
};

export default Filtre;

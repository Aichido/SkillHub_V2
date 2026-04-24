import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch } from "@fortawesome/free-solid-svg-icons";
import "../styles/searchbar.css";

// Barre de recherche
function Searchbar({ search, setSearch }) {
  return (
    <div className="search-container">
      <label htmlFor="search-input">
        Rechercher une formation
      </label>
      <div className="search-field">
        <FontAwesomeIcon icon={faSearch} aria-hidden="true" />
        <input
          id="search-input"
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher..."
        />
      </div>
    </div>
  );
}

Searchbar.propTypes = {
  search: PropTypes.string.isRequired,
  setSearch: PropTypes.func.isRequired,
};

export default Searchbar;

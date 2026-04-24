import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch } from "@fortawesome/free-solid-svg-icons";
import "../styles/searchbar.css";

//barre de recherche
function Searchbar({ search, setSearch }) {
  return (
    <div className="search-container">
      <label htmlFor="search-input"> {/* label */ }
        Rechercher une formation
      </label>

      <div className="search-field">{/* champ de recherche */}
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

export default Searchbar;

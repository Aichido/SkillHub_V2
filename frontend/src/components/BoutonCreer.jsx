import { Link } from "react-router-dom";
import "../styles/Bouton.css";

// Bouton de redirection vers la page d'ajout de formation.
function BoutonCreer() {
  return (
    <Link to="/creer-atelier" className="btn-create">
      Ajouter une formation
    </Link>
  );
}
export default BoutonCreer;

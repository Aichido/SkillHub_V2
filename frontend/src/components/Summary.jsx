import PropTypes from "prop-types";
import "../styles/summary.css";

// Indicateurs du tableau de bord.
function Summary({ items }) {
  return (
    <div className="summary_dash">
      {items.map((item, index) => (
        <div className="summary_card" key={index}>
          <p>{item.value}</p>
          <h3>{item.label}</h3>
        </div>
      ))}
    </div>
  );
}

Summary.propTypes = {
  items: PropTypes.arrayOf(PropTypes.shape({
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    label: PropTypes.string,
  })).isRequired,
};

export default Summary;

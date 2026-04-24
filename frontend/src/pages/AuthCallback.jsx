import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { sauvegarderSession } from "../services/auth";

function AuthCallback() {
  const location = useLocation();
  const navigate = useNavigate();
  const [message, setMessage] = useState("Veuillez patienter pendant la redirection...");

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("token");
    const id = params.get("id");
    const email = params.get("email");
    const nom = params.get("nom");
    const role = params.get("role");

    if (!token || !email || !role) {
      setMessage("Impossible de récupérer les informations de connexion.");
      return;
    }

    const utilisateur = {
      id: Number(id) || null,
      email,
      nom: nom || "",
      role,
    };

    sauvegarderSession(token, utilisateur);

    const routeTableauDeBord = role === "apprenant" ? "/dashboard/apprenant" : "/dashboard/formateur";
    navigate(routeTableauDeBord, { replace: true });
  }, [location.search, navigate]);

  return (
    <main className="connexion-page">
      <section className="connexion-carte" aria-labelledby="titre-callback">
        <h1 id="titre-callback">Connexion en cours...</h1>
        <p>{message}</p>
      </section>
    </main>
  );
}

export default AuthCallback;

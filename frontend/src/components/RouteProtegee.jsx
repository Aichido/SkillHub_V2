import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { verifierSession } from "../services/session";

function RouteProtegee({ rolesAutorises = [] }) {
  const [etatSession, setEtatSession] = useState({
    chargement: true,
    estAuthentifie: false,
    utilisateur: null,
  });

  useEffect(() => {
    let actif = true;

    const verifier = async () => {
      const resultat = await verifierSession();

      if (!actif) {
        return;
      }

      setEtatSession({
        chargement: false,
        estAuthentifie: resultat.estAuthentifie,
        utilisateur: resultat.utilisateur,
      });
    };

    verifier();

    return () => {
      actif = false;
    };
  }, []);

  if (etatSession.chargement) {
    return null;
  }

  if (!etatSession.estAuthentifie) {
    return <Navigate to="/connexion" replace />;
  }

  const utilisateur = etatSession.utilisateur;

  if (rolesAutorises.length > 0 && !rolesAutorises.includes(utilisateur.role)) {
    const routeDashboard = utilisateur?.role === "apprenant" ? "/dashboard/apprenant" : "/dashboard/formateur";
    return <Navigate to={routeDashboard} replace />;
  }

  return <Outlet />;
}

export default RouteProtegee;

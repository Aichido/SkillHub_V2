import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import DetailFormation from "./pages/DetailFormation";
import SuiviFormation from "./pages/SuiviFormation";
import Formateur from "./pages/Formateur";
import Apprenant from "./pages/Apprenant";
import CreerAtelier from "./pages/CreerAtelier";
import ModifierFormation from "./pages/ModifierFormation";
import Ateliers from "./pages/Ateliers";
import Accueil from "./pages/Accueil";
import Formations from "./pages/Formations";
import Connexion from "./pages/Connexion";
import Inscription from "./pages/Inscription";
import RouteProtegee from "./components/RouteProtegee";
import { verifierSession } from "./services/session";

// Redirige l'utilisateur vers son tableau de bord selon son rôle.
function RedirectionAccueil() {
  const [resultatSession, setResultatSession] = useState({
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

      setResultatSession({
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

  if (resultatSession.chargement) {
    return null;
  }

  if (!resultatSession.estAuthentifie) {
    return <Navigate to="/" replace />;
  }

  const routeTableauDeBord = resultatSession.utilisateur?.role === "apprenant" ? "/dashboard/apprenant" : "/dashboard/formateur";
  return <Navigate to={routeTableauDeBord} replace />;
}

function RouteInvite() {
  const [resultatSession, setResultatSession] = useState({
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

      setResultatSession({
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

  if (resultatSession.chargement) {
    return null;
  }

  if (resultatSession.estAuthentifie) {
    const routeTableauDeBord = resultatSession.utilisateur?.role === "apprenant" ? "/dashboard/apprenant" : "/dashboard/formateur";
    return <Navigate to={routeTableauDeBord} replace />;
  }

  return <Outlet />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Accueil />} />
        <Route path="/formations" element={<Formations />} />
        <Route path="/formation/:id" element={<DetailFormation />} />

        <Route element={<RouteInvite />}>
          <Route path="/connexion" element={<Connexion />} />
          <Route path="/inscription" element={<Inscription />} />
        </Route>

        <Route element={<RouteProtegee rolesAutorises={["formateur"]} />}>
          <Route path="/dashboard/formateur" element={<Formateur />} />
          <Route path="/creer-atelier" element={<CreerAtelier />} />
          <Route path="/modifier-formation/:idFormation" element={<ModifierFormation />} />
          <Route path="/formateur" element={<Navigate to="/dashboard/formateur" replace />} />
        </Route>

        <Route element={<RouteProtegee rolesAutorises={["apprenant"]} />}>
          <Route path="/dashboard/apprenant" element={<Apprenant />} />
          <Route path="/apprendre/:id" element={<SuiviFormation />} />
          <Route path="/apprenant" element={<Navigate to="/dashboard/apprenant" replace />} />
        </Route>

        <Route element={<RouteProtegee />}>
          <Route path="/mes-ateliers" element={<Ateliers />} />
        </Route>

        <Route path="/dashboard" element={<RedirectionAccueil />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

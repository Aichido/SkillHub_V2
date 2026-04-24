/*
| Projet: SkillHub
| Rôle du fichier: Client API Axios et interceptors
| Dernière modification: 2026-03-06
*/

import axios from "axios";
import { recupererJeton, supprimerSession } from "./auth";

const api = axios.create({
  baseURL: import.meta.env.VITE_AUTH_URL || "http://127.0.0.1:8001/api",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((configuration) => {
  const jeton = recupererJeton();

  if (jeton) {
    configuration.headers.Authorization = `Bearer ${jeton}`;
  }

  return configuration;
});

api.interceptors.response.use(
  (reponse) => reponse,
  (erreur) => {
    if (erreur.response?.status === 401) {
      supprimerSession();
    }

    return Promise.reject(erreur);
  },
);

export default api;

/*
| Projet: SkillHub
| Rôle du fichier: Client HTTP vers le service Inscription (port 8003)
*/

import axios from "axios";
import { recupererJeton, supprimerSession } from "./auth";

const inscriptionApi = axios.create({
  baseURL: import.meta.env.VITE_INSCRIPTION_URL || "http://127.0.0.1:8003/api",
  headers: {
    "Content-Type": "application/json",
  },
});

inscriptionApi.interceptors.request.use((configuration) => {
  const jeton = recupererJeton();
  if (jeton) {
    configuration.headers.Authorization = `Bearer ${jeton}`;
  }
  return configuration;
});

inscriptionApi.interceptors.response.use(
  (reponse) => reponse,
  (erreur) => {
    if (erreur.response?.status === 401) {
      supprimerSession();
    }
    return Promise.reject(erreur);
  },
);

export default inscriptionApi;

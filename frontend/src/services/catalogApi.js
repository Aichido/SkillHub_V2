/*
| Projet: SkillHub
| Rôle du fichier: Client HTTP vers le service Catalog (port 8002)
*/

import axios from "axios";
import { recupererJeton, supprimerSession } from "./auth";

const catalogApi = axios.create({
  baseURL: import.meta.env.VITE_CATALOG_URL || "http://127.0.0.1:8002/api",
  headers: {
    "Content-Type": "application/json",
  },
});

catalogApi.interceptors.request.use((configuration) => {
  const jeton = recupererJeton();
  if (jeton) {
    configuration.headers.Authorization = `Bearer ${jeton}`;
  }
  return configuration;
});

catalogApi.interceptors.response.use(
  (reponse) => reponse,
  (erreur) => {
    if (erreur.response?.status === 401) {
      supprimerSession();
    }
    return Promise.reject(erreur);
  },
);

export default catalogApi;

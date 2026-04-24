import axios from "axios";
import { getSecurityHeaders } from "../utils/security";
import { recupererJeton, supprimerSession } from "./auth";

const apiAuth = axios.create({
  baseURL: import.meta.env.VITE_AUTH_URL || "http://127.0.0.1:8001/api",
  headers: { "Content-Type": "application/json" },
});

apiAuth.interceptors.request.use((config) => {
  const jeton = recupererJeton();
  if (jeton) config.headers.Authorization = `Bearer ${jeton}`;
  return config;
});

apiAuth.interceptors.response.use(
  (reponse) => reponse,
  (erreur) => {
    if (erreur.response?.status === 401) supprimerSession();
    return Promise.reject(erreur);
  },
);

export async function inscrire(nom, email, motDePasse, role) {
  const data = { nom, email, mot_de_passe: motDePasse, role };
  const { headers, body } = getSecurityHeaders(data);
  const reponse = await apiAuth.post("/register", body, { headers });
  return reponse.data;
}

export async function connecter(email, motDePasse) {
  const data = { email, mot_de_passe: motDePasse };
  const { headers, body } = getSecurityHeaders(data);
  const reponse = await apiAuth.post("/login", body, { headers });
  return reponse.data;
}

export async function profilConnecte() {
  const reponse = await apiAuth.get("/profil");
  return reponse.data;
}

export async function deconnecter() {
  await apiAuth.post("/logout");
}

import {
  estConnecte,
  recupererJeton,
  recupererUtilisateur,
  sauvegarderSession,
  supprimerSession,
} from "./auth";
import { profilConnecte } from "./authApi";

export async function verifierSession() {
  if (!estConnecte()) {
    return { estAuthentifie: false, utilisateur: null };
  }

  try {
    const profil = await profilConnecte();
    const utilisateur = {
      id: profil.id,
      nom: profil.nom,
      email: profil.email,
      role: profil.role,
    };

    const utilisateurLocal = recupererUtilisateur();
    const jeton = recupererJeton();

    if (
      jeton &&
      (!utilisateurLocal ||
        utilisateurLocal.id !== utilisateur.id ||
        utilisateurLocal.email !== utilisateur.email ||
        utilisateurLocal.role !== utilisateur.role)
    ) {
      sauvegarderSession(jeton, utilisateur);
    }

    return { estAuthentifie: true, utilisateur };
  } catch {
    supprimerSession();
    return { estAuthentifie: false, utilisateur: null };
  }
}

const CLE_JETON = "jeton_auth";
const CLE_UTILISATEUR = "utilisateur_auth";

export function sauvegarderSession(token, utilisateur) {
  localStorage.setItem(CLE_JETON, token);
  localStorage.setItem(CLE_UTILISATEUR, JSON.stringify(utilisateur));
}

export function recupererJeton() {
  return localStorage.getItem(CLE_JETON);
}

export function recupererUtilisateur() {
  const utilisateur = localStorage.getItem(CLE_UTILISATEUR);

  if (!utilisateur) {
    return null;
  }

  try {
    return JSON.parse(utilisateur);
  } catch {
    return null;
  }
}

export function supprimerSession() {
  localStorage.removeItem(CLE_JETON);
  localStorage.removeItem(CLE_UTILISATEUR);
}

export function estConnecte() {
  return Boolean(recupererJeton());
}

import catalogApi from "./catalogApi";
import inscriptionApi from "./inscriptionApi";

// --- Service Catalog (port 8002) ---

export async function listerFormations(filtres = {}) {
  const reponse = await catalogApi.get("/formations", { params: filtres });
  return reponse.data;
}

export async function detailFormation(idFormation) {
  const reponse = await catalogApi.get(`/formations/${idFormation}`);
  return reponse.data;
}

export async function listerModules(idFormation) {
  const reponse = await catalogApi.get(`/formations/${idFormation}/modules`);
  return reponse.data;
}

export async function creerModule(idFormation, donnees) {
  const reponse = await catalogApi.post(
    `/formations/${idFormation}/modules`,
    donnees,
  );
  return reponse.data;
}

export async function modifierModule(idModule, donnees) {
  const reponse = await catalogApi.put(`/modules/${idModule}`, donnees);
  return reponse.data;
}

export async function supprimerModule(idModule) {
  const reponse = await catalogApi.delete(`/modules/${idModule}`);
  return reponse.data;
}

export async function listerMesFormations() {
  const reponse = await catalogApi.get("/my-formations");
  return reponse.data;
}

export async function creerFormation(donnees) {
  const reponse = await catalogApi.post("/formations", donnees);
  return reponse.data;
}

export async function modifierFormation(idFormation, donnees) {
  const reponse = await catalogApi.put(`/formations/${idFormation}`, donnees);
  return reponse.data;
}

export async function supprimerFormation(idFormation) {
  const reponse = await catalogApi.delete(`/formations/${idFormation}`);
  return reponse.data;
}

// --- Service Inscription (port 8003) ---

export async function inscrireFormation(idFormation) {
  const reponse = await inscriptionApi.post(
    `/formations/${idFormation}/inscription`,
  );
  return reponse.data;
}

export async function desinscrireFormation(idFormation) {
  const reponse = await inscriptionApi.delete(
    `/formations/${idFormation}/inscription`,
  );
  return reponse.data;
}

export async function listerFormationsApprenant() {
  const reponse = await inscriptionApi.get("/apprenant/formations");
  return reponse.data;
}

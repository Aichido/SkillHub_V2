import axios from "axios";

// Récupère les logs d'activité pour une formation
export async function getFormationLogs(formationId) {
  const { data } = await axios.get(`/api/formations/${formationId}/logs`);
  return data;
}

/** Rótulos exibidos no cabeçalho global para cada rota. Mantido separado das permissões. */
export const routeLabels: Record<string, string> = {
  "/": "Dashboard",
  "/painel": "Painel de Monitoramento",
  "/visitas": "Meu setor / Visitas",
  "/laboratorio": "Laboratório entomológico",
  "/digitacao-relatorios": "Digitação e relatórios",
  "/planejamento": "Planejamento por ciclo",
  "/territorio-conferencia": "Conferência territorial",
  "/estoque": "Estoque e insumos",
  "/saneamento": "Saneamento e ocorrências",
  "/mapas": "Mapas operacionais",
  "/hotspots": "Mapa de hotspots",
  "/priorizacao-territorial": "Priorização territorial",
  "/diagnostico": "Diagnóstico situacional",
  "/ingestao": "Ingestão de dados",
  "/simulacao": "Projeto PILOTO",
  "/usuarios": "Gestão de usuários",
  "/configuracao-municipal": "Configuração municipal",
};

export function getRouteLabel(pathname: string) {
  const exact = routeLabels[pathname];
  if (exact) return exact;
  const base = Object.keys(routeLabels).find(
    (route) => route !== "/" && pathname.startsWith(`${route}/`),
  );
  return base ? routeLabels[base] : "Dashboard";
}

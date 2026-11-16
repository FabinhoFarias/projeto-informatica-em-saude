export type DemoSyncStatus =
  | "PENDENTE"
  | "ENVIANDO"
  | "SINCRONIZADO"
  | "REJEITADO"
  | "CONFLITO";

export interface TimelineItem {
  id: string;
  date: string;
  title: string;
  description: string;
  tone: "neutral" | "warning" | "success";
}

export interface OccurrenceItem {
  id: string;
  category: string;
  severity: string;
  description: string;
  status: "REGISTRADA" | "ENCAMINHADA";
}

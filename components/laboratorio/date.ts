const formatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Recife",
});

export function formatLaboratoryDate(value: string | null) {
  return value ? formatter.format(new Date(value)) : "Ainda não registrado";
}

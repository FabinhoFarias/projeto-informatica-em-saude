export const formatNumber = (value: number) =>
  new Intl.NumberFormat("pt-BR").format(value);

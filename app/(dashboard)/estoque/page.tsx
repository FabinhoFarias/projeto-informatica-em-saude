import { InventoryWorkspace } from "@/components/gestao/inventory-workspace";
import { apiServices } from "@/app/api/services";

export const instant = false;

export default async function InventoryPage() {
  const [stock, movements, consumption] = await Promise.all([
    apiServices.stock(),
    apiServices.stockMovements(),
    apiServices.stockConsumption(),
  ]);
  const fallbackStock = [
    {
      id: "mock-larvicida-1",
      nome: "Larvicida temefós",
      unidade: "kg",
      saldo: 42,
      minimo: 15,
      consumo: 18,
    },
    {
      id: "mock-larvicida-2",
      nome: "Larvicida BTI",
      unidade: "litros",
      saldo: 28,
      minimo: 10,
      consumo: 12,
    },
    {
      id: "mock-equipamento",
      nome: "Tubitos de coleta",
      unidade: "unidades",
      saldo: 160,
      minimo: 50,
      consumo: 34,
    },
  ];
  return (
    <InventoryWorkspace
      apiData={{
        stock: Array.isArray(stock) && stock.length ? stock : fallbackStock,
        movements,
        consumption,
      }}
    />
  );
}

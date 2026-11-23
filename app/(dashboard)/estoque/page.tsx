import { InventoryWorkspace } from "@/components/gestao/inventory-workspace";
import { apiServices } from "@/app/api/services";

export const instant = false;

export default async function InventoryPage() {
  const [stock, movements, consumption] = await Promise.all([
    apiServices.stock(),
    apiServices.stockMovements(),
    apiServices.stockConsumption(),
  ]);
  return <InventoryWorkspace apiData={{ stock, movements, consumption }} />;
}

import { MapsWorkspace } from "@/components/operacao/maps-workspace";
import { apiServices } from "@/app/api/services";

export const instant = false;

export default async function MapsPage() {
  const [maps, hotspots, aceMap] = await Promise.all([
    apiServices.maps(),
    apiServices.hotspots(),
    apiServices.aceMap(),
  ]);
  return <MapsWorkspace apiData={{ maps, hotspots, aceMap }} />;
}

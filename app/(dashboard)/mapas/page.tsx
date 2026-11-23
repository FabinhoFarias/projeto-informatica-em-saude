import { MapsWorkspace } from "@/components/operacao/maps-workspace";
import { apiServices } from "@/app/api/services";

export const instant = false;

export default async function MapsPage() {
  const [maps, hotspots, aceMap, properties] = await Promise.all([
    apiServices.maps(),
    apiServices.hotspots(),
    apiServices.aceMap(),
    apiServices.properties("?limit=200"),
  ]);
  return <MapsWorkspace apiData={{ maps, hotspots, aceMap, properties }} />;
}

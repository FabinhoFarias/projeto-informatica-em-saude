import { MunicipalConfiguration } from "@/components/administracao/municipal-configuration";
import { apiServices } from "@/app/api/services";

export const instant = false;

export default async function MunicipalConfigurationPage() {
  const [configuration, permissions] = await Promise.all([
    apiServices.municipalConfiguration(),
    apiServices.permissions(),
  ]);
  return <MunicipalConfiguration apiData={{ configuration, permissions }} />;
}

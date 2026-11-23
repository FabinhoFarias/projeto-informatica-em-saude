import type { PropertyRepository } from "@/backend/domain/repositories/property-repository";
import { properties } from "@/backend/infrastructure/mock-data/properties";

export class MockPropertyRepository implements PropertyRepository {
  async list(
    filters: {
      search?: string;
      block?: number;
      assignedAceId?: string;
    } = {},
  ) {
    const search = filters.search?.trim().toLocaleLowerCase("pt-BR");
    return properties.filter((property) => {
      if (filters.block !== undefined && property.block !== filters.block)
        return false;
      if (
        filters.assignedAceId &&
        property.assignedAceId !== filters.assignedAceId
      )
        return false;
      if (!search) return true;
      return [property.number, property.street, String(property.block)].some(
        (value) => value.toLocaleLowerCase("pt-BR").includes(search),
      );
    });
  }

  async findById(id: string) {
    return properties.find((property) => property.id === id) ?? null;
  }
}

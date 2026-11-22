import type { Property } from "@/backend/domain/entities/property";
import type { PropertyRepository } from "@/backend/domain/repositories/property-repository";

const properties: Property[] = [
  {
    id: "property-1",
    number: "10",
    street: "Rua das Palmeiras",
    neighborhood: "Centro",
    sector: "Setor 02",
    block: 1,
    type: "RESIDENCIAL",
    assignedAceId: "u-4",
  },
  {
    id: "property-2",
    number: "38",
    street: "Rua das Palmeiras",
    neighborhood: "Centro",
    sector: "Setor 02",
    block: 1,
    type: "COMERCIAL",
    assignedAceId: "u-5",
  },
  {
    id: "property-3",
    number: "10",
    street: "Rua do Açude",
    neighborhood: "Nova Itaenga",
    sector: "Setor 04",
    block: 10,
    type: "PREDIO",
    assignedAceId: "u-10",
  },
];

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

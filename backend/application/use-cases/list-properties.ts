import type { PropertyRepository } from "@/backend/domain/repositories/property-repository";

export class ListPropertiesUseCase {
  constructor(private readonly properties: PropertyRepository) {}

  execute(
    filters: {
      search?: string;
      block?: number;
      assignedAceId?: string;
    } = {},
  ) {
    return this.properties.list(filters);
  }
}

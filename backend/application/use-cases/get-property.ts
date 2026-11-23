import type { PropertyRepository } from "../../domain/repositories/property-repository";

export class GetPropertyUseCase {
  constructor(private readonly properties: PropertyRepository) {}

  execute(id: string) {
    return this.properties.findById(id);
  }
}

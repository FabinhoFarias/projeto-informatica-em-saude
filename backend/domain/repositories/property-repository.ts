import type { Property } from "@/backend/domain/entities/property";

export interface PropertyRepository {
  list(filters?: {
    search?: string;
    block?: number;
    assignedAceId?: string;
  }): Promise<Property[]>;
  findById(id: string): Promise<Property | null>;
}

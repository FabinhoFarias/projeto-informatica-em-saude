"use client";

import type { SectorPropertyMock } from "@/lib/visitas/demo-data";
import { AttachmentPanel } from "./property-operation/attachment-panel";
import { OccurrencePanel } from "./property-operation/occurrence-panel";
import { StrategicPointPanel } from "./property-operation/strategic-point-panel";
import { SyncPanel } from "./property-operation/sync-panel";
import { TimelinePanel } from "./property-operation/timeline-panel";
import type { DemoSyncStatus } from "./property-operation/types";

export type { DemoSyncStatus } from "./property-operation/types";

export function PropertyOperationSupport({
  property,
  syncStatus,
  onSyncStatusChange,
}: {
  property: SectorPropertyMock;
  syncStatus: DemoSyncStatus;
  onSyncStatusChange: (status: DemoSyncStatus) => void;
}) {
  return (
    <div className="mb-4 space-y-4">
      <div className="grid items-start gap-4 xl:grid-cols-2">
        {property.ultimaVisita && <TimelinePanel property={property} />}
        <SyncPanel status={syncStatus} onStatusChange={onSyncStatusChange} />
      </div>
      <StrategicPointPanel property={property} />
      <OccurrencePanel />
      <AttachmentPanel propertyId={property.codigoLocal} />
    </div>
  );
}

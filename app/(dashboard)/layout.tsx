import type { ReactNode } from "react";
import { DashboardShell } from "@/components/plataforma/dashboard-shell";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="dashboard-layout">
      <DashboardShell>{children}</DashboardShell>
    </div>
  );
}

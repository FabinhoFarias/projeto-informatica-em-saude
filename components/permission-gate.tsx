"use client";

import type { ReactNode } from "react";
import { hasPermission, type Permission } from "@/lib/rbac";
import { useRole } from "@/components/rbac-context";

export function PermissionGate({
  permission,
  children,
  fallback = null,
}: {
  permission: Permission;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const role = useRole();
  return hasPermission(role, permission) ? children : fallback;
}

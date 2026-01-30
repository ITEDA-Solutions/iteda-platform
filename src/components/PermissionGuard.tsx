'use client'

import { usePermissions } from "@/hooks/usePermissions";
import { UserRole } from "@/lib/permissions";
import { ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface PermissionGuardProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
  requirePermission?: {
    resource: string;
    action: 'create' | 'read' | 'update' | 'delete' | 'export';
  };
  fallback?: ReactNode;
  showError?: boolean;
}

export function PermissionGuard({
  children,
  allowedRoles,
  requirePermission,
  fallback,
  showError = true,
}: PermissionGuardProps) {
  const { role, hasPermission: checkPermission } = usePermissions();

  // Check role-based access
  if (allowedRoles && role && !allowedRoles.includes(role)) {
    if (fallback) return <>{fallback}</>;
    
    if (showError) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You don't have permission to access this content. Required role: {allowedRoles.join(', ')}
          </AlertDescription>
        </Alert>
      );
    }
    
    return null;
  }

  // Check permission-based access
  if (requirePermission && role) {
    const hasAccess = checkPermission(requirePermission.resource, requirePermission.action);
    
    if (!hasAccess) {
      if (fallback) return <>{fallback}</>;
      
      if (showError) {
        return (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Access Denied</AlertTitle>
            <AlertDescription>
              You don't have permission to {requirePermission.action} {requirePermission.resource}.
            </AlertDescription>
          </Alert>
        );
      }
      
      return null;
    }
  }

  return <>{children}</>;
}

// Conditional rendering component
interface ShowIfProps {
  children: ReactNode;
  condition: boolean;
}

export function ShowIf({ children, condition }: ShowIfProps) {
  if (!condition) return null;
  return <>{children}</>;
}

// Role-specific components
export function ShowForSuperAdmin({ children }: { children: ReactNode }) {
  const { isSuperAdmin } = usePermissions();
  return <ShowIf condition={isSuperAdmin}>{children}</ShowIf>;
}

export function ShowForAdmin({ children }: { children: ReactNode }) {
  const { isAdmin } = usePermissions();
  return <ShowIf condition={isAdmin}>{children}</ShowIf>;
}

export function ShowForAdminLevel({ children }: { children: ReactNode }) {
  const { isAdminLevel } = usePermissions();
  return <ShowIf condition={isAdminLevel}>{children}</ShowIf>;
}

export function ShowForRegionalManager({ children }: { children: ReactNode }) {
  const { isRegionalManager } = usePermissions();
  return <ShowIf condition={isRegionalManager}>{children}</ShowIf>;
}

export function ShowForFieldTechnician({ children }: { children: ReactNode }) {
  const { isFieldTechnician } = usePermissions();
  return <ShowIf condition={isFieldTechnician}>{children}</ShowIf>;
}

// Export button with permission check
export function ExportButton({ children, ...props }: any) {
  const { canExportData } = usePermissions();
  
  if (!canExportData) return null;
  
  return <button {...props}>{children}</button>;
}

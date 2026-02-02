import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  UserRole, 
  hasPermission, 
  canManageUsers, 
  canViewAllDryers, 
  canExportData,
  canConfigureSystem,
  isAdminLevel,
  needsRegionalFilter,
  needsDryerAssignmentFilter,
  canUpdateDryerStatus,
  canDeleteDryers,
  canCreateDryers,
  getAllowedActions
} from '@/lib/permissions';

interface User {
  id: string;
  email: string;
  fullName?: string;
  role?: UserRole;
  region?: string;
}

export const usePermissions = () => {
  // Get current user session from Supabase
  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });

  // Get user role from user_roles table
  const { data: userRole } = useQuery({
    queryKey: ["userRole", session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null;

      const { data, error } = await supabase
        .from("user_roles")
        .select("role, region")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching user role:", error);
        return null;
      }

      return data;
    },
    enabled: !!session?.user?.id,
  });

  const user: User | null = session?.user ? {
    id: session.user.id,
    email: session.user.email || '',
    fullName: session.user.user_metadata?.full_name,
    role: userRole?.role,
    region: userRole?.region,
  } : null;
  const role = userRole?.role;

  // Permission checks
  const permissions = useMemo(() => {
    if (!role) {
      return {
        // User info
        user,
        role: null,
        isAuthenticated: false,

        // Role checks
        isSuperAdmin: false,
        isAdmin: false,
        isRegionalManager: false,
        isFieldTechnician: false,
        isAdminLevel: false,

        // Permission checks
        canManageUsers: false,
        canViewAllDryers: false,
        canExportData: false,
        canConfigureSystem: false,
        canUpdateDryerStatus: false,
        canDeleteDryers: false,
        canCreateDryers: false,

        // Filtering needs
        needsRegionalFilter: false,
        needsDryerAssignmentFilter: false,

        // Generic permission checker
        hasPermission: () => false,
        getAllowedActions: () => [],
      };
    }

    return {
      // User info
      user,
      role,
      isAuthenticated: true,

      // Role checks
      isSuperAdmin: role === 'super_admin',
      isAdmin: role === 'admin',
      isRegionalManager: role === 'regional_manager',
      isFieldTechnician: role === 'field_technician',
      isAdminLevel: isAdminLevel(role),

      // Permission checks
      canManageUsers: canManageUsers(role),
      canViewAllDryers: canViewAllDryers(role),
      canExportData: canExportData(role),
      canConfigureSystem: canConfigureSystem(role),
      canUpdateDryerStatus: canUpdateDryerStatus(role),
      canDeleteDryers: canDeleteDryers(role),
      canCreateDryers: canCreateDryers(role),

      // Filtering needs
      needsRegionalFilter: needsRegionalFilter(role),
      needsDryerAssignmentFilter: needsDryerAssignmentFilter(role),

      // Generic permission checker
      hasPermission: (resource: string, action: 'create' | 'read' | 'update' | 'delete' | 'export') => 
        hasPermission(role, resource, action),
      getAllowedActions: (resource: string) => getAllowedActions(role, resource),
    };
  }, [role, user]);

  return permissions;
};

// Hook to check if user can access a specific dryer
export const useCanAccessDryer = (dryerId?: string) => {
  const { user, role } = usePermissions();

  const { data: canAccess, isLoading } = useQuery({
    queryKey: ['canAccessDryer', user?.id, dryerId],
    queryFn: async () => {
      if (!user?.id || !dryerId) return false;

      // Super admin and admin can access all dryers
      if (role === 'super_admin' || role === 'admin') {
        return true;
      }

      // For regional managers, check if dryer is in their region
      if (role === 'regional_manager') {
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('region')
          .eq('user_id', user.id)
          .single();

        if (!roleData?.region) return false;

        const { data: dryer } = await supabase
          .from('dryers')
          .select('region_id')
          .eq('id', dryerId)
          .single();

        return dryer?.region_id === roleData.region;
      }

      // For field technicians, check if dryer is assigned to them
      if (role === 'field_technician') {
        const { data: assignment } = await supabase
          .from('dryer_assignments')
          .select('id')
          .eq('technician_id', user.id)
          .eq('dryer_id', dryerId)
          .single();

        return !!assignment;
      }

      return false;
    },
    enabled: !!user?.id && !!dryerId,
  });

  return { canAccess: canAccess ?? false, isLoading };
};

// Hook to get assigned dryers for field technicians
export const useAssignedDryers = () => {
  const { user, isFieldTechnician } = usePermissions();

  const { data: assignedDryers, isLoading } = useQuery({
    queryKey: ['assignedDryers', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('dryer_assignments')
        .select(`
          *,
          dryer:dryers(*)
        `)
        .eq('technician_id', user.id);

      if (error) {
        console.error('Error fetching assigned dryers:', error);
        return [];
      }

      return data;
    },
    enabled: !!user?.id && isFieldTechnician,
  });

  return { assignedDryers: assignedDryers ?? [], isLoading };
};

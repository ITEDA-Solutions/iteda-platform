import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useUserRole = () => {
  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });

  const { data: userRole, isLoading } = useQuery({
    queryKey: ["userRole", session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null;

      const { data, error } = await supabase
        .from("staff_roles")
        .select("role")
        .eq("staff_id", session.user.id)
        .single()
        .execute();

      if (error) {
        console.error("Error fetching user role:", error);
        return null;
      }

      return data?.role;
    },
    enabled: !!session?.user?.id,
  });

  const isAdmin = userRole === "admin" || userRole === "super_admin";

  return { userRole, isAdmin, isLoading };
};

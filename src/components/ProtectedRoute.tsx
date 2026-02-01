'use client'

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      try {
        // Check for JWT token in localStorage
        const token = localStorage.getItem('token');
        
        if (!token) {
          console.log('No token found, redirecting to auth');
          if (mounted) {
            router.push("/auth");
          }
          return;
        }

        // Verify token with API
        const res = await fetch('/api/auth/session', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (res.ok) {
          console.log('Token valid, user authenticated');
          if (mounted) {
            setIsAuthenticated(true);
            setLoading(false);
          }
        } else {
          console.log('Token invalid, redirecting to auth');
          localStorage.removeItem('token');
          if (mounted) {
            router.push("/auth");
          }
        }
      } catch (error) {
        console.error("Auth check error:", error);
        if (mounted) {
          localStorage.removeItem('token');
          router.push("/auth");
        }
      }
    };

    checkAuth();

    return () => {
      mounted = false;
    };
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;

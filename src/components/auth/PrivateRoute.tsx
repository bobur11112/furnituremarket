import { Link, Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import type { UserRole } from "@/types/user";

type PrivateRouteProps = {
  children: ReactNode;
  roles?: UserRole[];
};

export function PrivateRoute({ children, roles }: PrivateRouteProps) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading || (roles && user && !profile)) {
    return (
      <div className="container grid min-h-[70vh] place-items-center py-16">
        <Skeleton className="h-48 w-full max-w-md" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  }

  if (roles && profile && !roles.includes(profile.role)) {
    return (
      <div className="container grid min-h-[70vh] place-items-center py-16">
        <Card className="max-w-md">
          <CardContent className="grid gap-4 p-6 text-center">
            <LockKeyhole className="mx-auto h-10 w-10 text-primary" aria-hidden="true" />
            <div>
              <h1 className="text-2xl font-semibold">Seller access required</h1>
              <p className="mt-2 text-sm text-muted-foreground">Create a seller account to manage listings and orders.</p>
            </div>
            <Button asChild>
              <Link to="/auth">Go to auth</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return children;
}

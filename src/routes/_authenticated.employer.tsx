import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/employer")({ component: EmployerShell });

function EmployerShell() {
  const { role } = useAuth();
  if (role !== "employer" && role !== "admin") {
    return (
      <div className="container mx-auto px-4 py-16 max-w-md">
        <Card><CardContent className="p-8 text-center">
          <Building2 className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
          <h2 className="text-xl font-bold mb-2">Employer access required</h2>
          <p className="text-sm text-muted-foreground mb-4">Switch your account to an employer to access this area.</p>
          <Button asChild><Link to="/profile">Go to profile</Link></Button>
        </CardContent></Card>
      </div>
    );
  }
  return <Outlet />;
}
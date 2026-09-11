import { createFileRoute, Outlet, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { AIAssistantWidget } from "@/components/ai-assistant-widget";
import { Loader as Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated")({
  component: AuthLayout,
});

function AuthLayout() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!user)
    return <Navigate to="/auth" search={{ mode: "signin", redirect: window.location.pathname }} />;
  return (
    <>
      <Outlet />
      <AIAssistantWidget />
    </>
  );
}

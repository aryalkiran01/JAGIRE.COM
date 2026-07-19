import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Briefcase } from "lucide-react";

export const Route = createFileRoute("/reset-password")({ component: Reset });

function Reset() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  async function handle(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const pw = String(new FormData(e.currentTarget).get("password"));
    const { error } = await supabase.auth.updateUser({ password: pw });
    setLoading(false);
    if (error) toast.error(error.message); else { toast.success("Password updated!"); nav({ to: "/dashboard" }); }
  }
  return (
    <div className="min-h-screen flex items-center justify-center px-4 gradient-hero relative overflow-hidden">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-3xl" />
      <div className="relative w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8"><div className="h-10 w-10 rounded-xl gradient-brand flex items-center justify-center"><Briefcase className="h-5 w-5 text-primary-foreground" /></div><span className="text-2xl font-bold gradient-text">Jagire</span></Link>
        <Card className="glass"><CardHeader><CardTitle>Set new password</CardTitle></CardHeader>
        <CardContent><form onSubmit={handle} className="space-y-4">
          <div><Label>New password</Label><Input name="password" type="password" required minLength={6} /></div>
          <Button type="submit" disabled={loading} className="w-full gradient-brand text-primary-foreground">Update password</Button>
        </form></CardContent></Card>
      </div>
    </div>
  );
}
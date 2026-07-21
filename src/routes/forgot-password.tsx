import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Briefcase, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/forgot-password")({ component: Forgot });

function Forgot() {
  const [loading, setLoading] = useState(false);
  async function handle(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const email = String(new FormData(e.currentTarget).get("email"));
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else toast.success("Check your email for a reset link.");
  }
  return (
    <div className="min-h-screen flex items-center justify-center px-4 gradient-hero relative overflow-hidden">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-3xl" />
      <div className="relative w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="h-10 w-10 rounded-xl gradient-brand flex items-center justify-center">
            <Briefcase className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-2xl font-bold gradient-text">Jagire</span>
        </Link>
        <Card className="glass">
          <CardHeader>
            <CardTitle>Forgot password</CardTitle>
            <CardDescription>Enter your email and we'll send a reset link.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handle} className="space-y-4">
              <div>
                <Label>Email</Label>
                <Input name="email" type="email" required />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full gradient-brand text-primary-foreground"
              >
                Send reset link
              </Button>
              <Link
                to="/auth"
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                <ArrowLeft className="h-3 w-3" />
                Back to sign in
              </Link>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

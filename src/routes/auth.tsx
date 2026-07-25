import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Loader as Loader2 } from "lucide-react";

const authSchema = z.object({
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string().min(6, "Min 6 characters").max(72),
});

const searchSchema = z.object({
  mode: z.enum(["signin", "signup"]).optional().default("signin"),
  redirect: z.string().optional(),
  ref: z.string().optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  component: AuthPage,
});

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [tab, setTab] = useState<"signin" | "signup">(search.mode ?? "signin");

  useEffect(() => {
    if (!loading && user) navigate({ to: (search.redirect as any) ?? "/dashboard" });
  }, [user, loading, navigate, search.redirect]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 gradient-hero relative overflow-hidden">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-3xl" />
      <div className="w-full max-w-md relative">
        <Link to="/" className="flex items-center justify-center gap-2 mb-2">
          <img src="/Jagire-logo.png" alt="Jagire Logo" className="h-52 w-auto object-contain" />
        </Link>
        <Card className="glass shadow-glow">
          <CardHeader>
            <CardTitle>Welcome</CardTitle>
            <CardDescription>Sign in or create an account to get started</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
              <TabsList className="grid grid-cols-2 w-full mb-6">
                <TabsTrigger value="signin">Sign in</TabsTrigger>
                <TabsTrigger value="signup">Create account</TabsTrigger>
              </TabsList>
              <TabsContent value="signin">
                <SignInForm />
              </TabsContent>
              <TabsContent value="signup">
                <SignUpForm />
              </TabsContent>
            </Tabs>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-card px-2 text-muted-foreground">or</span>
              </div>
            </div>
            <GoogleButton />
            <p className="text-xs text-center text-muted-foreground mt-6">
              <Link to="/forgot-password" className="hover:text-foreground underline">
                Forgot password?
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SignInForm() {
  const [loading, setLoading] = useState(false);
  async function handle(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const parsed = authSchema.safeParse({ email: fd.get("email"), password: fd.get("password") });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      setLoading(false);
      return;
    }
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    setLoading(false);
    if (error) toast.error(error.message);
    else toast.success("Welcome back!");
  }
  return (
    <form onSubmit={handle} className="space-y-4">
      <div>
        <Label htmlFor="si-email">Email</Label>
        <Input id="si-email" name="email" type="email" required />
      </div>
      <div>
        <Label htmlFor="si-pw">Password</Label>
        <Input id="si-pw" name="password" type="password" required />
      </div>
      <Button
        type="submit"
        disabled={loading}
        className="w-full gradient-brand text-primary-foreground"
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Sign in
      </Button>
    </form>
  );
}

function SignUpForm() {
  const search = Route.useSearch();
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<"job_seeker" | "employer">("job_seeker");
  async function handle(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const parsed = authSchema.safeParse({ email: fd.get("email"), password: fd.get("password") });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      setLoading(false);
      return;
    }
    const fullName = String(fd.get("full_name") ?? "").trim();
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { full_name: fullName, role, referral_code: search.ref ?? null },
      },
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else toast.success("Account created! Check your email to confirm.");
  }
  return (
    <form onSubmit={handle} className="space-y-4">
      <div>
        <Label htmlFor="su-name">Full name</Label>
        <Input id="su-name" name="full_name" required maxLength={100} />
      </div>
      <div>
        <Label htmlFor="su-email">Email</Label>
        <Input id="su-email" name="email" type="email" required />
      </div>
      <div>
        <Label htmlFor="su-pw">Password</Label>
        <Input id="su-pw" name="password" type="password" required minLength={6} />
      </div>
      <div>
        <Label>I am a</Label>
        <RadioGroup
          value={role}
          onValueChange={(v) => setRole(v as any)}
          className="grid grid-cols-2 gap-2 mt-2"
        >
          <label className="flex items-center gap-2 border rounded-lg p-3 cursor-pointer hover:bg-muted has-checked:border-primary has-checked:bg-primary/5">
            <RadioGroupItem value="job_seeker" /> Job seeker
          </label>
          <label className="flex items-center gap-2 border rounded-lg p-3 cursor-pointer hover:bg-muted has-checked:border-primary has-checked:bg-primary/5">
            <RadioGroupItem value="employer" /> Employer
          </label>
        </RadioGroup>
      </div>
      <Button
        type="submit"
        disabled={loading}
        className="w-full gradient-brand text-primary-foreground"
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create account
      </Button>
    </form>
  );
}

function GoogleButton() {
  const [loading, setLoading] = useState(false);
  async function handle() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
    setLoading(false);
    if (error) toast.error(error.message);
  }
  return (
    <Button type="button" onClick={handle} disabled={loading} variant="outline" className="w-full">
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
      )}
      Continue with Google
    </Button>
  );
}

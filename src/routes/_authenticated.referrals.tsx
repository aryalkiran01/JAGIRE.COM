import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Gift, Copy, Send } from "lucide-react";

export const Route = createFileRoute("/_authenticated/referrals")({ component: Referrals });

function Referrals() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [email, setEmail] = useState("");

  const { data: profile } = useQuery({
    queryKey: ["referral-profile", user?.id],
    enabled: !!user,
    queryFn: async () =>
      (await supabase.from("profiles").select("referral_code").eq("id", user!.id).maybeSingle())
        .data,
  });
  const { data: referrals } = useQuery({
    queryKey: ["referrals", user?.id],
    enabled: !!user,
    queryFn: async () =>
      (
        await supabase
          .from("referrals")
          .select("*")
          .eq("referrer_id", user!.id)
          .order("created_at", { ascending: false })
      ).data ?? [],
  });

  const link = profile?.referral_code
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/auth?ref=${profile.referral_code}`
    : "";

  async function invite() {
    if (!user || !email || !profile?.referral_code) return;
    const { error } = await supabase.from("referrals").insert({
      referrer_id: user.id,
      referred_email: email,
      code: profile.referral_code,
      status: "pending",
    });
    if (error) return toast.error(error.message);
    toast.success("Referral logged — send them the link");
    setEmail("");
    qc.invalidateQueries({ queryKey: ["referrals"] });
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-3xl font-bold flex items-center gap-2 mb-6">
        <Gift className="h-7 w-7" />
        Refer & earn
      </h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Your referral link</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input readOnly value={link} className="font-mono text-sm" />
            <Button
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(link);
                toast.success("Copied");
              }}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Share this link. When someone signs up through it, you earn credits.
          </p>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Invite by email</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Input
            type="email"
            placeholder="friend@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button onClick={invite}>
            <Send className="h-4 w-4 mr-1" />
            Invite
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your referrals</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {referrals?.length === 0 && (
            <p className="text-sm text-muted-foreground">No referrals yet.</p>
          )}
          {referrals?.map((r) => (
            <div key={r.id} className="flex items-center justify-between p-3 border rounded">
              <div>
                <div className="font-medium">{r.referred_email}</div>
                <div className="text-xs text-muted-foreground">
                  {new Date(r.created_at).toLocaleDateString()}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={r.status === "completed" ? "default" : "secondary"}>
                  {r.status}
                </Badge>
                {r.reward_credits > 0 && (
                  <Badge className="gradient-brand text-primary-foreground">
                    +{r.reward_credits}
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

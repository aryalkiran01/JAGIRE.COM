/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  BrainCircuit,
  Send,
  Loader as Loader2,
  Lightbulb,
  Target,
  TrendingUp,
  Plus,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { careerCoach } from "@/lib/ai.service";

export const Route = createFileRoute("/_authenticated/career-coach")({
  component: CareerCoachPage,
});

type Message = {
  role: "user" | "assistant";
  content: string | CoachResponse;
  ts: string;
};

type CoachResponse = {
  advice: string;
  recommended_skills: string[];
  action_plan: string[];
  improvement_suggestions: string[];
  follow_up_questions: string[];
};

const QUICK_QUESTIONS = [
  "Which skills should I learn next?",
  "Why might I be getting rejected?",
  "What salary should I ask for?",
  "How can I switch careers?",
  "What should I improve this month?",
];

function CareerCoachPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const runCoach = useServerFn(careerCoach);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Past sessions
  const { data: sessions } = useQuery({
    queryKey: ["coach-sessions", user?.id],
    enabled: !!user,
    queryFn: async () =>
      (
        await supabase
          .from("career_coach_sessions")
          .select("id, messages, created_at, updated_at")
          .eq("user_id", user!.id)
          .order("updated_at", { ascending: false })
          .limit(10)
      ).data ?? [],
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const ask = useMutation({
    mutationFn: async (question: string) => {
      let sid = sessionId;
      if (!sid) {
        // Create a new session
        const { data: newSession, error } = await supabase
          .from("career_coach_sessions")
          .insert({ messages: [] })
          .select("id")
          .single();
        if (error) throw error;
        sid = newSession.id;
        setSessionId(sid);
      }
      const response = await runCoach({ data: { question, sessionId: sid ?? undefined } });
      return { response, sid };
    },
    onMutate: (question) => {
      setMessages((prev) => [
        ...prev,
        { role: "user", content: question, ts: new Date().toISOString() },
      ]);
      setInput("");
    },
    onSuccess: ({ response }) => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: response, ts: new Date().toISOString() },
      ]);
      qc.invalidateQueries({ queryKey: ["coach-sessions"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  function send() {
    const q = input.trim();
    if (!q || ask.isPending) return;
    ask.mutate(q);
  }

  async function loadSession(session: any) {
    setSessionId(session.id);
    const msgs = (session.messages as any[]) ?? [];
    setMessages(
      msgs.map((m: any) => ({
        role: m.role,
        content: m.content,
        ts: m.ts ?? session.created_at,
      })),
    );
  }

  function newSession() {
    setSessionId(null);
    setMessages([]);
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-xl gradient-brand flex items-center justify-center">
          <BrainCircuit className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">AI Career Coach</h1>
          <p className="text-muted-foreground text-sm">
            Personalised advice powered by your profile, resume, and application history
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Sidebar: sessions */}
        <div className="space-y-3">
          <Button onClick={newSession} variant="outline" className="w-full" size="sm">
            <Plus className="h-4 w-4 mr-1" /> New conversation
          </Button>

          {sessions && sessions.length > 0 && (
            <Card>
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" /> Past sessions
                </CardTitle>
              </CardHeader>
              <CardContent className="px-2 pb-3 space-y-1">
                {sessions.map((s: any) => {
                  const msgs = (s.messages as any[]) ?? [];
                  const first = msgs.find((m: any) => m.role === "user");
                  return (
                    <button
                      key={s.id}
                      onClick={() => loadSession(s)}
                      className={`w-full text-left text-xs px-3 py-2 rounded-md hover:bg-muted transition-colors truncate ${s.id === sessionId ? "bg-muted" : ""}`}
                    >
                      {first
                        ? String(first.content).slice(0, 50)
                        : new Date(s.created_at).toLocaleDateString()}
                    </button>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Quick questions */}
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm flex items-center gap-1">
                <Lightbulb className="h-3.5 w-3.5" /> Quick questions
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-3 space-y-1">
              {QUICK_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => {
                    setInput(q);
                    ask.mutate(q);
                  }}
                  className="w-full text-left text-xs px-3 py-2 rounded-md hover:bg-muted transition-colors"
                >
                  {q}
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Main chat */}
        <div className="lg:col-span-2 flex flex-col gap-3">
          {/* Messages */}
          <Card className="flex-1">
            <CardContent className="p-4 min-h-96 max-h-[60vh] overflow-y-auto space-y-4">
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center py-12 text-muted-foreground">
                  <BrainCircuit className="h-12 w-12 mb-3 opacity-30" />
                  <p className="text-sm max-w-xs">
                    Ask anything about your career — skills to learn, why you're getting rejected,
                    salary advice, or how to grow.
                  </p>
                </div>
              )}
              {messages.map((m, i) => (
                <MessageBubble key={i} message={m} />
              ))}
              {ask.isPending && (
                <div className="flex gap-2 items-center text-muted-foreground text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Coach is thinking…
                </div>
              )}
              <div ref={bottomRef} />
            </CardContent>
          </Card>

          {/* Input */}
          <div className="flex gap-2">
            <Textarea
              rows={2}
              className="resize-none"
              placeholder="Ask your career coach anything…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              disabled={ask.isPending}
            />
            <Button
              onClick={send}
              disabled={!input.trim() || ask.isPending}
              className="gradient-brand text-primary-foreground h-auto"
            >
              {ask.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Press Enter to send, Shift+Enter for new line.
          </p>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-2 max-w-xs text-sm">
          {String(message.content)}
        </div>
      </div>
    );
  }

  const res = message.content as CoachResponse;
  if (typeof res === "string") {
    return (
      <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3 text-sm max-w-prose">{res}</div>
    );
  }

  return (
    <div className="space-y-3 max-w-prose">
      {/* Main advice */}
      <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed">
        {res.advice}
      </div>

      {/* Skills */}
      {res.recommended_skills?.length > 0 && (
        <div className="px-1">
          <div className="flex items-center gap-1 text-xs font-semibold text-muted-foreground mb-1">
            <TrendingUp className="h-3 w-3" /> Recommended skills
          </div>
          <div className="flex flex-wrap gap-1">
            {res.recommended_skills.map((s) => (
              <Badge key={s} variant="secondary" className="text-xs">
                {s}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Action plan */}
      {res.action_plan?.length > 0 && (
        <div className="px-1">
          <div className="flex items-center gap-1 text-xs font-semibold text-muted-foreground mb-1">
            <Target className="h-3 w-3" /> Action plan
          </div>
          <ul className="space-y-1">
            {res.action_plan.map((step, i) => (
              <li key={i} className="text-xs flex gap-2">
                <span className="text-primary font-bold shrink-0">{i + 1}.</span>
                {step}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Improvements */}
      {res.improvement_suggestions?.length > 0 && (
        <div className="px-1">
          <div className="flex items-center gap-1 text-xs font-semibold text-muted-foreground mb-1">
            <Lightbulb className="h-3 w-3" /> Suggestions
          </div>
          <ul className="space-y-1">
            {res.improvement_suggestions.map((s, i) => (
              <li key={i} className="text-xs text-muted-foreground">
                • {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Follow-up questions */}
      {res.follow_up_questions?.length > 0 && (
        <div className="flex flex-wrap gap-1 px-1">
          {res.follow_up_questions.map((q) => (
            <Badge key={q} variant="outline" className="text-xs cursor-pointer hover:bg-muted">
              {q}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

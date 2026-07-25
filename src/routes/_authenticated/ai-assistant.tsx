/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Send,
  Loader as Loader2,
  Plus,
  Target,
  FileText,
  Briefcase,
  Video,
  IndianRupee,
  RefreshCw,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { aiAssistantChat } from "@/lib/ai.service";
import { useSubscription } from "@/hooks/use-subscription";
import { Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";

export const Route = createFileRoute("/_authenticated/ai-assistant")({
  component: AIAssistantPage,
});

type Msg = { role: "user" | "assistant"; content: string; ts: string };

const CAPABILITIES = [
  { icon: Target, label: "Career coaching", color: "text-blue-500" },
  { icon: FileText, label: "Resume help", color: "text-green-500" },
  { icon: Briefcase, label: "Job matching", color: "text-purple-500" },
  { icon: Video, label: "Interview prep", color: "text-orange-500" },
  { icon: IndianRupee, label: "Salary advice", color: "text-emerald-500" },
  { icon: RefreshCw, label: "Career switching", color: "text-pink-500" },
];

const QUICK_PROMPTS = [
  { icon: Target, text: "Which skills should I learn next?" },
  { icon: FileText, text: "How can I improve my resume?" },
  { icon: Briefcase, text: "Find suitable jobs for me" },
  { icon: Video, text: "Prepare me for an interview" },
  { icon: IndianRupee, text: "What salary should I ask for?" },
  { icon: RefreshCw, text: "How can I switch careers?" },
  { image: "/ai-bot.png", text: "Why am I getting rejected?" },
  { image: "/ai-bot.png", text: "What should I improve this month?" },
];

function MiniMarkdown({ text }: { text: string }) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let inCode = false;
  let codeBuffer: string[] = [];

  lines.forEach((line, i) => {
    if (line.startsWith("```")) {
      if (inCode) {
        elements.push(
          <pre
            key={`code-${i}`}
            className="bg-zinc-900 text-zinc-100 rounded-lg p-3 text-xs overflow-x-auto my-2"
          >
            <code>{codeBuffer.join("\n")}</code>
          </pre>,
        );
        codeBuffer = [];
        inCode = false;
      } else {
        inCode = true;
      }
      return;
    }
    if (inCode) {
      codeBuffer.push(line);
      return;
    }
    if (/^#{1,3}\s/.test(line)) {
      const level = line.match(/^(#+)/)?.[1].length ?? 1;
      const content = line.replace(/^#+\s/, "");
      const sizes = ["text-lg font-bold", "text-base font-bold", "text-sm font-semibold"];
      elements.push(
        <div key={i} className={`${sizes[level - 1]} mt-3 mb-1`}>
          {content}
        </div>,
      );
      return;
    }
    if (/^\s*[-*]\s/.test(line)) {
      elements.push(
        <div key={i} className="flex gap-2 text-sm ml-2 my-0.5">
          <span className="text-primary shrink-0">•</span>
          <span
            dangerouslySetInnerHTML={{ __html: inlineFormat(line.replace(/^\s*[-*]\s/, "")) }}
          />
        </div>,
      );
      return;
    }
    if (/^\s*\d+\.\s/.test(line)) {
      elements.push(
        <div
          key={i}
          className="text-sm ml-2 my-0.5"
          dangerouslySetInnerHTML={{ __html: inlineFormat(line) }}
        />,
      );
      return;
    }
    if (line.trim() === "") {
      elements.push(<div key={i} className="h-2" />);
      return;
    }
    elements.push(
      <p
        key={i}
        className="text-sm leading-relaxed my-1"
        dangerouslySetInnerHTML={{ __html: inlineFormat(line) }}
      />,
    );
  });

  return <div className="space-y-0">{elements}</div>;
}

function inlineFormat(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`(.+?)`/g, '<code class="bg-muted px-1 rounded text-xs">$1</code>');
}

function AIAssistantPage() {
  const { user, role } = useAuth();
  const qc = useQueryClient();
  const runAssistant = useServerFn(aiAssistantChat);
  const { data: subscription } = useSubscription();
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: conversations } = useQuery({
    queryKey: ["ai-conversations", user?.id],
    enabled: !!user,
    queryFn: async () =>
      (
        await supabase
          .from("ai_conversations")
          .select("id, title, updated_at")
          .eq("user_id", user!.id)
          .order("updated_at", { ascending: false })
          .limit(20)
      ).data ?? [],
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const chat = useMutation({
    mutationFn: async (message: string) => {
      return await runAssistant({
        data: { message, conversationId: conversationId ?? undefined, role: role ?? "job_seeker" },
      });
    },
    onMutate: (message) => {
      setMessages((prev) => [
        ...prev,
        { role: "user", content: message, ts: new Date().toISOString() },
      ]);
      setInput("");
    },
    onSuccess: (result) => {
      setConversationId(result.conversationId);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: result.response, ts: new Date().toISOString() },
      ]);
      qc.invalidateQueries({ queryKey: ["ai-conversations"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  function send() {
    const m = input.trim();
    if (!m || chat.isPending) return;
    chat.mutate(m);
  }

  function newChat() {
    setConversationId(null);
    setMessages([]);
  }

  async function loadConversation(conv: any) {
    setConversationId(conv.id);
    const { data: msgs } = await supabase
      .from("ai_messages")
      .select("role, content, created_at")
      .eq("conversation_id", conv.id)
      .order("created_at", { ascending: true })
      .limit(100);
    setMessages(
      (msgs ?? []).map((m: any) => ({ role: m.role, content: m.content, ts: m.created_at })),
    );
  }

  async function deleteConversation(id: string) {
    const { error } = await supabase.from("ai_conversations").delete().eq("id", id);
    if (error) return toast.error(error.message);
    if (id === conversationId) newChat();
    qc.invalidateQueries({ queryKey: ["ai-conversations"] });
    toast.success("Conversation deleted");
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="flex items-center mb-6">
        <div className=" flex items-center justify-center">
          <img src="/ai-bot.png" alt="Jagire AI" className="h-19 min-w-22" />{" "}
        </div>
        <div>
          <h1 className="text-2xl font-bold">AI Assistant</h1>
          <p className="text-muted-foreground text-sm">Your personal AI career companion</p>
        </div>
      </div>

      {!subscription?.isPremium && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950 p-4 mb-4 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-sm text-amber-800 dark:text-amber-300">
            <Lock className="h-4 w-4 shrink-0" />
            <span>
              Buy Premium to access AI-powered features. Upgrade your plan to unlock AI career
              tools.
            </span>
          </div>
          <Button asChild size="sm" className="gradient-brand text-primary-foreground">
            <Link to="/pricing">Upgrade now</Link>
          </Button>
        </div>
      )}

      <div className="grid lg:grid-cols-4 gap-4 h-[calc(100vh-200px)]">
        {/* Sidebar */}
        <div className="lg:col-span-1 flex flex-col gap-3">
          <Button onClick={newChat} variant="outline" className="w-full">
            <Plus className="h-4 w-4 mr-1" /> New conversation
          </Button>

          <Card className="flex-1 overflow-hidden">
            <CardContent className="p-2 overflow-y-auto h-full">
              {conversations && conversations.length > 0 ? (
                <div className="space-y-1">
                  {conversations.map((c: any) => (
                    <div
                      key={c.id}
                      className={`group flex items-center gap-2 rounded-md px-2 py-1.5 cursor-pointer transition-colors ${
                        c.id === conversationId ? "bg-muted" : "hover:bg-muted/50"
                      }`}
                      onClick={() => loadConversation(c)}
                    >
                      <Clock className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="text-xs truncate flex-1">{c.title}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteConversation(c.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all text-xs shrink-0"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-4">
                  No conversations yet
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Chat area */}
        <div className="lg:col-span-3 flex flex-col">
          <Card className="flex-1 flex flex-col overflow-hidden">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center py-8">
                  <div className="h-20 w-20 flex items-center justify-center mb-4 animate-ai-float">
                    <img
                      src="/ai-bot.png"
                      alt="Jagire AI"
                      className="h-20 w-20 object-contain drop-shadow-lg"
                    />
                  </div>
                  <h2 className="text-xl font-bold mb-2">
                    Hi {user?.user_metadata?.full_name ?? "there"}!
                  </h2>
                  <p className="text-sm text-muted-foreground mb-6 max-w-md">
                    I'm your AI career companion. I know your profile, resume, applications, and the
                    job market. Ask me anything — I'm here to help you grow.
                  </p>

                  {/* Capabilities */}
                  <div className="flex flex-wrap justify-center gap-2 mb-6 max-w-lg">
                    {CAPABILITIES.map((c) => (
                      <Badge key={c.label} variant="outline" className="text-xs">
                        <c.icon className={`h-3 w-3 mr-1 ${c.color}`} />
                        {c.label}
                      </Badge>
                    ))}
                  </div>

                  {/* Quick prompts */}
                  <div className="grid grid-cols-2 gap-2 w-full max-w-md">
                    {QUICK_PROMPTS.map((p) => (
                      <button
                        key={p.text}
                        onClick={() => chat.mutate(p.text)}
                        disabled={chat.isPending}
                        className="text-left text-xs px-3 py-2.5 rounded-lg border hover:bg-muted transition-colors disabled:opacity-50 flex items-center gap-2"
                      >
                        {p.icon ? (
                          <p.icon className="h-3.5 w-3.5 text-primary shrink-0" />
                        ) : p.image ? (
                          <img
                            src={p.image}
                            alt={p.text}
                            className="h-3.5 w-3.5 rounded-sm object-cover shrink-0"
                          />
                        ) : null}
                        <span className="truncate">{p.text}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m, i) => (
                <MessageRow key={i} message={m} userName={user?.user_metadata?.full_name} />
              ))}

              {chat.isPending && (
                <div className="flex gap-2 items-center text-muted-foreground">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="text-xs">
                      <img
                        src="/ai-bot.png"
                        alt="Jagire AI"
                        className="h-8 w-8 object-contain animate-ai-float"
                      />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex gap-1">
                    <span
                      className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    />
                    <span
                      className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    />
                    <span
                      className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="border-t p-3">
              <div className="flex gap-2 items-end">
                <Textarea
                  rows={1}
                  className="resize-none min-h-10 max-h-32 text-sm"
                  placeholder="Ask your AI assistant anything about your career…"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  disabled={chat.isPending}
                />
                <Button
                  onClick={send}
                  disabled={!input.trim() || chat.isPending}
                  size="icon"
                  className="gradient-brand text-primary-foreground h-10 w-10 shrink-0"
                >
                  {chat.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground text-center mt-1.5">
                Enter to send · Shift+Enter for new line · AI can make mistakes
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function MessageRow({ message, userName }: { message: Msg; userName?: string }) {
  const isUser = message.role === "user";
  const initials = (userName ?? "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className={`flex gap-2 ${isUser ? "flex-row-reverse" : ""}`}>
      <Avatar className="h-7 w-7 shrink-0">
        {isUser ? (
          <AvatarFallback className="text-xs bg-muted">{initials}</AvatarFallback>
        ) : (
          <AvatarFallback className="gradient-brand text-primary-foreground text-xs">
            <Sparkles className="h-3 w-3" />
          </AvatarFallback>
        )}
      </Avatar>
      <div
        className={`rounded-2xl px-3 py-2 max-w-[85%] ${
          isUser ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-muted rounded-tl-sm"
        }`}
      >
        {isUser ? (
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        ) : (
          <MiniMarkdown text={message.content} />
        )}
      </div>
    </div>
  );
}

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
  Sparkles,
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
  let key = 0;
  let inCodeBlock = false;
  let codeLines: string[] = [];
  let codeLanguage = "";

  const processLine = (line: string, index: number) => {
    // Code block handling
    if (line.trim().startsWith("```")) {
      if (inCodeBlock) {
        // End code block
        elements.push(
          <div key={key++} className="my-3 rounded-lg overflow-hidden">
            {codeLanguage && (
              <div className="bg-zinc-800 text-zinc-400 text-xs px-4 py-1.5 font-mono">
                {codeLanguage}
              </div>
            )}
            <pre className="bg-zinc-950 text-zinc-100 p-4 text-xs overflow-x-auto">
              <code>{codeLines.join("\n")}</code>
            </pre>
          </div>,
        );
        codeLines = [];
        codeLanguage = "";
        inCodeBlock = false;
      } else {
        // Start code block
        inCodeBlock = true;
        codeLanguage = line.trim().replace("```", "").trim();
      }
      return;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      return;
    }

    // Empty line
    if (!line.trim()) {
      elements.push(<div key={key++} className="h-3" />);
      return;
    }

    // Headers
    if (line.startsWith("#### ")) {
      elements.push(
        <h4 key={key++} className="text-sm font-semibold mt-4 mb-2 text-muted-foreground">
          {formatInline(line.replace("#### ", ""))}
        </h4>,
      );
      return;
    }

    if (line.startsWith("### ")) {
      elements.push(
        <h3 key={key++} className="text-base font-bold mt-4 mb-2">
          {formatInline(line.replace("### ", ""))}
        </h3>,
      );
      return;
    }

    if (line.startsWith("## ")) {
      elements.push(
        <h2 key={key++} className="text-lg font-bold mt-5 mb-2">
          {formatInline(line.replace("## ", ""))}
        </h2>,
      );
      return;
    }

    if (line.startsWith("# ")) {
      elements.push(
        <h1 key={key++} className="text-xl font-bold mt-6 mb-3">
          {formatInline(line.replace("# ", ""))}
        </h1>,
      );
      return;
    }

    // Horizontal rule
    if (/^[-*_]{3,}\s*$/.test(line.trim())) {
      elements.push(<hr key={key++} className="my-4 border-border" />);
      return;
    }

    // Blockquote
    if (line.startsWith("> ")) {
      elements.push(
        <blockquote
          key={key++}
          className="border-l-2 border-primary/30 pl-3 my-2 italic text-muted-foreground"
        >
          {formatInline(line.replace(/^>\s*/, ""))}
        </blockquote>,
      );
      return;
    }

    // Unordered list with indentation
    const ulMatch = line.match(/^(\s*)[-*•]\s+(.+)/);
    if (ulMatch) {
      const indent = Math.floor(ulMatch[1].length / 2); // 2 spaces per indent level
      elements.push(
        <div
          key={key++}
          className="flex gap-2 text-sm"
          style={{ paddingLeft: `${indent * 1.5}rem` }}
        >
          <span className="text-primary shrink-0 select-none">•</span>
          <span className="flex-1">{formatInline(ulMatch[2])}</span>
        </div>,
      );
      return;
    }

    // Ordered list
    const olMatch = line.match(/^(\s*)(\d+)\.\s+(.+)/);
    if (olMatch) {
      const indent = Math.floor(olMatch[1].length / 2);
      elements.push(
        <div
          key={key++}
          className="flex gap-2 text-sm"
          style={{ paddingLeft: `${indent * 1.5}rem` }}
        >
          <span className="text-muted-foreground shrink-0 min-w-[1.25rem]">{olMatch[2]}.</span>
          <span className="flex-1">{formatInline(olMatch[3])}</span>
        </div>,
      );
      return;
    }

    // Bold text that looks like a heading
    if (/^\*\*.+\*\*:?\s*$/.test(line.trim())) {
      elements.push(
        <div key={key++} className="font-semibold text-sm mt-3 mb-1">
          {formatInline(line.trim())}
        </div>,
      );
      return;
    }

    // Regular paragraph
    elements.push(
      <p key={key++} className="text-sm leading-relaxed">
        {formatInline(line)}
      </p>,
    );
  };

  lines.forEach((line, i) => processLine(line, i));

  // Close any open code block at end
  if (inCodeBlock) {
    elements.push(
      <pre
        key={key++}
        className="bg-zinc-950 text-zinc-100 rounded-lg p-3 text-xs overflow-x-auto my-2"
      >
        <code>{codeLines.join("\n")}</code>
      </pre>,
    );
  }

  return <div className="space-y-0">{elements}</div>;
}

function formatInline(text: string): React.ReactNode {
  // Process inline markdown: bold, italic, code, links
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let i = 0;

  while (remaining.length > 0) {
    // Bold
    const boldMatch = remaining.match(/^\*\*(.+?)\*\*/);
    if (boldMatch) {
      parts.push(<strong key={i++}>{boldMatch[1]}</strong>);
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }

    // Code
    const codeMatch = remaining.match(/^`(.+?)`/);
    if (codeMatch) {
      parts.push(
        <code key={i++} className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">
          {codeMatch[1]}
        </code>,
      );
      remaining = remaining.slice(codeMatch[0].length);
      continue;
    }

    // Link
    const linkMatch = remaining.match(/^\[(.+?)\]\((.+?)\)/);
    if (linkMatch) {
      parts.push(
        <a
          key={i++}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline underline-offset-2 hover:text-primary/80"
        >
          {linkMatch[1]}
        </a>,
      );
      remaining = remaining.slice(linkMatch[0].length);
      continue;
    }

    // Italic
    const italicMatch = remaining.match(/^\*(.+?)\*/);
    if (italicMatch) {
      parts.push(<em key={i++}>{italicMatch[1]}</em>);
      remaining = remaining.slice(italicMatch[0].length);
      continue;
    }

    // Plain text (take until next special char)
    const nextSpecial = remaining.search(/[*`[]/);
    if (nextSpecial === -1) {
      parts.push(<span key={i++}>{remaining}</span>);
      break;
    }

    if (nextSpecial > 0) {
      parts.push(<span key={i++}>{remaining.slice(0, nextSpecial)}</span>);
    }
    remaining = remaining.slice(nextSpecial);
  }

  return <>{parts}</>;
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

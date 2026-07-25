/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  BrainCircuit,
  Send,
  Loader as Loader2,
  Plus,
  MessageSquare,
  X,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { aiAssistantChat } from "@/lib/ai.service";

type Msg = { role: "user" | "assistant"; content: string; ts: string };

const QUICK_PROMPTS = [
  { icon: "🎯", text: "Which skills should I learn next?" },
  { icon: "📄", text: "Improve my resume" },
  { icon: "💼", text: "Find suitable jobs for me" },
  { icon: "🎤", text: "Prepare me for an interview" },
  { icon: "💰", text: "What salary should I ask for?" },
  { icon: "🔄", text: "How can I switch careers?" },
];

function MiniMarkdown({ text }: { text: string }) {
  // Lightweight markdown: headings, bold, bullets, code blocks
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
      const sizes = ["text-base font-bold", "text-sm font-bold", "text-sm font-semibold"];
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

export function AIAssistantWidget() {
  const { user, role } = useAuth();
  const qc = useQueryClient();
  const runAssistant = useServerFn(aiAssistantChat);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: conversations } = useQuery({
    queryKey: ["ai-conversations", user?.id],
    enabled: !!user && open,
    queryFn: async () =>
      (
        await supabase
          .from("ai_conversations")
          .select("id, title, updated_at")
          .eq("user_id", user!.id)
          .order("updated_at", { ascending: false })
          .limit(15)
      ).data ?? [],
  });

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const chat = useMutation({
    mutationFn: async (message: string) => {
      const result = await runAssistant({
        data: {
          message,
          conversationId: conversationId ?? undefined,
          role: role ?? "job_seeker",
        },
      });
      return result;
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

  if (!user) return null;

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full gradient-brand shadow-glow flex items-center justify-center hover:scale-110 transition-transform group"
        aria-label="Open AI Assistant"
      >
        <BrainCircuit className="h-7 w-7 text-primary-foreground" />
        <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-accent animate-pulse" />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
          <SheetHeader className="px-4 py-3 border-b flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-lg gradient-brand flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <SheetTitle className="text-base text-left">AI Assistant</SheetTitle>
                <p className="text-xs text-muted-foreground">Your career companion</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </SheetHeader>

          {/* Conversation switcher */}
          {conversations && conversations.length > 0 && (
            <div className="px-3 py-2 border-b flex items-center gap-2 overflow-x-auto">
              <Button
                size="sm"
                variant="outline"
                onClick={newChat}
                className="shrink-0 h-7 text-xs"
              >
                <Plus className="h-3 w-3 mr-1" /> New
              </Button>
              {conversations.map((c: any) => (
                <button
                  key={c.id}
                  onClick={() => loadConversation(c)}
                  className={`shrink-0 text-xs px-2 py-1 rounded-md transition-colors max-w-28 truncate ${
                    c.id === conversationId
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  }`}
                >
                  {c.title}
                </button>
              ))}
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center py-8">
                <BrainCircuit className="h-12 w-12 mb-3 text-primary/30" />
                <p className="text-sm font-medium mb-1">
                  Hi {user.user_metadata?.full_name ?? "there"}!
                </p>
                <p className="text-xs text-muted-foreground mb-4 max-w-xs">
                  I'm your AI career companion. Ask me anything about your career, resume, jobs,
                  interviews, or salary.
                </p>
                <div className="grid grid-cols-1 gap-1.5 w-full max-w-xs">
                  {QUICK_PROMPTS.map((p) => (
                    <button
                      key={p.text}
                      onClick={() => chat.mutate(p.text)}
                      disabled={chat.isPending}
                      className="text-left text-xs px-3 py-2 rounded-lg border hover:bg-muted transition-colors disabled:opacity-50"
                    >
                      <span className="mr-1.5">{p.icon}</span>
                      {p.text}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <MessageRow key={i} message={m} userName={user.user_metadata?.full_name} />
            ))}

            {chat.isPending && (
              <div className="flex gap-2 items-center text-muted-foreground">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="gradient-brand text-primary-foreground text-xs">
                    <Sparkles className="h-3 w-3" />
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
          <div className="border-t p-3 space-y-2">
            <div className="flex gap-2 items-end">
              <Textarea
                rows={1}
                className="resize-none min-h-10 max-h-32 text-sm"
                placeholder="Ask your AI assistant…"
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
            <p className="text-[10px] text-muted-foreground text-center">
              AI can make mistakes. Verify important info.
            </p>
          </div>
        </SheetContent>
      </Sheet>
    </>
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

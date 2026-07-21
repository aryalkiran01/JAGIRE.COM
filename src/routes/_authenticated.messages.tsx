import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";

type ChatSearch = { chat?: string; with?: string };

export const Route = createFileRoute("/_authenticated/messages")({
  component: Messages,
  validateSearch: (s: Record<string, unknown>): ChatSearch => ({
    chat: typeof s.chat === "string" ? s.chat : undefined,
    with: typeof s.with === "string" ? s.with : undefined,
  }),
});

function Messages() {
  const { user } = useAuth();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const qc = useQueryClient();
  const [activeChat, setActiveChat] = useState<string | null>(search.chat ?? null);
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  // If ?with=<userId>, ensure a chat exists then select it
  useEffect(() => {
    if (!user || !search.with || search.with === user.id) return;
    (async () => {
      const [a, b] = [user.id, search.with!].sort();
      const existing = await supabase
        .from("chats")
        .select("id")
        .eq("user_a", a)
        .eq("user_b", b)
        .maybeSingle();
      let chatId = existing.data?.id;
      if (!chatId) {
        const inserted = await supabase
          .from("chats")
          .insert({ user_a: a, user_b: b })
          .select("id")
          .single();
        if (inserted.error) return toast.error(inserted.error.message);
        chatId = inserted.data.id;
      }
      setActiveChat(chatId!);
      navigate({ search: { chat: chatId } });
      qc.invalidateQueries({ queryKey: ["chats"] });
    })();
  }, [user, search.with, navigate, qc]);

  const { data: chats } = useQuery({
    queryKey: ["chats", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("chats")
        .select("*")
        .or(`user_a.eq.${user!.id},user_b.eq.${user!.id}`)
        .order("last_message_at", { ascending: false, nullsFirst: false });
      const ids = Array.from(
        new Set((data ?? []).map((c) => (c.user_a === user!.id ? c.user_b : c.user_a))),
      );
      const profiles = ids.length
        ? ((
            await supabase.from("profiles").select("id, full_name, email, avatar_url").in("id", ids)
          ).data ?? [])
        : [];
      const pmap = new Map(profiles.map((p) => [p.id, p]));
      return (data ?? []).map((c) => {
        const otherId = c.user_a === user!.id ? c.user_b : c.user_a;
        return { ...c, other: pmap.get(otherId) };
      });
    },
  });

  const { data: messages } = useQuery({
    queryKey: ["msgs", activeChat],
    enabled: !!activeChat,
    queryFn: async () =>
      (await supabase.from("messages").select("*").eq("chat_id", activeChat!).order("created_at"))
        .data ?? [],
  });

  // Realtime subscription for active chat
  useEffect(() => {
    if (!activeChat) return;
    const channel = supabase
      .channel(`chat:${activeChat}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `chat_id=eq.${activeChat}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: ["msgs", activeChat] });
          qc.invalidateQueries({ queryKey: ["chats"] });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeChat, qc]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    if (!user || !activeChat || !text.trim()) return;
    const body = text.trim();
    setText("");
    const { error } = await supabase
      .from("messages")
      .insert({ chat_id: activeChat, sender_id: user.id, body });
    if (error) {
      toast.error(error.message);
      setText(body);
      return;
    }
    await supabase
      .from("chats")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", activeChat);
    qc.invalidateQueries({ queryKey: ["msgs", activeChat] });
    qc.invalidateQueries({ queryKey: ["chats"] });
  }

  const active = chats?.find((c) => c.id === activeChat);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Messages</h1>
      <div className="grid md:grid-cols-[300px_1fr] gap-4 h-[70vh]">
        <Card className="overflow-hidden">
          <CardContent className="p-0 h-full overflow-y-auto">
            {chats?.length ? (
              chats.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setActiveChat(c.id);
                    navigate({ search: { chat: c.id } });
                  }}
                  className={`w-full text-left p-3 border-b hover:bg-muted transition ${activeChat === c.id ? "bg-muted" : ""}`}
                >
                  <div className="font-medium truncate">
                    {c.other?.full_name ?? c.other?.email ?? "User"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {c.last_message_at ? new Date(c.last_message_at).toLocaleDateString() : "New"}
                  </div>
                </button>
              ))
            ) : (
              <div className="p-6 text-center text-sm text-muted-foreground">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-40" />
                No conversations yet.
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="flex flex-col">
          {activeChat ? (
            <>
              <div className="border-b p-3 font-semibold">
                {active?.other?.full_name ?? active?.other?.email ?? "Conversation"}
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {messages?.map((m) => (
                  <div
                    key={m.id}
                    className={`max-w-[70%] rounded-lg px-3 py-2 text-sm ${
                      m.sender_id === user?.id
                        ? "ml-auto gradient-brand text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    {m.body}
                    <div className="text-[10px] opacity-70 mt-1">
                      {new Date(m.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
              <div className="border-t p-3 flex gap-2">
                <Input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") send();
                  }}
                  placeholder="Type a message…"
                />
                <Button onClick={send} className="gradient-brand text-primary-foreground">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-40" />
                Select a conversation
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  Send,
  Loader2,
  Search,
  ArrowLeft,
  Smile,
  X,
  Check,
  Phone,
  Video,
  Info,
  Plus,
  Paperclip,
  Mic,
} from "lucide-react";
import { toast } from "sonner";
import { format, isToday, isYesterday } from "date-fns";

type ChatSearch = {
  chat?: string;
  with?: string;
};

type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
};

type ChatWithDetails = {
  id: string;
  user_a: string;
  user_b: string;
  last_message_at: string | null;
  other?: Profile;
  lastMessage?: Message;
  unreadCount: number;
};

type Message = {
  id: string;
  chat_id: string;
  sender_id: string;
  body: string | null;
  created_at: string | null;
};

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
  const [searchQuery, setSearchQuery] = useState("");
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
  const [searchMode, setSearchMode] = useState<"conversations" | "messages">("conversations");

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastMessageCountRef = useRef<number>(0);

  // Create or open chat from ?with=userId
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
          .insert({
            user_a: a,
            user_b: b,
          })
          .select("id")
          .single();

        if (inserted.error) {
          toast.error(inserted.error.message);
          return;
        }

        chatId = inserted.data.id;
      }

      setActiveChat(chatId);
      navigate({ search: { chat: chatId } });
      qc.invalidateQueries({ queryKey: ["chats"] });
    })();
  }, [user, search.with, navigate, qc]);

  // Get conversations
  const { data: chats, isLoading: chatsLoading } = useQuery({
    queryKey: ["chats", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<ChatWithDetails[]> => {
      const { data: chatData, error: chatError } = await supabase
        .from("chats")
        .select("*")
        .or(`user_a.eq.${user!.id},user_b.eq.${user!.id}`)
        .order("last_message_at", { ascending: false, nullsFirst: false });

      if (chatError) throw chatError;
      if (!chatData || chatData.length === 0) return [];

      // Get all unique user IDs
      const ids = Array.from(
        new Set(
          chatData
            .map((chat) => (chat.user_a === user!.id ? chat.user_b : chat.user_a))
            .filter((id): id is string => !!id),
        ),
      );

      // Fetch profiles
      let profileMap = new Map<string, Profile>();
      if (ids.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, full_name, email, avatar_url")
          .in("id", ids);

        profileMap = new Map((profilesData ?? []).map((profile: Profile) => [profile.id, profile]));
      }

      // Get ALL messages for search functionality
      const chatIds = chatData.map((chat) => chat.id);
      const lastMessageMap = new Map<string, Message>();
      let allMessages: Message[] = [];

      if (chatIds.length > 0) {
        // Get last messages for preview
        const { data: lastMessagesData } = await supabase
          .from("messages")
          .select("id, chat_id, body, sender_id, created_at")
          .in("chat_id", chatIds)
          .order("created_at", { ascending: false })
          .limit(chatIds.length);

        lastMessagesData?.forEach((msg) => {
          if (msg.chat_id && !lastMessageMap.has(msg.chat_id)) {
            lastMessageMap.set(msg.chat_id, {
              id: msg.id,
              chat_id: msg.chat_id,
              sender_id: msg.sender_id,
              body: msg.body || "",
              created_at: msg.created_at,
            });
          }
        });

        // Get all messages for search (limit to recent 50 per chat for performance)
        const { data: allMessagesData } = await supabase
          .from("messages")
          .select("id, chat_id, body, sender_id, created_at")
          .in("chat_id", chatIds)
          .order("created_at", { ascending: false })
          .limit(100);

        allMessages = (allMessagesData ?? []) as Message[];
      }

      // Build the result with all messages for search
      const result = chatData.map((chat) => {
        const otherId = chat.user_a === user!.id ? chat.user_b : chat.user_a;
        const otherProfile = profileMap.get(otherId ?? "");
        const chatMessages = allMessages.filter((msg) => msg.chat_id === chat.id);

        return {
          ...chat,
          user_a: chat.user_a || "",
          user_b: chat.user_b || "",
          other: otherProfile,
          lastMessage: lastMessageMap.get(chat.id),
          unreadCount: 0,
          // Store all messages for search
          messages: chatMessages,
        } as ChatWithDetails & { messages?: Message[] };
      });

      return result;
    },
  });

  // Get messages
  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ["msgs", activeChat],
    enabled: !!activeChat,
    queryFn: async (): Promise<Message[]> => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("chat_id", activeChat!)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return (data ?? []) as Message[];
    },
  });

  // Realtime messages
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

  // Auto scroll
  const scrollToBottom = useCallback((smooth = true) => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({
        behavior: smooth ? "smooth" : "auto",
        block: "end",
      });
    }
  }, []);

  useEffect(() => {
    if (messages && messages.length > 0) {
      const newMessageCount = messages.length;
      if (autoScrollEnabled && newMessageCount > lastMessageCountRef.current) {
        scrollToBottom(true);
      } else if (newMessageCount === lastMessageCountRef.current && newMessageCount > 0) {
        scrollToBottom(false);
      }
      lastMessageCountRef.current = newMessageCount;
    }
  }, [messages, autoScrollEnabled, scrollToBottom]);

  const handleScroll = useCallback(() => {
    const scrollArea = scrollAreaRef.current;
    if (scrollArea) {
      const { scrollTop, scrollHeight, clientHeight } = scrollArea;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setAutoScrollEnabled(isNearBottom);
    }
  }, []);

  const handleTyping = () => {
    if (!isTyping) setIsTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 1000);
  };

  async function send() {
    if (!user || !activeChat || !text.trim() || sending) return;
    const body = text.trim();
    setSending(true);
    setText("");

    try {
      const { error } = await supabase.from("messages").insert({
        chat_id: activeChat,
        sender_id: user.id,
        body,
      });

      if (error) throw error;

      await supabase
        .from("chats")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", activeChat);

      qc.invalidateQueries({ queryKey: ["msgs", activeChat] });
      qc.invalidateQueries({ queryKey: ["chats"] });
      setTimeout(() => scrollToBottom(true), 100);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to send message";
      toast.error(message);
      setText(body);
    } finally {
      setSending(false);
    }
  }

  const active = chats?.find((chat) => chat.id === activeChat);

  // Enhanced search that includes messages
  const filteredChats =
    chats?.filter((chat) => {
      const searchTerm = searchQuery.toLowerCase().trim();

      // If no search query, return all chats
      if (!searchTerm) return true;

      // Search in profile fields
      const fullName = chat.other?.full_name?.toLowerCase() ?? "";
      const email = chat.other?.email?.toLowerCase() ?? "";

      // Search in messages
      const chatWithMessages = chat as ChatWithDetails & { messages?: Message[] };
      const messageMatch =
        chatWithMessages.messages?.some((msg) => msg.body?.toLowerCase().includes(searchTerm)) ??
        false;

      // Search in last message
      const lastMessageMatch = chat.lastMessage?.body?.toLowerCase().includes(searchTerm) ?? false;

      // Combined search
      return (
        fullName.includes(searchTerm) ||
        email.includes(searchTerm) ||
        messageMatch ||
        lastMessageMatch
      );
    }) ?? [];

  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  const formatMessageTime = (date?: string | null) => {
    if (!date) return "";
    const msgDate = new Date(date);
    if (isToday(msgDate)) return format(msgDate, "HH:mm");
    if (isYesterday(msgDate)) return "Yesterday";
    return format(msgDate, "MMM d");
  };

  const formatMessageDate = (date?: string | null) => {
    if (!date) return "";
    return format(new Date(date), "MMMM d, yyyy");
  };

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 lg:py-6 h-full">
      {/* Page Header */}
      <div className="mb-4 hidden sm:block">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-brand text-primary-foreground shadow-lg">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Messages</h1>
            <p className="text-sm text-muted-foreground">
              Connect and communicate with your network
            </p>
          </div>
        </div>
      </div>

      <Card className="overflow-hidden border shadow-xl h-[calc(100vh-100px)] sm:h-[calc(100vh-140px)]">
        <div className="flex h-full">
          {/* SIDEBAR */}
          <div
            className={`${activeChat ? "hidden lg:flex" : "flex"} lg:flex flex-col w-full lg:w-[360px] border-r bg-muted/20 shrink-0`}
          >
            <div className="border-b bg-background p-4 shrink-0">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Conversations</h2>
                  <p className="text-xs text-muted-foreground">
                    {searchQuery
                      ? `${filteredChats.length} results`
                      : `${chats?.length ?? 0} conversations`}
                  </p>
                </div>
                <Button variant="ghost" size="icon" className="hidden lg:flex">
                  <Plus className="h-5 w-5" />
                </Button>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search name, email, or message content..."
                  className="pl-9 pr-9 bg-muted/40"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Search hint */}
              {searchQuery && (
                <div className="mt-2 text-xs text-muted-foreground">
                  Searching in conversations, profiles, and messages
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto min-h-0">
              <div className="p-2 space-y-1">
                {chatsLoading ? (
                  <div className="flex h-40 items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredChats.length ? (
                  filteredChats.map((chat) => {
                    const name = chat.other?.full_name ?? chat.other?.email ?? "Unknown User";
                    const isActive = activeChat === chat.id;
                    const lastMessage = chat.lastMessage;

                    // Highlight matching message if searching
                    const chatWithMessages = chat as ChatWithDetails & { messages?: Message[] };
                    const matchingMessage = searchQuery
                      ? chatWithMessages.messages?.find((msg) =>
                          msg.body?.toLowerCase().includes(searchQuery.toLowerCase()),
                        )
                      : undefined;

                    return (
                      <button
                        key={chat.id}
                        onClick={() => {
                          setActiveChat(chat.id);
                          navigate({ search: { chat: chat.id } });
                          lastMessageCountRef.current = 0;
                        }}
                        className={`group flex w-full items-center gap-3 rounded-xl p-3 text-left transition-all ${
                          isActive
                            ? "bg-primary text-primary-foreground shadow-md"
                            : "hover:bg-muted"
                        }`}
                      >
                        <div className="relative shrink-0">
                          <Avatar className="h-11 w-11">
                            <AvatarImage src={chat.other?.avatar_url ?? undefined} alt={name} />
                            <AvatarFallback
                              className={
                                isActive
                                  ? "bg-primary-foreground/20 text-primary-foreground"
                                  : "gradient-brand text-primary-foreground"
                              }
                            >
                              {getInitials(chat.other?.full_name ?? chat.other?.email)}
                            </AvatarFallback>
                          </Avatar>
                          <span
                            className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 ${isActive ? "border-primary bg-green-400" : "border-background bg-green-500"}`}
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate font-semibold text-sm">{name}</p>
                            {lastMessage && (
                              <span
                                className={`shrink-0 text-[10px] ${isActive ? "text-primary-foreground/70" : "text-muted-foreground"}`}
                              >
                                {formatMessageTime(lastMessage.created_at)}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between gap-2 mt-0.5">
                            <p
                              className={`truncate text-xs ${isActive ? "text-primary-foreground/70" : "text-muted-foreground"}`}
                            >
                              {matchingMessage ? (
                                <span className="font-medium">Found: {matchingMessage.body}</span>
                              ) : (
                                lastMessage?.body || "Start a conversation"
                              )}
                            </p>
                            {chat.unreadCount > 0 && (
                              <Badge
                                variant={isActive ? "secondary" : "default"}
                                className="h-5 min-w-5 px-1.5 text-[10px] shrink-0"
                              >
                                {chat.unreadCount}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })
                ) : searchQuery ? (
                  <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                      <Search className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="font-medium">No results found</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      No conversations or messages match "{searchQuery}". Try a different search
                      term.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4"
                      onClick={() => setSearchQuery("")}
                    >
                      Clear search
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                      <MessageSquare className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="font-medium">No conversations yet</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Start connecting with people to begin messaging.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* CHAT AREA */}
          <div className={`${activeChat ? "flex" : "hidden lg:flex"} flex-col flex-1 min-w-0`}>
            {activeChat ? (
              <>
                <div className="flex items-center justify-between border-b bg-background px-4 py-3 shadow-sm shrink-0">
                  <div className="flex min-w-0 items-center gap-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="lg:hidden shrink-0"
                      onClick={() => {
                        setActiveChat(null);
                        navigate({ search: {} });
                      }}
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </Button>

                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarImage
                        src={active?.other?.avatar_url ?? undefined}
                        alt={active?.other?.full_name ?? "User"}
                      />
                      <AvatarFallback className="gradient-brand text-sm font-semibold text-primary-foreground">
                        {getInitials(active?.other?.full_name ?? active?.other?.email)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0">
                      <p className="truncate font-semibold">
                        {active?.other?.full_name ?? active?.other?.email ?? "Conversation"}
                      </p>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <span className="h-2 w-2 rounded-full bg-green-500 shrink-0" />
                        <span className="truncate">
                          {isTyping ? "Typing..." : "Available to chat"}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="hidden sm:flex">
                      <Phone className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="hidden sm:flex">
                      <Video className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Info className="h-5 w-5" />
                    </Button>
                  </div>
                </div>

                <div
                  ref={scrollAreaRef}
                  onScroll={handleScroll}
                  className="flex-1 overflow-y-auto bg-muted/20 min-h-0"
                >
                  <div className="p-4 lg:p-6">
                    {messagesLoading ? (
                      <div className="flex h-full items-center justify-center py-20">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : messages?.length ? (
                      <div className="mx-auto max-w-4xl space-y-4">
                        {messages[0] && (
                          <div className="flex justify-center">
                            <Badge variant="outline" className="bg-background">
                              {formatMessageDate(messages[0].created_at)}
                            </Badge>
                          </div>
                        )}

                        {messages.map((message, index) => {
                          const isMine = message.sender_id === user?.id;
                          const showDate =
                            index > 0 &&
                            formatMessageDate(message.created_at) !==
                              formatMessageDate(messages[index - 1].created_at);

                          return (
                            <div key={message.id}>
                              {showDate && (
                                <div className="flex justify-center my-4">
                                  <Badge variant="outline" className="bg-background">
                                    {formatMessageDate(message.created_at)}
                                  </Badge>
                                </div>
                              )}

                              <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                                <div
                                  className={`group max-w-[85%] sm:max-w-[70%] ${isMine ? "items-end" : "items-start"}`}
                                >
                                  <div
                                    className={`rounded-2xl px-4 py-2.5 text-sm shadow-sm ${isMine ? "rounded-br-md gradient-brand text-primary-foreground" : "rounded-bl-md border bg-background"}`}
                                  >
                                    <p className="whitespace-pre-wrap break-words leading-relaxed">
                                      {message.body}
                                    </p>
                                  </div>
                                  <div
                                    className={`mt-1 px-1 flex items-center gap-1 text-[10px] text-muted-foreground ${isMine ? "justify-end" : "justify-start"}`}
                                  >
                                    <span>
                                      {message.created_at
                                        ? format(new Date(message.created_at), "HH:mm")
                                        : ""}
                                    </span>
                                    {isMine && <Check className="h-3 w-3" />}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        <div ref={bottomRef} />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-center py-20">
                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-background shadow-sm">
                          <MessageSquare className="h-7 w-7 text-muted-foreground" />
                        </div>
                        <h3 className="font-semibold">Start the conversation</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Send a message to begin chatting.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t bg-background p-3 lg:p-4 shrink-0">
                  <div className="mx-auto flex max-w-4xl items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="hidden sm:flex h-10 w-10 shrink-0"
                    >
                      <Paperclip className="h-5 w-5 text-muted-foreground" />
                    </Button>

                    <div className="relative flex-1">
                      <Input
                        value={text}
                        onChange={(e) => {
                          setText(e.target.value);
                          handleTyping();
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            send();
                          }
                        }}
                        placeholder="Write a message..."
                        disabled={sending}
                        className="h-11 rounded-xl border-muted bg-muted/40 pr-12 focus-visible:ring-primary"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 h-9 w-9 -translate-y-1/2"
                      >
                        <Smile className="h-5 w-5 text-muted-foreground" />
                      </Button>
                    </div>

                    {text.trim() ? (
                      <Button
                        onClick={send}
                        disabled={sending}
                        className="h-11 w-11 shrink-0 rounded-xl gradient-brand p-0 text-primary-foreground shadow-md transition hover:scale-105"
                      >
                        {sending ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <Send className="h-5 w-5" />
                        )}
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-11 w-11 shrink-0"
                      >
                        <Mic className="h-5 w-5 text-muted-foreground" />
                      </Button>
                    )}
                  </div>

                  <p className="mx-auto mt-2 max-w-4xl px-1 text-[10px] text-muted-foreground">
                    Press Enter to send
                  </p>
                </div>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center bg-muted/10 p-6">
                <div className="max-w-sm text-center">
                  <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl gradient-brand text-primary-foreground shadow-xl">
                    <MessageSquare className="h-9 w-9" />
                  </div>
                  <h2 className="text-2xl font-bold">Your Messages</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Select a conversation from the sidebar and continue connecting with your
                    professional network.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

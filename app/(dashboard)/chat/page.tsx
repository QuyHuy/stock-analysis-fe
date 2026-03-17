"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { chatApi } from "@/lib/api";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ChatInput } from "@/components/chat/ChatInput";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatSession {
  id: string;
  title?: string;
  updatedAt?: { seconds: number };
}

const WELCOME_MESSAGE: Message = {
  role: "assistant",
  content:
    "Xin chào! Tôi là AI phân tích chứng khoán Việt Nam.\n\nTôi có thể phân tích sâu về:\n- 📊 Giá cổ phiếu & xu hướng\n- 📈 Chỉ báo kỹ thuật (MA20, MA50, RSI)\n- 🎯 Vùng hỗ trợ & kháng cự\n- 💡 Nhận định tổng thể\n\nHãy hỏi tôi về bất kỳ cổ phiếu nào!\n\n*Lưu ý: Thông tin mang tính tham khảo, không phải lời khuyên đầu tư.*",
};

const SUGGESTED_QUESTIONS = [
  "Phân tích kỹ thuật VCB hiện tại",
  "HPG đang ở vùng hỗ trợ hay kháng cự?",
  "So sánh FPT và MWG",
  "RSI của VNM đang ở mức nào?",
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [chatId, setChatId] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const res = await chatApi.listHistory();
      setSessions(res.data || []);
    } catch {
      // Silently ignore — history is optional
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleNewChat = () => {
    setMessages([WELCOME_MESSAGE]);
    setChatId(undefined);
  };

  const handleLoadSession = async (session: ChatSession) => {
    try {
      const res = await chatApi.getMessages(session.id);
      const msgs: Message[] = res.data.messages || [];
      setMessages(msgs.length > 0 ? msgs : [WELCOME_MESSAGE]);
      setChatId(session.id);
    } catch {
      setMessages([WELCOME_MESSAGE]);
      setChatId(session.id);
    }
  };

  const handleSend = async (message: string) => {
    setMessages((prev) => [...prev, { role: "user", content: message }]);
    setLoading(true);

    try {
      const history = messages
        .filter((m) => m !== WELCOME_MESSAGE)
        .map((m) => ({ role: m.role, content: m.content }));
      const res = await chatApi.send(message, chatId, history);
      const { reply, chat_id } = res.data;
      setChatId(chat_id);
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      // Refresh history list after new message
      loadHistory();
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            status === 429
              ? "⚠️ AI đang quá tải, vui lòng thử lại sau vài giây."
              : detail || "Xin lỗi, có lỗi xảy ra. Vui lòng thử lại sau.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (session: ChatSession) => {
    if (!session.updatedAt?.seconds) return "";
    const d = new Date(session.updatedAt.seconds * 1000);
    return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
  };

  const isFirstMessage = messages.length === 1 && messages[0] === WELCOME_MESSAGE;

  return (
    <div className="flex h-full overflow-hidden">
      {/* History Sidebar */}
      {sidebarOpen && (
        <div className="w-60 border-r flex flex-col shrink-0 bg-muted/30">
          <div className="p-3 border-b flex items-center gap-2">
            <Button
              size="sm"
              className="flex-1 text-xs h-8"
              onClick={handleNewChat}
            >
              + Cuộc hội thoại mới
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 shrink-0"
              onClick={() => setSidebarOpen(false)}
              title="Ẩn lịch sử"
            >
              ←
            </Button>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {loadingHistory && (
                <p className="text-xs text-muted-foreground px-2 py-1">Đang tải...</p>
              )}
              {!loadingHistory && sessions.length === 0 && (
                <p className="text-xs text-muted-foreground px-2 py-4 text-center">
                  Chưa có lịch sử
                </p>
              )}
              {sessions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleLoadSession(s)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-muted transition-colors ${
                    chatId === s.id ? "bg-muted font-medium" : ""
                  }`}
                >
                  <div className="truncate">
                    {s.title || "Cuộc hội thoại"}
                  </div>
                  <div className="text-muted-foreground mt-0.5">
                    {formatTime(s)}
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Main chat area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <div className="px-4 py-3 border-b shrink-0">
          <div className="flex items-center gap-2">
            {!sidebarOpen && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => setSidebarOpen(true)}
                title="Xem lịch sử"
              >
                ☰
              </Button>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="font-semibold text-sm truncate">Hỏi AI về Chứng khoán</h1>
              <p className="text-xs text-muted-foreground">
                Phân tích kỹ thuật chuyên sâu · Dữ liệu thực tế
              </p>
            </div>
            <Badge variant="outline" className="text-xs shrink-0">
              Gemini 2.5 Flash
            </Badge>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1">
          <div className="py-2">
            {messages.map((msg, i) => (
              <ChatMessage key={i} role={msg.role} content={msg.content} />
            ))}
            {loading && (
              <div className="flex gap-3 px-4 py-3">
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs shrink-0">
                  AI
                </div>
                <div className="bg-muted rounded-xl px-4 py-2.5 text-sm text-muted-foreground animate-pulse">
                  Đang phân tích chuyên sâu...
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </ScrollArea>

        {/* Suggested questions */}
        {isFirstMessage && (
          <div className="px-4 pb-2 flex flex-wrap gap-1.5 shrink-0">
            {SUGGESTED_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => handleSend(q)}
                className="text-xs border rounded-full px-3 py-1 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <ChatInput onSend={handleSend} disabled={loading} />
      </div>
    </div>
  );
}

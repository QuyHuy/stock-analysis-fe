"use client";
import { useState, useRef, useEffect } from "react";
import { chatApi } from "@/lib/api";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ChatInput } from "@/components/chat/ChatInput";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const WELCOME_MESSAGE: Message = {
  role: "assistant",
  content:
    "Xin chào! Tôi là AI phân tích chứng khoán Việt Nam. Bạn có thể hỏi tôi về giá cổ phiếu, chỉ số kỹ thuật, hoặc phân tích thị trường.\n\nLưu ý: Tôi cung cấp thông tin tham khảo, không phải lời khuyên đầu tư.",
};

const SUGGESTED_QUESTIONS = [
  "VNM đang ở vùng giá bao nhiêu?",
  "HPG có tín hiệu gì không?",
  "So sánh VIC và VHM hiện tại",
  "FPT có phải là cổ phiếu tốt không?",
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [chatId, setChatId] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (message: string) => {
    setMessages((prev) => [...prev, { role: "user", content: message }]);
    setLoading(true);

    try {
      const history = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));
      const res = await chatApi.send(message, chatId, history);
      const { reply, chat_id } = res.data;
      setChatId(chat_id);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: reply },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Xin lỗi, có lỗi xảy ra. Vui lòng thử lại sau.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const isFirstMessage = messages.length === 1;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-semibold text-base">Hỏi AI về Chứng khoán</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Dữ liệu cập nhật hàng ngày từ thị trường VN
            </p>
          </div>
          <Badge variant="outline" className="text-xs">
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
              <div className="bg-muted rounded-xl px-4 py-2.5 text-sm text-muted-foreground">
                Đang phân tích...
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Suggested questions (shown only before first user message) */}
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
  );
}

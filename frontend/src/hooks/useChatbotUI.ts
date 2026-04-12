import { useCallback, useMemo, useRef, useState } from "react";
import { Alert } from "react-native";
import {
  askGeneralChatbot,
  askRagChatbot,
  ChatHistoryItem,
} from "@/src/api/chatbotApi";

export type ChatRole = "user" | "assistant";
export type ChatMode = "rag" | "general";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: number;
  sources?: string[];
  isError?: boolean;
};

function createMessage(
  role: ChatRole,
  content: string,
  options?: Partial<ChatMessage>
): ChatMessage {
  return {
    id: `${role}-${Date.now()}-${Math.random()}`,
    role,
    content,
    createdAt: Date.now(),
    sources: [],
    isError: false,
    ...options,
  };
}

function normalizeError(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "Đã có lỗi xảy ra";
}

export function useChatbotUI() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [mode, setMode] = useState<ChatMode>("general");

  const listRef = useRef<any>(null);

  const hasMessages = messages.length > 0;

  const canSend = useMemo(() => {
    return input.trim().length > 0 && !sending;
  }, [input, sending]);

  const buildHistory = useCallback((items: ChatMessage[]): ChatHistoryItem[] => {
    return items.map((item) => ({
      role: item.role,
      content: item.content,
    }));
  }, []);

  const scrollToEnd = useCallback(() => {
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd?.({ animated: true });
    });
  }, []);

  const clearConversation = useCallback(() => {
    if (sending) return;

    if (!messages.length) return;

    Alert.alert("Thông báo", "Bạn có muốn bắt đầu cuộc trò chuyện mới không?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Đồng ý",
        onPress: () => {
          setMessages([]);
          setInput("");
        },
      },
    ]);
  }, [messages.length, sending]);

  const sendMessage = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || sending) return;

    const userMessage = createMessage("user", trimmed);
    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setInput("");
    setSending(true);

    scrollToEnd();

    try {
      const payload = {
        message: trimmed,
        chat_history: buildHistory(nextMessages),
      };

      const response =
        mode === "rag"
          ? await askRagChatbot(payload)
          : await askGeneralChatbot(payload);

      const botMessage = createMessage("assistant", response.answer, {
        sources: response.sources || [],
      });

      setMessages((prev) => [...prev, botMessage]);
      scrollToEnd();
    } catch (error: unknown) {
      const message = normalizeError(error);

      const errorMessage = createMessage("assistant", message, {
        isError: true,
      });

      setMessages((prev) => [...prev, errorMessage]);
      scrollToEnd();
    } finally {
      setSending(false);
    }
  }, [input, sending, messages, mode, buildHistory, scrollToEnd]);

  const quickAsk = useCallback(
    async (text: string) => {
      if (sending) return;
      setInput(text);

      requestAnimationFrame(() => {
        setTimeout(() => {
          setInput("");
          const userMessage = createMessage("user", text);
          const nextMessages = [...messages, userMessage];

          setMessages(nextMessages);
          setSending(true);
          scrollToEnd();

          (async () => {
            try {
              const payload = {
                message: text,
                chat_history: buildHistory(nextMessages),
              };

              const response =
                mode === "rag"
                  ? await askRagChatbot(payload)
                  : await askGeneralChatbot(payload);

              const botMessage = createMessage("assistant", response.answer, {
                sources: response.sources || [],
              });

              setMessages((prev) => [...prev, botMessage]);
              scrollToEnd();
            } catch (error: unknown) {
              const errorMessage = createMessage(
                "assistant",
                normalizeError(error),
                { isError: true }
              );
              setMessages((prev) => [...prev, errorMessage]);
              scrollToEnd();
            } finally {
              setSending(false);
            }
          })();
        }, 0);
      });
    },
    [sending, messages, mode, buildHistory, scrollToEnd]
  );

  return {
    listRef,
    messages,
    input,
    setInput,
    sending,
    mode,
    setMode,
    hasMessages,
    canSend,
    sendMessage,
    clearConversation,
    quickAsk,
  };
}
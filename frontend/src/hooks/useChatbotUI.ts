import { useCallback, useMemo, useRef, useState } from "react";
import { Alert } from "react-native";
import {
  askChatbot,
  ChatHistoryItem,
} from "@/src/api/chatbotApi";

export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: number;
  sources?: string[];
  isError?: boolean;
  mode?: string;
  intent?: string | null;
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
    mode: undefined,
    intent: null,
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

  const sendToBot = useCallback(
    async (text: string, currentMessages: ChatMessage[]) => {
      const payload = {
        message: text,
        chat_history: buildHistory(currentMessages),
      };

      const response = await askChatbot(payload);

      const botMessage = createMessage("assistant", response.answer, {
        sources: response.sources || [],
        mode: response.mode,
        intent: response.intent ?? null,
      });

      setMessages((prev) => [...prev, botMessage]);
      scrollToEnd();
    },
    [buildHistory, scrollToEnd]
  );

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
      await sendToBot(trimmed, nextMessages);
    } catch (error: unknown) {
      const errorMessage = createMessage("assistant", normalizeError(error), {
        isError: true,
      });

      setMessages((prev) => [...prev, errorMessage]);
      scrollToEnd();
    } finally {
      setSending(false);
    }
  }, [input, sending, messages, scrollToEnd, sendToBot]);

  const quickAsk = useCallback(
    async (text: string) => {
      if (sending) return;

      const userMessage = createMessage("user", text);
      const nextMessages = [...messages, userMessage];

      setMessages(nextMessages);
      setInput("");
      setSending(true);

      scrollToEnd();

      try {
        await sendToBot(text, nextMessages);
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
    },
    [sending, messages, scrollToEnd, sendToBot]
  );

  return {
    listRef,
    messages,
    input,
    setInput,
    sending,
    hasMessages,
    canSend,
    sendMessage,
    clearConversation,
    quickAsk,
  };
}
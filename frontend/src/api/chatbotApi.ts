import { API_BASE_URL } from "@/src/config/api";
import { authFetch } from "@/src/api/authFetch";

export type ChatRole = "user" | "assistant";

export type ChatHistoryItem = {
  role: ChatRole;
  content: string;
};

export type AskChatPayload = {
  message: string;
  chat_history: ChatHistoryItem[];
};

export type AskChatResponse = {
  answer: string;
  sources?: string[];
  mode?: string;
};

type ErrorResponseShape = {
  message?: string;
  detail?: string;
  errors?: Record<string, string | string[]>;
  [key: string]: unknown;
};

async function parseJsonSafely(response: Response): Promise<any> {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

function buildApiError(data: ErrorResponseShape, fallbackMessage: string) {
  return new Error(data?.message || data?.detail || fallbackMessage);
}

export async function askRagChatbot(
  payload: AskChatPayload
): Promise<AskChatResponse> {
  const response = await authFetch(`${API_BASE_URL}/chatbot/ask/`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  const data = await parseJsonSafely(response);

  if (!response.ok) {
    throw buildApiError(data, "Không thể gửi tin nhắn đến chatbot");
  }

  return data as AskChatResponse;
}

export async function askGeneralChatbot(
  payload: AskChatPayload
): Promise<AskChatResponse> {
  const response = await authFetch(`${API_BASE_URL}/chatbot/general-ask/`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  const data = await parseJsonSafely(response);

  if (!response.ok) {
    throw buildApiError(data, "Không thể gửi tin nhắn đến chatbot");
  }

  return data as AskChatResponse;
}
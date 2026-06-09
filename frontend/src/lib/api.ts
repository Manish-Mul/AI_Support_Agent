export interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  created_at: string;
}

export interface SendMessageResponse {
  reply: string;
  sessionId: string;
}

export interface HistoryResponse {
  conversation: { id: string; created_at: string };
  messages: ChatMessage[];
}

const BASE = import.meta.env.PROD
  ? `${import.meta.env.VITE_API_URL}/chat`
  : "/chat";

export async function sendMessage(
  message: string,
  sessionId?: string
): Promise<SendMessageResponse> {
  const res = await fetch(`${BASE}/message`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, sessionId }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error ?? "Failed to send message.");
  }

  return data as SendMessageResponse;
}

export async function fetchHistory(
  sessionId: string
): Promise<HistoryResponse | null> {
  const res = await fetch(`${BASE}/history/${sessionId}`);

  if (res.status === 404) return null;
  if (!res.ok) return null;

  return res.json() as Promise<HistoryResponse>;
}
import { useState, useCallback, useEffect, useRef } from "react";
import { sendMessage, fetchHistory, ChatMessage } from "../lib/api";

const SESSION_KEY = "spur_session_id";

export interface UIMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  isError?: boolean;
}

export function useChat() {
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryLoaded, setIsHistoryLoaded] = useState(false);
  const initialized = useRef(false);

  // Load history on mount if session exists
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const storedSession = localStorage.getItem(SESSION_KEY);
    if (!storedSession) {
      setIsHistoryLoaded(true);
      return;
    }

    setSessionId(storedSession);
    fetchHistory(storedSession).then((data) => {
      if (data && data.messages.length > 0) {
        setMessages(
          data.messages.map((m: ChatMessage) => ({
            id: m.id,
            sender: m.sender,
            text: m.text,
          }))
        );
      }
      setIsHistoryLoaded(true);
    });
  }, []);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      const userMsg: UIMessage = {
        id: crypto.randomUUID(),
        sender: "user",
        text: trimmed,
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      try {
        const res = await sendMessage(trimmed, sessionId);

        if (!sessionId) {
          setSessionId(res.sessionId);
          localStorage.setItem(SESSION_KEY, res.sessionId);
        }

        const aiMsg: UIMessage = {
          id: crypto.randomUUID(),
          sender: "ai",
          text: res.reply,
        };
        setMessages((prev) => [...prev, aiMsg]);
      } catch (err: unknown) {
        const errMsg: UIMessage = {
          id: crypto.randomUUID(),
          sender: "ai",
          text:
            err instanceof Error
              ? err.message
              : "Something went wrong. Please try again.",
          isError: true,
        };
        setMessages((prev) => [...prev, errMsg]);
      } finally {
        setIsLoading(false);
      }
    },
    [sessionId, isLoading]
  );

  const clearSession = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    setSessionId(undefined);
    setMessages([]);
  }, []);

  return { messages, isLoading, isHistoryLoaded, send, clearSession, sessionId };
}

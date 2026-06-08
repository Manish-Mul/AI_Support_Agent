import { useEffect, useRef } from "react";
import { useChat } from "./hooks/useChat";
import { MessageBubble } from "./components/MessageBubble";
import { TypingIndicator } from "./components/TypingIndicator";
import { ChatInput } from "./components/ChatInput";

const SUGGESTIONS = [
  "What's your return policy?",
  "Do you ship to the USA?",
  "What are your support hours?",
  "How do I track my order?",
];

export default function App() {
  const { messages, isLoading, isHistoryLoaded, send, clearSession } =
    useChat();
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const showWelcome = isHistoryLoaded && messages.length === 0;

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-left">
          <div className="agent-badge">
            <span className="status-dot" aria-hidden="true" />
          </div>
          <div>
            <h1 className="header-title">Spark &amp; Co. Support</h1>
            <p className="header-sub">Typically replies instantly</p>
          </div>
        </div>
        <button
          className="clear-btn"
          onClick={clearSession}
          title="Start a new conversation"
          aria-label="Start a new conversation"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 5V3M12 3L9 6M12 3L15 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M19 12H21M3 12H5M6.34 6.34L4.93 4.93M17.66 6.34L19.07 4.93"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle
              cx="12"
              cy="14"
              r="4"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
          New chat
        </button>
      </header>

      {/* Message list */}
      <main className="message-list" role="log" aria-live="polite">
        {!isHistoryLoaded && (
          <div className="loading-history">Loading conversation…</div>
        )}

        {showWelcome && (
          <div className="welcome">
            <div className="welcome-icon">✦</div>
            <h2 className="welcome-title">Hi there! 👋</h2>
            <p className="welcome-text">
              I'm your Spark &amp; Co. support assistant. How can I help you
              today?
            </p>
            <div className="suggestions">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  className="suggestion-chip"
                  onClick={() => send(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {isLoading && <TypingIndicator />}

        <div ref={bottomRef} aria-hidden="true" />
      </main>

      {/* Input */}
      <footer className="input-footer">
        <ChatInput onSend={send} isLoading={isLoading} />
        <p className="footer-note">
          Spark &amp; Co. AI · Responses may not reflect real store policies.
        </p>
      </footer>
    </div>
  );
}

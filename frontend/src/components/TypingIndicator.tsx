export function TypingIndicator() {
  return (
    <div className="msg-row msg-row--ai">
      <div className="avatar avatar--ai" aria-label="AI agent">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="8" r="4" fill="currentColor" />
          <path
            d="M4 20c0-4 3.6-7 8-7s8 3 8 7"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <div className="bubble bubble--ai typing-bubble" aria-label="Agent is typing">
        <span className="dot" />
        <span className="dot" />
        <span className="dot" />
      </div>
    </div>
  );
}

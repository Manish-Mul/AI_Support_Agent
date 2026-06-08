import { useState, useRef, FormEvent, KeyboardEvent } from "react";

interface Props {
  onSend: (text: string) => void;
  isLoading: boolean;
}

const MAX_LENGTH = 2000;

export function ChatInput({ onSend, isLoading }: Props) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    submit();
  }

  function submit() {
    const trimmed = value.trim();
    if (!trimmed || isLoading) return;
    onSend(trimmed);
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  function handleInput() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }

  const charsLeft = MAX_LENGTH - value.length;
  const isOverLimit = value.length > MAX_LENGTH;

  return (
    <form className="chat-input-form" onSubmit={handleSubmit}>
      <div className="input-wrapper">
        <textarea
          ref={textareaRef}
          className="chat-textarea"
          placeholder="Ask me anything about shipping, returns, or your order…"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          rows={1}
          maxLength={MAX_LENGTH + 100} // allow slight overage for UI feedback
          aria-label="Type your message"
          disabled={isLoading}
        />
        <button
          type="submit"
          className="send-btn"
          disabled={isLoading || !value.trim() || isOverLimit}
          aria-label="Send message"
        >
          {isLoading ? (
            <span className="send-spinner" />
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>
      </div>
      {value.length > MAX_LENGTH * 0.8 && (
        <p className={`char-count ${isOverLimit ? "char-count--over" : ""}`}>
          {isOverLimit
            ? `Message too long by ${-charsLeft} characters`
            : `${charsLeft} characters remaining`}
        </p>
      )}
    </form>
  );
}

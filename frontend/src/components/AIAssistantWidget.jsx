import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../lib/api.js";

const DEFAULT_STARTERS = [
  "🚀 What career fits my current skills?",
  "📝 How can I optimize my resume?",
  "🗺️ Create a 6-month learning roadmap",
  "💡 How do I prepare for tech interviews?",
];

export default function AIAssistantWidget() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [hasNewBadge, setHasNewBadge] = useState(true);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const chatBottomRef = useRef(null);
  const inputRef = useRef(null);

  // Load history if user is logged in
  useEffect(() => {
    if (user && isOpen && messages.length === 0) {
      setLoading(true);
      api("/api/mentor/history")
        .then((res) => {
          if (Array.isArray(res) && res.length > 0) {
            setMessages(res);
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [user, isOpen]);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (isOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, sending, isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setHasNewBadge(false);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  async function handleSend(textToSend) {
    const content = (textToSend ?? input).trim();
    if (!content || sending) return;

    setInput("");
    const userMsg = { role: "user", content, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setMessages((prev) => [...prev, userMsg]);
    setSending(true);

    try {
      if (user) {
        const data = await api("/api/mentor/message", {
          method: "POST",
          body: { content },
        });
        setMessages((prev) => [
          ...prev,
          { role: "mentor", content: data.reply, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
        ]);
      } else {
        // Guest mode fallback response
        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            {
              role: "mentor",
              content: `Thanks for your question: "${content}"!\n\nTo get personalized career roadmap tracking, readiness scoring, and saved mentor history, please log in or create a free account on CareerCraft.`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ]);
          setSending(false);
        }, 1000);
        return;
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "mentor",
          content: `Sorry, I ran into an issue: ${err.message}. Please try again in a moment.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      if (user) setSending(false);
    }
  }

  function handleCopy(text, idx) {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  }

  function handleClearChat() {
    setMessages([]);
  }

  return (
    <div className={`ai-widget ${isOpen ? "ai-widget--open" : ""} ${isExpanded ? "ai-widget--expanded" : ""}`}>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          className="ai-widget__trigger"
          onClick={() => setIsOpen(true)}
          title="Open CareerCraft AI Assistant"
          aria-label="Open CareerCraft AI Assistant"
        >
          <div className="ai-widget__trigger-glow" />
          <div className="ai-widget__trigger-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"
                fill="currentColor"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              <path
                d="M19 2L20.25 5.75L24 7L20.25 8.25L19 12L17.75 8.25L14 7L17.75 5.75L19 2Z"
                fill="currentColor"
                opacity="0.7"
              />
            </svg>
          </div>
          <span className="ai-widget__trigger-label">AI Mentor</span>
          {hasNewBadge && <span className="ai-widget__badge" />}
        </button>
      )}

      {/* Floating Chat Modal */}
      {isOpen && (
        <div className="ai-widget__window" role="dialog" aria-label="CareerCraft AI Assistant">
          {/* Header */}
          <div className="ai-widget__header">
            <div className="ai-widget__header-info">
              <div className="ai-widget__avatar">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"
                    fill="currentColor"
                  />
                </svg>
                <span className="ai-widget__status-dot" />
              </div>
              <div>
                <h3 className="ai-widget__title">AI Career Assistant</h3>
                <p className="ai-widget__subtitle">
                  {user ? `Helping ${user.name.split(" ")[0]}` : "Career & Skill Guidance"}
                </p>
              </div>
            </div>

            <div className="ai-widget__header-actions">
              <button
                className="ai-widget__icon-btn"
                onClick={handleClearChat}
                title="Clear conversation"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>

              <button
                className="ai-widget__icon-btn"
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? "Collapse window" : "Expand window"}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {isExpanded ? (
                    <path d="M8 3v5H3m18 0h-5V3m0 18v-5h5M3 16h5v5" />
                  ) : (
                    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                  )}
                </svg>
              </button>

              <Link
                to="/mentor"
                className="ai-widget__icon-btn"
                title="Open full page mentor"
                onClick={() => setIsOpen(false)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                  <polyline points="15 3 21 3 21 9"></polyline>
                  <line x1="10" y1="14" x2="21" y2="3"></line>
                </svg>
              </Link>

              <button
                className="ai-widget__icon-btn ai-widget__close-btn"
                onClick={() => setIsOpen(false)}
                title="Close chat"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div className="ai-widget__body">
            {loading ? (
              <div className="ai-widget__loading-state">
                <div className="ai-widget__spinner" />
                <p>Loading your chat history...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="ai-widget__welcome">
                <div className="ai-widget__welcome-badge">✨ CareerCraft AI</div>
                <h4>Hello! How can I assist your career journey today?</h4>
                <p>Ask me about skill roadmaps, interview prep, career transitions, or resume recommendations.</p>

                <div className="ai-widget__starters">
                  <p className="ai-widget__starters-heading">Suggested Prompts:</p>
                  {DEFAULT_STARTERS.map((prompt, idx) => (
                    <button
                      key={idx}
                      className="ai-widget__starter-btn"
                      onClick={() => handleSend(prompt)}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="ai-widget__messages">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`ai-widget__msg ai-widget__msg--${msg.role}`}
                  >
                    <div className="ai-widget__msg-avatar">
                      {msg.role === "mentor" ? "🤖" : "👤"}
                    </div>
                    <div className="ai-widget__msg-content">
                      <div className="ai-widget__msg-bubble">
                        {msg.content.split("\n").map((line, i) => (
                          <p key={i}>{line}</p>
                        ))}
                      </div>
                      {msg.role === "mentor" && (
                        <div className="ai-widget__msg-meta">
                          <button
                            className="ai-widget__copy-btn"
                            onClick={() => handleCopy(msg.content, idx)}
                          >
                            {copiedIndex === idx ? "✓ Copied" : "Copy"}
                          </button>
                          {msg.timestamp && <span>{msg.timestamp}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {sending && (
                  <div className="ai-widget__msg ai-widget__msg--mentor ai-widget__msg--typing">
                    <div className="ai-widget__msg-avatar">🤖</div>
                    <div className="ai-widget__msg-bubble">
                      <div className="ai-widget__typing-dots">
                        <span />
                        <span />
                        <span />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>
            )}
          </div>

          {/* Footer Input Bar */}
          <div className="ai-widget__footer">
            {!user && (
              <div className="ai-widget__guest-banner">
                💡 <Link to="/login">Log in</Link> to enable full roadmap & career history tracking.
              </div>
            )}
            <form
              className="ai-widget__form"
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
            >
              <input
                ref={inputRef}
                type="text"
                className="ai-widget__input"
                placeholder="Ask AI mentor anything..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={sending}
              />
              <button
                type="submit"
                className="ai-widget__send-btn"
                disabled={!input.trim() || sending}
                title="Send Message"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

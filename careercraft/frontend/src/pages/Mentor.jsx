import { useEffect, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../lib/api.js";

const STARTERS = [
  "🚀 What should I do next in my career roadmap?",
  "⏳ I only have a few hours this week to upskill.",
  "💡 I'm feeling stuck. How do I regain momentum?",
  "📄 What are the best tips to polish my resume?",
];

export default function Mentor() {
  const { user, loading: authLoading } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    api("/api/mentor/history")
      .then(setMessages)
      .catch(() => setMessages([]))
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  if (authLoading) return null;
  if (!user) return <Navigate to="/login" replace />;

  async function send(text) {
    const content = (text ?? input).trim();
    if (!content || sending) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content }]);
    setSending(true);
    try {
      const data = await api("/api/mentor/message", { method: "POST", body: { content } });
      setMessages((prev) => [...prev, { role: "mentor", content: data.reply }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: "mentor", content: `Something went wrong: ${err.message}` }]);
    } finally {
      setSending(false);
    }
  }

  function handleCopy(text, idx) {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  }

  function onSubmit(e) {
    e.preventDefault();
    send();
  }

  return (
    <div>
      <Navbar />
      <section className="mentor-page">
        <div className="container mentor-page__inner">
          <div className="mentor-page__header">
            <span className="eyebrow">✨ AI Career Mentor</span>
            <h1>Your ongoing guide, personalized for your goals.</h1>
            <p className="mentor-page__sub">
              Your AI Mentor remembers your committed career path, roadmap milestones, and readiness score across visits to give tailored advice.
            </p>
          </div>

          <div className="mentor-chat">
            {loading ? (
              <div className="mentor-chat__status">
                <div className="ai-widget__spinner" />
                <p>Loading your conversation history…</p>
              </div>
            ) : (
              <div className="mentor-chat__log">
                {messages.length === 0 && (
                  <div className="mentor-chat__empty">
                    <div className="mentor-chat__welcome-icon">🤖</div>
                    <h3>Start your conversation with CareerCraft AI</h3>
                    <p>Select a prompt below or type your custom question:</p>
                    <div className="mentor-chat__starters">
                      {STARTERS.map((s) => (
                        <button key={s} className="mentor-chat__starter" onClick={() => send(s)}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {messages.map((m, i) => (
                  <div key={i} className={"mentor-chat__bubble mentor-chat__bubble--" + m.role}>
                    <div className="mentor-chat__avatar">
                      {m.role === "mentor" ? "🤖" : "👤"}
                    </div>
                    <div className="mentor-chat__bubble-body">
                      {m.content.split("\n").map((line, lIdx) => (
                        <p key={lIdx}>{line}</p>
                      ))}
                      {m.role === "mentor" && (
                        <button
                          className="mentor-chat__copy-btn"
                          onClick={() => handleCopy(m.content, i)}
                        >
                          {copiedIndex === i ? "✓ Copied" : "Copy response"}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {sending && (
                  <div className="mentor-chat__bubble mentor-chat__bubble--mentor mentor-chat__bubble--typing">
                    <div className="mentor-chat__avatar">🤖</div>
                    <div className="mentor-chat__bubble-body">
                      <div className="ai-widget__typing-dots">
                        <span />
                        <span />
                        <span />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
            )}

            <form className="mentor-chat__input-row" onSubmit={onSubmit}>
              <input
                type="text"
                placeholder="Ask your mentor anything about your career path..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={sending}
              />
              <button className="btn btn-primary" disabled={sending || !input.trim()}>
                {sending ? "Thinking..." : "Send Message"}
              </button>
            </form>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}


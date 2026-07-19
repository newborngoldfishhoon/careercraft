import { useEffect, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../lib/api.js";

const STARTERS = [
  "What should I do next?",
  "I only have a few hours this week.",
  "I'm feeling stuck.",
  "Any resume tips?",
];

export default function Mentor() {
  const { user, loading: authLoading } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
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

  function onSubmit(e) {
    e.preventDefault();
    send();
  }

  return (
    <div>
      <Navbar />
      <section className="mentor-page">
        <div className="container mentor-page__inner">
          <p className="eyebrow">AI Mentor</p>
          <h1>Your ongoing guide, not a search box.</h1>
          <p className="mentor-page__sub">
            Unlike the quick assistant on the homepage, this remembers your committed career, roadmap progress, and
            readiness score across visits.
          </p>

          <div className="mentor-chat">
            {loading ? (
              <p className="mentor-chat__status">Loading your conversation…</p>
            ) : (
              <div className="mentor-chat__log">
                {messages.length === 0 && (
                  <div className="mentor-chat__empty">
                    <p>No messages yet — try one of these:</p>
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
                    <p>{m.content}</p>
                  </div>
                ))}
                {sending && (
                  <div className="mentor-chat__bubble mentor-chat__bubble--mentor mentor-chat__bubble--typing">
                    <p>Thinking…</p>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
            )}

            <form className="mentor-chat__input-row" onSubmit={onSubmit}>
              <input
                type="text"
                placeholder="Ask your mentor anything…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={sending}
              />
              <button className="btn btn-primary" disabled={sending || !input.trim()}>
                Send
              </button>
            </form>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}

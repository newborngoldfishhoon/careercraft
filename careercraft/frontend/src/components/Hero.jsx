import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

export default function Hero({ categories }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [prompt, setPrompt] = useState("");
  const [aiReply, setAiReply] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/careers/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data);
      } catch {
        setResults([]);
      }
    }, 250);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  async function askAssistant(e) {
    e.preventDefault();
    if (!prompt.trim()) return;
    setAiLoading(true);
    setAiReply(null);
    try {
      const res = await fetch("/api/ai/quick-guidance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      setAiReply(data);
    } catch {
      setAiReply({ reply: "Guidance is temporarily unavailable — try again in a moment.", suggestions: [] });
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <section id="top" className="hero">
      <div className="container hero__grid">
        <div className="hero__copy">
          <p className="eyebrow">Career discovery, decision, and growth — in one place</p>
          <h1 className="hero__headline">
            Stop guessing your future.
            <br />
            Build it.
          </h1>
          <p className="hero__sub">
            Explore real careers, compare them side by side, and follow a roadmap built for the one you choose —
            with an AI mentor that remembers where you left off.
          </p>

          <div className="hero__search-row">
            <div className="hero__search">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <input
                type="text"
                placeholder="Search a career — “UX designer”, “data analyst”…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Search careers"
              />
              {results.length > 0 && (
                <ul className="hero__search-results">
                  {results.map((r) => (
                    <li key={r.id}>
                      <Link to={`/careers/${r.slug}`} className="hero__search-link">
                        <span className="hero__search-title">{r.title}</span>
                        <span className="hero__search-summary">{r.summary}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <Link to="/assessment" className="btn btn-primary hero__cta">
              Not sure yet? Take the assessment
            </Link>
          </div>

          <div className="hero__categories">
            {(categories || []).slice(0, 7).map((c) => (
              <Link to={`/explore?category=${c.slug}`} className="hero__chip" key={c.slug}>
                {c.name}
              </Link>
            ))}
            <Link to="/explore" className="hero__chip hero__chip--muted">
              And more →
            </Link>
          </div>
        </div>

        <div className="hero__ai">
          <div className="hero__ai-card">
            <p className="hero__ai-label">
              <span className="hero__ai-dot" /> AI Career Assistant
            </p>
            <form onSubmit={askAssistant}>
              <textarea
                rows={3}
                placeholder="I enjoy coding and problem solving. What careers suit me?"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
              <button type="submit" className="btn btn-primary" disabled={aiLoading}>
                {aiLoading ? "Thinking…" : "Ask"}
              </button>
            </form>
            {aiReply && (
              <div className="hero__ai-reply">
                <p>{aiReply.reply}</p>
                {aiReply.suggestions?.length > 0 && (
                  <div className="hero__ai-suggestions">
                    {aiReply.suggestions.map((s) => (
                      <span className="hero__ai-suggestion" key={s}>
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

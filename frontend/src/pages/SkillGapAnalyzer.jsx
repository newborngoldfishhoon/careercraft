import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import { api } from "../lib/api.js";

export default function SkillGapAnalyzer() {
  const [careers, setCareers] = useState([]);
  const [mode, setMode] = useState("career"); // "career" | "manual"
  const [sourceSlug, setSourceSlug] = useState("");
  const [manualSkills, setManualSkills] = useState("");
  const [targetSlug, setTargetSlug] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/careers")
      .then((r) => r.json())
      .then(setCareers)
      .catch(() => setCareers([]));
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setResult(null);
    if (!targetSlug) {
      setError("Choose a target career.");
      return;
    }
    setBusy(true);
    try {
      const body =
        mode === "career"
          ? { source_type: "career", source_career_slug: sourceSlug, target_career_slug: targetSlug }
          : {
              source_type: "manual",
              current_skills: manualSkills.split(",").map((s) => s.trim()).filter(Boolean),
              target_career_slug: targetSlug,
            };
      const data = await api("/api/transition", { method: "POST", body, auth: false });
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <Navbar />
      <section className="transition-page">
        <div className="container transition-page__inner">
          <p className="eyebrow">Skill Gap &amp; Career Transition</p>
          <h1>See exactly what stands between you and a career.</h1>
          <p className="transition-page__sub">
            Compare your current skills — or the skill set of a career you already have — against any target career.
          </p>

          <div className="transition-mode">
            <button
              className={"transition-mode__btn" + (mode === "career" ? " transition-mode__btn--active" : "")}
              onClick={() => setMode("career")}
              type="button"
            >
              I'm coming from another career
            </button>
            <button
              className={"transition-mode__btn" + (mode === "manual" ? " transition-mode__btn--active" : "")}
              onClick={() => setMode("manual")}
              type="button"
            >
              I'll enter my skills
            </button>
          </div>

          <form className="transition-form" onSubmit={onSubmit}>
            {mode === "career" ? (
              <label>
                Your current career
                <select value={sourceSlug} onChange={(e) => setSourceSlug(e.target.value)} required>
                  <option value="">Choose a career…</option>
                  {careers.map((c) => (
                    <option value={c.slug} key={c.slug}>{c.title}</option>
                  ))}
                </select>
              </label>
            ) : (
              <label>
                Your current skills (comma-separated)
                <textarea
                  rows={3}
                  placeholder="e.g. Python, communication, project planning"
                  value={manualSkills}
                  onChange={(e) => setManualSkills(e.target.value)}
                  required
                />
              </label>
            )}

            <label>
              Target career
              <select value={targetSlug} onChange={(e) => setTargetSlug(e.target.value)} required>
                <option value="">Choose a career…</option>
                {careers.map((c) => (
                  <option value={c.slug} key={c.slug}>{c.title}</option>
                ))}
              </select>
            </label>

            <button className="btn btn-primary transition-form__submit" disabled={busy}>
              {busy ? "Analyzing…" : "Analyze the gap"}
            </button>
          </form>

          {error && <p className="auth-form__error transition-page__error">{error}</p>}

          {result && (
            <div className="transition-result">
              <div className="transition-result__head">
                <div>
                  <p className="transition-result__from">{result.source.label} → {result.target.title}</p>
                  <span className={"badge transition-result__difficulty transition-result__difficulty--" + result.difficultyLabel.split(" ")[0].toLowerCase()}>
                    {result.difficultyLabel}
                  </span>
                </div>
                <div className="transition-result__match">
                  <span className="transition-result__match-pct">{result.matchPercent}%</span>
                  <span className="transition-result__match-label">skills transfer</span>
                </div>
              </div>

              <div className="transition-result__cols">
                <div>
                  <h3>Skills you already have</h3>
                  {result.matched.length > 0 ? (
                    <div className="detail__tag-row">
                      {result.matched.map((s) => (
                        <span className="badge" key={s.name}>{s.name}</span>
                      ))}
                    </div>
                  ) : (
                    <p className="readiness-card__empty">None matched yet — that's fine, everyone starts somewhere.</p>
                  )}
                </div>
                <div>
                  <h3>Skills to build</h3>
                  <ul className="transition-result__missing-list">
                    {result.missing.map((s) => (
                      <li key={s.name}>
                        <strong>{s.name}</strong>
                        <span className="badge">{s.importance}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="transition-result__cols transition-result__cols--secondary">
                {result.recommendedCertifications.length > 0 && (
                  <div>
                    <h4>Worth certifying</h4>
                    <ul className="path-list path-list--light">
                      {result.recommendedCertifications.map((c) => (
                        <li key={c.name}>
                          <strong>{c.name}</strong>
                          <span>{c.benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {result.portfolioSuggestions.length > 0 && (
                  <div>
                    <h4>Portfolio ideas</h4>
                    <ul className="path-list path-list--light">
                      {result.portfolioSuggestions.map((p) => (
                        <li key={p}>
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {result.estimatedTimelineWeeks !== null && (
                  <div>
                    <h4>Estimated timeline</h4>
                    <p className="transition-result__timeline">~{result.estimatedTimelineWeeks} weeks</p>
                    <p className="transition-result__timeline-note">Scaled from the target roadmap by how much is still missing.</p>
                  </div>
                )}
              </div>

              <Link to={`/careers/${result.target.slug}`} className="btn btn-primary transition-result__cta">
                See full {result.target.title} profile
              </Link>
            </div>
          )}
        </div>
      </section>
      <Footer />
    </div>
  );
}

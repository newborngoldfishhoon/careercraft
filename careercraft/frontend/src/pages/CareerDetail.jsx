import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import CommitWidget from "../components/CommitWidget.jsx";
import SaveButton from "../components/SaveButton.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../lib/api.js";

export default function CareerDetail() {
  const { slug } = useParams();
  const { user } = useAuth();
  const [career, setCareer] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ok | notfound | error
  const [acquired, setAcquired] = useState(new Set());
  const [readiness, setReadiness] = useState(null);

  useEffect(() => {
    setStatus("loading");
    setCareer(null);
    fetch(`/api/careers/${slug}`)
      .then((r) => {
        if (r.status === 404) {
          setStatus("notfound");
          return null;
        }
        return r.json();
      })
      .then((data) => {
        if (data) {
          setCareer(data);
          setStatus("ok");
        }
      })
      .catch(() => setStatus("error"));
  }, [slug]);

  useEffect(() => {
    if (!user || status !== "ok") return;
    api(`/api/careers/${slug}/skills/progress`)
      .then((names) => setAcquired(new Set(names)))
      .catch(() => {});
    api(`/api/readiness/${slug}`)
      .then(setReadiness)
      .catch(() => setReadiness(null));
  }, [user, slug, status]);

  async function toggleSkill(name, currentlyAcquired) {
    const next = new Set(acquired);
    if (currentlyAcquired) next.delete(name);
    else next.add(name);
    setAcquired(next);
    try {
      const updatedReadiness = await api(`/api/careers/${slug}/skills/progress`, {
        method: "POST",
        body: { skill_name: name, acquired: !currentlyAcquired },
      });
      setReadiness(updatedReadiness);
    } catch {
      // revert on failure
      setAcquired(acquired);
    }
  }

  if (status === "loading") {
    return (
      <div>
        <Navbar />
        <div className="container detail__status">Loading career profile…</div>
        <Footer />
      </div>
    );
  }

  if (status === "notfound" || status === "error") {
    return (
      <div>
        <Navbar />
        <div className="container detail__status">
          <h1>Career not found</h1>
          <p>We don't have a full profile for this one yet.</p>
          <Link to="/explore" className="btn btn-primary">
            Back to Career Explorer
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const hasRichDetail = Boolean(career.about_what);

  return (
    <div>
      <Navbar />

      <section className="detail-hero">
        <div className="container">
          <p className="eyebrow">{career.category_slug.replace("-", " ")}</p>
          <h1>{career.title}</h1>
          <p className="detail-hero__summary">{career.summary}</p>

          <div className="detail-hero__snapshot">
            <Snapshot label="Avg. Salary" value={career.avg_salary} />
            <Snapshot label="Demand" value={career.demand_level} />
            <Snapshot label="Difficulty" value={career.difficulty_level} />
            <Snapshot label="Remote Potential" value={career.remote_potential} />
            <Snapshot label="Growth" value={career.growth_potential} />
            <Snapshot label="Rating" value={`${career.rating} / 5`} />
          </div>

          <div className="detail-hero__actions">
            <CommitWidget career={career} />
            <Link to={`/careers/${career.slug}/roadmap`} className="btn btn-ghost">
              View learning roadmap
            </Link>
            <SaveButton slug={career.slug} />
          </div>
        </div>
      </section>

      {!hasRichDetail && (
        <div className="container">
          <p className="detail__note">
            This career is in the Explorer with core stats, but its full profile (day-in-the-life, skills, roadmap,
            country breakdowns) hasn't been written yet — that's next.
          </p>
        </div>
      )}

      {hasRichDetail && (
        <>
          <section className="section">
            <div className="container detail-grid">
              <div>
                <h2>About this career</h2>
                <p className="detail__p">{career.about_what}</p>
                <h3 className="detail__h3">Why it exists</h3>
                <p className="detail__p">{career.about_why}</p>
                <div className="detail__fit-grid">
                  <div>
                    <h4>Good fit for</h4>
                    <p>{career.about_suitable}</p>
                  </div>
                  <div>
                    <h4>May not suit</h4>
                    <p>{career.about_not_suitable}</p>
                  </div>
                </div>
                <h3 className="detail__h3">Common misconception</h3>
                <p className="detail__p">{career.about_misconceptions}</p>
              </div>
            </div>
          </section>

          <section className="section section--navy">
            <div className="container">
              <h2>A day in the life</h2>
              <div className="detail-grid detail-grid--day">
                <div>
                  <h4>Responsibilities</h4>
                  <ul className="detail__list">
                    {career.day_responsibilities.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4>Schedule</h4>
                  <p>{career.day_schedule}</p>
                  <h4 className="detail__h4-spaced">Common challenges</h4>
                  <ul className="detail__list">
                    {career.day_challenges.map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4>Tools used</h4>
                  <div className="detail__tag-row">
                    {career.day_tools.map((t) => (
                      <span className="badge badge--navy" key={t}>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="section">
            <div className="container">
              <h2>Required skills</h2>
              {user && (
                <p className="detail__note detail__note--tight">
                  Mark the skills you already have — it feeds your readiness score below.
                </p>
              )}
              {readiness && <ReadinessCard readiness={readiness} slug={slug} />}
              <div className="skills-grid">
                <SkillGroup title="Technical" skills={career.skills_technical} acquired={acquired} onToggle={toggleSkill} user={user} />
                <SkillGroup title="Soft skills" skills={career.skills_soft} acquired={acquired} onToggle={toggleSkill} user={user} />
                <SkillGroup title="Industry" skills={career.skills_industry} acquired={acquired} onToggle={toggleSkill} user={user} />
              </div>
            </div>
          </section>

          <section className="section section--navy">
            <div className="container">
              <div className="detail-grid detail-grid--three">
                <div>
                  <h2>Education pathways</h2>
                  <ul className="path-list">
                    {career.education_pathways.map((p) => (
                      <li key={p.name}>
                        <strong>{p.name}</strong>
                        <span>{p.description}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="detail__edu-links">
                    <Link to="/colleges" className="btn btn-ghost btn-ghost--on-navy">Browse colleges</Link>
                    <Link to="/exams" className="btn btn-ghost btn-ghost--on-navy">Entrance exams</Link>
                  </div>
                </div>
                <div>
                  <h2>Certifications</h2>
                  <ul className="path-list">
                    {career.certifications.map((c) => (
                      <li key={c.name}>
                        <strong>
                          {c.name} <span className="badge badge--gold">{c.level}</span>
                        </strong>
                        <span>{c.benefit} · {c.cost}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h2>Specializations</h2>
                  <ul className="path-list">
                    {career.specializations.map((s) => (
                      <li key={s.name}>
                        <strong>{s.name}</strong>
                        <span>{s.description}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {career.countries.length > 0 && (
            <section className="section">
              <div className="container">
                <h2>Country &amp; location intelligence</h2>
                <div className="table-wrap">
                  <table className="country-table">
                    <thead>
                      <tr>
                        <th>Country</th>
                        <th>Avg. Salary</th>
                        <th>Entry</th>
                        <th>Senior</th>
                        <th>Demand</th>
                        <th>Competition</th>
                        <th>Top cities</th>
                        <th>Top employers</th>
                      </tr>
                    </thead>
                    <tbody>
                      {career.countries.map((c) => (
                        <tr key={c.country}>
                          <td>{c.country}</td>
                          <td>{c.avg_salary}</td>
                          <td>{c.entry_salary}</td>
                          <td>{c.senior_salary}</td>
                          <td>{c.demand_level}</td>
                          <td>{c.competition_level}</td>
                          <td>{c.top_cities}</td>
                          <td>{c.top_employers}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}
        </>
      )}

      <Footer />
    </div>
  );
}

function Snapshot({ label, value }) {
  return (
    <div className="snapshot">
      <span className="snapshot__value">{value}</span>
      <span className="snapshot__label">{label}</span>
    </div>
  );
}

function SkillGroup({ title, skills, acquired, onToggle, user }) {
  if (!skills || skills.length === 0) return null;
  return (
    <div className="skill-group">
      <h3>{title}</h3>
      {skills.map((s) => {
        const has = acquired?.has(s.name);
        return (
          <div className="skill-group__item" key={s.name}>
            <div className="skill-group__row">
              <div className="skill-group__name">
                {user && (
                  <button
                    className={"skill-group__check" + (has ? " skill-group__check--done" : "")}
                    onClick={() => onToggle(s.name, has)}
                    aria-pressed={has}
                    title={has ? "Marked as acquired" : "Mark as acquired"}
                  >
                    {has ? "✓" : ""}
                  </button>
                )}
                <strong>{s.name}</strong>
              </div>
              <span className="badge">{s.importance}</span>
            </div>
            <p>{s.description}</p>
          </div>
        );
      })}
    </div>
  );
}

function ReadinessCard({ readiness, slug }) {
  return (
    <div className="readiness-card">
      <div className="readiness-card__score">
        <span className="readiness-card__pct">{readiness.score}%</span>
        <span className="readiness-card__label">Your readiness for {readiness.title}</span>
      </div>
      <div className="readiness-card__cols">
        <div>
          <h4>Strengths</h4>
          {readiness.strengths.length > 0 ? (
            <div className="detail__tag-row">
              {readiness.strengths.map((s) => (
                <span className="badge" key={s}>{s}</span>
              ))}
            </div>
          ) : (
            <p className="readiness-card__empty">None marked yet.</p>
          )}
        </div>
        <div>
          <h4>Priority to improve</h4>
          {readiness.priorityImprovements.length > 0 ? (
            <div className="detail__tag-row">
              {readiness.priorityImprovements.map((s) => (
                <span className="badge badge--gold" key={s}>{s}</span>
              ))}
            </div>
          ) : (
            <p className="readiness-card__empty">Nothing critical missing.</p>
          )}
        </div>
      </div>
      <p className="readiness-card__next">
        <strong>Recommended next step:</strong> {readiness.recommendedNextStep}
        {readiness.estimatedTimelineWeeks !== null && ` (~${readiness.estimatedTimelineWeeks}w remaining on the roadmap)`}
      </p>
      <Link to={`/careers/${slug}/roadmap`} className="btn btn-ghost readiness-card__cta">
        View roadmap
      </Link>
    </div>
  );
}

import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../lib/api.js";

export default function CareerRoadmap() {
  const { slug } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("loading");
  const [activeStage, setActiveStage] = useState("beginner");
  const [localDone, setLocalDone] = useState({}); // session-only fallback for logged-out users
  const [toggling, setToggling] = useState(null);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, user]);

  function load() {
    setStatus("loading");
    api(`/api/careers/${slug}/roadmap`)
      .then((d) => {
        setData(d);
        setStatus("ok");
      })
      .catch(() => setStatus("notfound"));
  }

  async function toggle(milestoneId, currentlyDone) {
    if (!user) {
      setLocalDone((prev) => ({ ...prev, [milestoneId]: !prev[milestoneId] }));
      return;
    }
    setToggling(milestoneId);
    try {
      const d = await api(`/api/careers/${slug}/roadmap/progress`, {
        method: "POST",
        body: { milestone_id: milestoneId, completed: !currentlyDone },
      });
      setData(d);
    } catch {
      // ignore — leave state as-is on failure
    } finally {
      setToggling(null);
    }
  }

  if (status === "loading") {
    return (
      <div>
        <Navbar />
        <div className="container roadmap__status">Loading roadmap…</div>
        <Footer />
      </div>
    );
  }

  if (status === "notfound" || !data) {
    return (
      <div>
        <Navbar />
        <div className="container roadmap__status">
          <h1>No roadmap yet</h1>
          <p>This career doesn't have a written roadmap yet.</p>
          <Link to={`/careers/${slug}`} className="btn btn-primary">
            Back to career profile
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const isDone = (m) => (user ? m.completed : !!localDone[m.id]);

  const allMilestones = data.stages.flatMap((s) => s.milestones);
  const totalWeeks = allMilestones.reduce((sum, m) => sum + (m.weeks || 0), 0);
  const completedCount = allMilestones.filter(isDone).length;
  const overallPct = allMilestones.length ? Math.round((completedCount / allMilestones.length) * 100) : 0;

  const stage = data.stages.find((s) => s.key === activeStage) || data.stages[0];
  const stageCompleted = stage.milestones.filter(isDone).length;
  const stagePct = stage.milestones.length ? Math.round((stageCompleted / stage.milestones.length) * 100) : 0;

  return (
    <div>
      <Navbar />

      <section className="roadmap-hero">
        <div className="container">
          <p className="eyebrow">Learning Roadmap</p>
          <h1>{data.title}</h1>
          <p className="roadmap-hero__sub">
            A staged path from fundamentals to job-ready — roughly {totalWeeks} weeks end to end at a steady pace.
          </p>

          <div className="roadmap-hero__progress">
            <div className="roadmap-hero__progress-track">
              <div className="roadmap-hero__progress-fill" style={{ width: `${overallPct}%` }} />
            </div>
            <span>{overallPct}% complete ({completedCount}/{allMilestones.length} milestones)</span>
          </div>
          {user ? (
            <p className="roadmap-hero__note roadmap-hero__note--saved">Progress is saved to your account.</p>
          ) : (
            <p className="roadmap-hero__note">
              <Link to="/login">Log in</Link> to save this progress permanently — right now it'll reset when you leave
              the page.
            </p>
          )}
        </div>
      </section>

      <section className="section roadmap-body">
        <div className="container">
          <div className="roadmap-tabs">
            {data.stages.map((s) => {
              const w = s.milestones.reduce((sum, m) => sum + (m.weeks || 0), 0);
              return (
                <button
                  key={s.key}
                  className={"roadmap-tab" + (activeStage === s.key ? " roadmap-tab--active" : "")}
                  onClick={() => setActiveStage(s.key)}
                >
                  {s.label}
                  <span className="roadmap-tab__meta">~{w}w</span>
                </button>
              );
            })}
          </div>

          <div className="roadmap-stage">
            <div className="roadmap-stage__head">
              <h2>{stage.label}</h2>
              <span className="roadmap-stage__pct">{stagePct}% of this stage</span>
            </div>
            <div className="roadmap-stage__track">
              <div className="roadmap-stage__fill" style={{ width: `${stagePct}%` }} />
            </div>

            <ol className="roadmap-timeline">
              {stage.milestones.map((m, i) => {
                const done = isDone(m);
                return (
                  <li key={m.id} className={"roadmap-milestone" + (done ? " roadmap-milestone--done" : "")}>
                    <button
                      className="roadmap-milestone__check"
                      onClick={() => toggle(m.id, done)}
                      aria-pressed={done}
                      disabled={toggling === m.id}
                    >
                      {done ? "✓" : i + 1}
                    </button>
                    <div className="roadmap-milestone__body">
                      <div className="roadmap-milestone__title-row">
                        <h3>{m.title}</h3>
                        <span className="badge">~{m.weeks}w</span>
                      </div>
                      <p>{m.description}</p>
                      {m.resources?.length > 0 && (
                        <div className="roadmap-milestone__resources">
                          {m.resources.map((r) => (
                            <span className="badge" key={r.name}>
                              {r.type}: {r.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>

          <Link to={`/careers/${slug}`} className="btn btn-ghost roadmap-body__back">
            ← Back to {data.title} profile
          </Link>
          <Link to={`/resources?career=${slug}`} className="btn btn-ghost roadmap-body__resources-link">
            Browse more resources for this career →
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}

import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../lib/api.js";

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    api("/api/dashboard")
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [user]);

  if (authLoading) return null;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div>
      <Navbar />
      <section className="dashboard">
        <div className="container">
          <p className="eyebrow">Your dashboard</p>
          <h1>Welcome back, {user.name.split(" ")[0]}.</h1>

          <div className="dashboard__quicklinks">
            <Link to="/mentor" className="dashboard__quicklink">💬 AI Mentor</Link>
            <Link to="/opportunities" className="dashboard__quicklink">🎯 Opportunity Hub</Link>
            <Link to="/applications" className="dashboard__quicklink">📋 Application Tracker</Link>
          </div>

          {loading && <p className="dashboard__status">Loading your progress…</p>}

          {!loading && data && !data.commitment && (
            <div className="dashboard__empty">
              <h2>You haven't committed to a career yet.</h2>
              <p>Commit to one from its profile page to turn it into a tracked mission with a roadmap.</p>
              <div className="dashboard__empty-actions">
                <Link to="/assessment" className="btn btn-primary">Take the Career Match Assessment</Link>
                <Link to="/explore" className="btn btn-ghost">Browse careers</Link>
              </div>
            </div>
          )}

          {!loading && data && data.commitment && (
            <>
              <div className="dashboard__mission">
                <p className="dashboard__mission-label">Your mission</p>
                <h2>{data.commitment.mission_title}</h2>
                <div className="dashboard__mission-meta">
                  <span>
                    Career: <Link to={`/careers/${data.commitment.career.slug}`}>{data.commitment.career.title}</Link>
                  </span>
                  {data.commitment.target_date && <span>Target: {data.commitment.target_date}</span>}
                </div>
              </div>

              {data.roadmap && (
                <div className="dashboard__grid">
                  <div className="card dashboard__card">
                    <p className="dashboard__card-label">Readiness score</p>
                    <div className="dashboard__big-stat">{data.readiness ? data.readiness.score : 0}%</div>
                    <p className="dashboard__card-sub">
                      Combines roadmap progress and the skills you've marked as acquired.
                    </p>
                    {data.readiness && data.readiness.priorityImprovements.length > 0 && (
                      <div className="detail__tag-row dashboard__readiness-tags">
                        {data.readiness.priorityImprovements.map((s) => (
                          <span className="badge badge--gold" key={s}>{s}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="card dashboard__card">
                    <p className="dashboard__card-label">Roadmap progress</p>
                    <div className="dashboard__big-stat">{data.roadmap.percent}%</div>
                    <div className="roadmap-hero__progress-track">
                      <div className="roadmap-hero__progress-fill" style={{ width: `${data.roadmap.percent}%` }} />
                    </div>
                    <p className="dashboard__card-sub">
                      {data.roadmap.completedCount} of {data.roadmap.totalCount} milestones complete
                    </p>
                    <Link to={`/careers/${data.commitment.career.slug}/roadmap`} className="btn btn-primary dashboard__card-cta">
                      Open full roadmap
                    </Link>
                  </div>

                  <div className="card dashboard__card">
                    <p className="dashboard__card-label">Up next</p>
                    {data.roadmap.nextMilestones.length === 0 ? (
                      <p className="dashboard__done-message">Every milestone is complete. 🎉</p>
                    ) : (
                      <ul className="dashboard__next-list">
                        {data.roadmap.nextMilestones.map((m) => (
                          <li key={m.id}>
                            <span className="badge">{m.stage}</span>
                            <strong>{m.title}</strong>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {!loading && data && data.savedCareers.length > 0 && (
            <div className="dashboard__saved">
              <h2>Saved careers</h2>
              <div className="explorer__grid">
                {data.savedCareers.map((c) => (
                  <Link to={`/careers/${c.slug}`} className="career-card" key={c.slug}>
                    <div className="career-card__top">
                      <h3>{c.title}</h3>
                      <span className="career-card__salary">{c.avg_salary}</span>
                    </div>
                    <p className="career-card__summary">{c.summary}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
      <Footer />
    </div>
  );
}

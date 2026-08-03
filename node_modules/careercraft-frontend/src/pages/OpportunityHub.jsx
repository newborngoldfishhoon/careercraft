import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../lib/api.js";

function OpportunityCard({ opp, onTrack, tracked }) {
  return (
    <div className="opp-card">
      <div className="opp-card__top">
        <span className="badge">{opp.type}</span>
        {opp.remote ? <span className="badge badge--gold">Remote</span> : null}
      </div>
      <h3>{opp.title}</h3>
      <p className="opp-card__org">{opp.organization} · {opp.location}</p>
      <p className="opp-card__desc">{opp.description}</p>
      <div className="opp-card__meta">
        <span>For: <Link to={`/careers/${opp.career_slug}`}>{opp.career_title}</Link></span>
        {opp.deadline && <span>Deadline: {opp.deadline}</span>}
      </div>
      <div className="opp-card__actions">
        {opp.url && (
          <a href={opp.url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
            View listing ↗
          </a>
        )}
        <button className="btn btn-primary" onClick={() => onTrack(opp)} disabled={tracked}>
          {tracked ? "✓ Tracking" : "Track this"}
        </button>
      </div>
    </div>
  );
}

export default function OpportunityHub() {
  const { user } = useAuth();
  const [opportunities, setOpportunities] = useState([]);
  const [types, setTypes] = useState([]);
  const [careers, setCareers] = useState([]);
  const [type, setType] = useState("");
  const [career, setCareer] = useState("");
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [recommended, setRecommended] = useState(null);
  const [trackedIds, setTrackedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api("/api/opportunities/types", { auth: false }).then(setTypes).catch(() => setTypes([]));
    fetch("/api/careers").then((r) => r.json()).then(setCareers).catch(() => setCareers([]));
  }, []);

  useEffect(() => {
    if (!user) return;
    api("/api/opportunities/recommended")
      .then(setRecommended)
      .catch(() => setRecommended(null));
    api("/api/applications")
      .then((apps) => setTrackedIds(new Set(apps.filter((a) => a.opportunity_id).map((a) => a.opportunity_id))))
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (type) params.set("type", type);
    if (career) params.set("career", career);
    if (remoteOnly) params.set("remote", "true");
    fetch(`/api/opportunities?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        setOpportunities(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [type, career, remoteOnly]);

  async function track(opp) {
    if (!user) return;
    try {
      await api("/api/applications", { method: "POST", body: { opportunity_id: opp.id } });
      setTrackedIds((prev) => new Set(prev).add(opp.id));
    } catch {
      // ignore — non-critical
    }
  }

  return (
    <div>
      <Navbar />
      <section className="opp-page">
        <div className="container">
          <p className="eyebrow">Opportunity Hub</p>
          <h1>Where learning turns into applications.</h1>
          <p className="opp-page__sub">Jobs, internships, scholarships, hackathons, and more — filtered by career.</p>

          {user && (
            <div className="opp-page__recs">
              {recommended === null ? null : recommended.reason === "no-commitment" ? (
                <p className="opp-page__recs-empty">
                  Commit to a career on its profile page to see opportunities picked for your stage.
                </p>
              ) : recommended.opportunities.length > 0 ? (
                <>
                  <h2>Recommended for you</h2>
                  <p className="opp-page__recs-sub">
                    Based on your readiness score ({recommended.readinessScore}%) — {recommended.readinessScore < 50 ? "leading with entry points like internships and bootcamps" : "leading with roles and fellowships you're ready for"}.
                  </p>
                  <div className="opp-grid">
                    {recommended.opportunities.map((o) => (
                      <OpportunityCard key={o.id} opp={o} onTrack={track} tracked={trackedIds.has(o.id)} />
                    ))}
                  </div>
                </>
              ) : null}
            </div>
          )}

          <h2 className="opp-page__browse-head">Browse all opportunities</h2>
          <div className="opp-filters">
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="">All types</option>
              {types.map((t) => (
                <option value={t} key={t}>{t}</option>
              ))}
            </select>
            <select value={career} onChange={(e) => setCareer(e.target.value)}>
              <option value="">All careers</option>
              {careers.map((c) => (
                <option value={c.slug} key={c.slug}>{c.title}</option>
              ))}
            </select>
            <label className="opp-filters__checkbox">
              <input type="checkbox" checked={remoteOnly} onChange={(e) => setRemoteOnly(e.target.checked)} />
              Remote only
            </label>
          </div>

          {loading ? (
            <p className="explorer__status">Loading opportunities…</p>
          ) : opportunities.length === 0 ? (
            <p className="explorer__status">Nothing matches those filters yet.</p>
          ) : (
            <div className="opp-grid">
              {opportunities.map((o) => (
                <OpportunityCard key={o.id} opp={o} onTrack={track} tracked={trackedIds.has(o.id)} />
              ))}
            </div>
          )}

          {user && (
            <Link to="/applications" className="btn btn-ghost opp-page__tracker-link">
              View your application tracker →
            </Link>
          )}
        </div>
      </section>
      <Footer />
    </div>
  );
}

import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";

const LEVELS = ["Beginner", "Intermediate", "Advanced"];
const COSTS = ["Free", "Paid"];

export default function ResourceLibrary() {
  const [searchParams] = useSearchParams();
  const [resources, setResources] = useState([]);
  const [types, setTypes] = useState([]);
  const [careers, setCareers] = useState([]);
  const [type, setType] = useState("");
  const [career, setCareer] = useState(searchParams.get("career") || "");
  const [level, setLevel] = useState("");
  const [cost, setCost] = useState("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/resources/types").then((r) => r.json()).then(setTypes).catch(() => setTypes([]));
    fetch("/api/careers").then((r) => r.json()).then(setCareers).catch(() => setCareers([]));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (type) params.set("type", type);
    if (career) params.set("career", career);
    if (level) params.set("level", level);
    if (cost) params.set("cost", cost);
    if (q) params.set("q", q);
    fetch(`/api/resources?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        setResources(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [type, career, level, cost, q]);

  return (
    <div>
      <Navbar />
      <section className="resource-page">
        <div className="container">
          <p className="eyebrow">Resource Library</p>
          <h1>Everything worth learning from, in one place.</h1>
          <p className="resource-page__sub">
            YouTube channels, docs, courses, books, communities, and practice platforms — filtered by career and level.
          </p>

          <div className="opp-filters resource-page__filters">
            <input
              type="text"
              className="explorer__search"
              placeholder="Search resources…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
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
            <select value={level} onChange={(e) => setLevel(e.target.value)}>
              <option value="">Any level</option>
              {LEVELS.map((l) => (
                <option value={l} key={l}>{l}</option>
              ))}
            </select>
            <select value={cost} onChange={(e) => setCost(e.target.value)}>
              <option value="">Free or paid</option>
              {COSTS.map((c) => (
                <option value={c} key={c}>{c}</option>
              ))}
            </select>
          </div>

          {loading ? (
            <p className="explorer__status">Loading resources…</p>
          ) : resources.length === 0 ? (
            <p className="explorer__status">Nothing matches those filters yet.</p>
          ) : (
            <div className="opp-grid">
              {resources.map((r) => (
                <div className="opp-card resource-card" key={r.id}>
                  <div className="opp-card__top">
                    <span className="badge">{r.type}</span>
                    <span className="badge">{r.cost}</span>
                    {r.is_trending ? <span className="badge badge--gold">Trending</span> : null}
                  </div>
                  <h3>{r.title}</h3>
                  <p className="opp-card__org">{r.level} · <Link to={`/careers/${r.career_slug}`}>{r.career_title}</Link></p>
                  <p className="opp-card__desc">{r.description}</p>
                  {r.is_community_favorite ? <p className="resource-card__favorite">★ Community favorite</p> : null}
                  {r.url && (
                    <a href={r.url} target="_blank" rel="noopener noreferrer" className="btn btn-primary resource-card__cta">
                      Open resource ↗
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
      <Footer />
    </div>
  );
}

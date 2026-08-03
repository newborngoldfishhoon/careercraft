import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";

const TYPES = ["Government", "Private", "International", "Specialized", "Online"];

export default function CollegeExplorer() {
  const [colleges, setColleges] = useState([]);
  const [countries, setCountries] = useState([]);
  const [type, setType] = useState("");
  const [country, setCountry] = useState("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/colleges")
      .then((r) => r.json())
      .then((data) => setCountries([...new Set(data.map((c) => c.country))].sort()))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (type) params.set("type", type);
    if (country) params.set("country", country);
    if (q) params.set("q", q);
    fetch(`/api/colleges?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        setColleges(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [type, country, q]);

  return (
    <div>
      <Navbar />
      <section className="college-page">
        <div className="container">
          <p className="eyebrow">College &amp; Education Explorer</p>
          <h1>Find the program behind the career.</h1>
          <p className="college-page__sub">
            Government, private, international, specialized, and online institutions — with real placement and fee data.
          </p>

          <div className="explorer__controls college-page__controls">
            <input
              type="text"
              className="explorer__search"
              placeholder="Search colleges…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="">All types</option>
              {TYPES.map((t) => (
                <option value={t} key={t}>{t}</option>
              ))}
            </select>
            <select value={country} onChange={(e) => setCountry(e.target.value)}>
              <option value="">All countries</option>
              {countries.map((c) => (
                <option value={c} key={c}>{c}</option>
              ))}
            </select>
          </div>

          {loading ? (
            <p className="explorer__status">Loading colleges…</p>
          ) : colleges.length === 0 ? (
            <p className="explorer__status">No colleges match those filters.</p>
          ) : (
            <div className="explorer__grid">
              {colleges.map((c) => (
                <Link to={`/colleges/${c.slug}`} className="college-card" key={c.slug}>
                  <div className="college-card__top">
                    <span className="badge">{c.type}</span>
                    <span className="college-card__rating">★ {c.rating}</span>
                  </div>
                  <h3>{c.name}</h3>
                  <p className="college-card__location">{c.location}, {c.country}</p>
                  <p className="college-card__overview">{c.overview}</p>
                  <div className="college-card__stats">
                    <span>{c.fees}</span>
                    {c.placements_percent !== null && <span>{c.placements_percent}% placed</span>}
                  </div>
                </Link>
              ))}
            </div>
          )}

          <Link to="/exams" className="btn btn-ghost college-page__exams-link">
            Looking for entrance exam guidance instead? →
          </Link>
        </div>
      </section>
      <Footer />
    </div>
  );
}

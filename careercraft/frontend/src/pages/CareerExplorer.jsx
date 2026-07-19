import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import CareerCard from "../components/CareerCard.jsx";

const DIFFICULTIES = ["Moderate", "High"];
const REMOTES = ["Low", "Moderate", "High"];
const DEMANDS = ["Moderate", "High", "Very High"];

export default function CareerExplorer() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [careers, setCareers] = useState([]);
  const [loading, setLoading] = useState(true);

  const category = searchParams.get("category") || "";
  const difficulty = searchParams.get("difficulty") || "";
  const remote = searchParams.get("remote") || "";
  const demand = searchParams.get("demand") || "";
  const q = searchParams.get("q") || "";
  const sort = searchParams.get("sort") || "";

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (difficulty) params.set("difficulty", difficulty);
    if (remote) params.set("remote", remote);
    if (demand) params.set("demand", demand);
    if (q) params.set("q", q);
    if (sort) params.set("sort", sort);

    fetch(`/api/careers?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        setCareers(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [category, difficulty, remote, demand, q, sort]);

  function updateParam(key, value) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
  }

  function clearFilters() {
    setSearchParams({});
  }

  const activeFilterCount = [category, difficulty, remote, demand].filter(Boolean).length;

  return (
    <div>
      <Navbar />
      <section className="explorer">
        <div className="container">
          <div className="explorer__head">
            <p className="eyebrow">Career Explorer</p>
            <h1>Browse careers by category, not the alphabet.</h1>
            <p className="explorer__sub">No account needed. Filter by what actually matters to you.</p>
          </div>

          <div className="explorer__controls">
            <input
              type="text"
              className="explorer__search"
              placeholder="Search careers…"
              value={q}
              onChange={(e) => updateParam("q", e.target.value)}
            />

            <select value={category} onChange={(e) => updateParam("category", e.target.value)}>
              <option value="">All categories</option>
              {categories.map((c) => (
                <option value={c.slug} key={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>

            <select value={difficulty} onChange={(e) => updateParam("difficulty", e.target.value)}>
              <option value="">Any difficulty</option>
              {DIFFICULTIES.map((d) => (
                <option value={d} key={d}>
                  {d}
                </option>
              ))}
            </select>

            <select value={remote} onChange={(e) => updateParam("remote", e.target.value)}>
              <option value="">Any remote potential</option>
              {REMOTES.map((r) => (
                <option value={r} key={r}>
                  {r}
                </option>
              ))}
            </select>

            <select value={demand} onChange={(e) => updateParam("demand", e.target.value)}>
              <option value="">Any demand</option>
              {DEMANDS.map((d) => (
                <option value={d} key={d}>
                  {d}
                </option>
              ))}
            </select>

            <select value={sort} onChange={(e) => updateParam("sort", e.target.value)}>
              <option value="">Sort: Recommended</option>
              <option value="rating">Sort: Highest rated</option>
              <option value="trending">Sort: Trending</option>
            </select>

            {(activeFilterCount > 0 || q) && (
              <button className="btn btn-ghost explorer__clear" onClick={clearFilters}>
                Clear filters
              </button>
            )}
          </div>

          {loading ? (
            <p className="explorer__status">Loading careers…</p>
          ) : careers.length === 0 ? (
            <p className="explorer__status">No careers match those filters yet — try loosening one.</p>
          ) : (
            <>
              <p className="explorer__count">{careers.length} career{careers.length === 1 ? "" : "s"}</p>
              <div className="explorer__grid">
                {careers.map((c) => (
                  <CareerCard career={c} key={c.slug} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>
      <Footer />
    </div>
  );
}

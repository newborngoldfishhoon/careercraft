import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";

const METRICS = [
  { key: "avg_salary", label: "Average Salary" },
  { key: "demand_level", label: "Demand" },
  { key: "growth_potential", label: "Growth Potential" },
  { key: "difficulty_level", label: "Difficulty" },
  { key: "remote_potential", label: "Remote Potential" },
  { key: "education_requirement", label: "Education" },
  { key: "rating", label: "Rating" },
];

export default function CareerCompare() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [allCareers, setAllCareers] = useState([]);
  const [slots, setSlots] = useState(() => {
    const fromUrl = (searchParams.get("slugs") || "").split(",").filter(Boolean);
    return [fromUrl[0] || "", fromUrl[1] || "", fromUrl[2] || ""];
  });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/careers")
      .then((r) => r.json())
      .then(setAllCareers)
      .catch(() => setAllCareers([]));
  }, []);

  const chosenSlugs = slots.filter(Boolean);

  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    if (chosenSlugs.length >= 2) next.set("slugs", chosenSlugs.join(","));
    else next.delete("slugs");
    setSearchParams(next, { replace: true });

    if (chosenSlugs.length < 2) {
      setData(null);
      return;
    }
    setLoading(true);
    fetch(`/api/careers/compare?slugs=${chosenSlugs.join(",")}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d.careers ? d : null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chosenSlugs.join(",")]);

  function setSlot(index, slug) {
    const next = [...slots];
    next[index] = slug;
    setSlots(next);
  }

  return (
    <div>
      <Navbar />
      <section className="compare-page">
        <div className="container">
          <p className="eyebrow">Career Comparison</p>
          <h1>Put two or three careers side by side.</h1>
          <p className="compare-page__sub">Pick at least two to see how they stack up.</p>

          <div className="compare-page__pickers">
            {[0, 1, 2].map((i) => (
              <select
                key={i}
                value={slots[i]}
                onChange={(e) => setSlot(i, e.target.value)}
              >
                <option value="">{i < 2 ? `Choose career ${i + 1}` : "Choose career 3 (optional)"}</option>
                {allCareers.map((c) => (
                  <option value={c.slug} key={c.slug} disabled={slots.includes(c.slug) && slots[i] !== c.slug}>
                    {c.title}
                  </option>
                ))}
              </select>
            ))}
          </div>

          {loading && <p className="compare-page__status">Comparing…</p>}

          {!loading && chosenSlugs.length < 2 && (
            <p className="compare-page__status">Choose at least two careers above to compare them.</p>
          )}

          {!loading && data && (
            <>
              <div className="table-wrap compare-page__table-wrap">
                <table className="compare-table">
                  <thead>
                    <tr>
                      <th></th>
                      {data.careers.map((c) => (
                        <th key={c.slug}>
                          <Link to={`/careers/${c.slug}`}>{c.title}</Link>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {METRICS.map((m) => (
                      <tr key={m.key}>
                        <th>{m.label}</th>
                        {data.careers.map((c) => (
                          <td key={c.slug}>{m.key === "rating" ? `${c[m.key]} / 5` : c[m.key]}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="compare-page__insights">
                <h2>What stands out</h2>
                <div className="compare-page__insights-grid">
                  {data.insights.map((ins) => (
                    <div className="card compare-page__insight-card" key={ins.slug}>
                      <h3>{ins.title}</h3>
                      <p className="compare-page__insight-label">Strengths</p>
                      <ul>
                        {ins.strengths.map((s) => (
                          <li key={s}>{s}</li>
                        ))}
                      </ul>
                      <p className="compare-page__insight-label">Tradeoffs</p>
                      <ul>
                        {ins.tradeoffs.map((t) => (
                          <li key={t}>{t}</li>
                        ))}
                      </ul>
                      <Link to={`/careers/${ins.slug}`} className="btn btn-ghost compare-page__insight-link">
                        Full profile
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </section>
      <Footer />
    </div>
  );
}

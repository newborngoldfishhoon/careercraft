import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";

export default function CollegeDetail() {
  const { slug } = useParams();
  const [college, setCollege] = useState(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    setStatus("loading");
    fetch(`/api/colleges/${slug}`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data) => {
        setCollege(data);
        setStatus("ok");
      })
      .catch(() => setStatus("notfound"));
  }, [slug]);

  if (status === "loading") {
    return (
      <div>
        <Navbar />
        <div className="container detail__status">Loading college profile…</div>
        <Footer />
      </div>
    );
  }

  if (status === "notfound" || !college) {
    return (
      <div>
        <Navbar />
        <div className="container detail__status">
          <h1>College not found</h1>
          <Link to="/colleges" className="btn btn-primary">Back to College Explorer</Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div>
      <Navbar />

      <section className="detail-hero">
        <div className="container">
          <p className="eyebrow">{college.type} · {college.country}</p>
          <h1>{college.name}</h1>
          <p className="detail-hero__summary">{college.overview}</p>

          <div className="detail-hero__snapshot">
            <Snapshot label="Location" value={college.location} />
            <Snapshot label="Fees" value={college.fees} />
            {college.placements_percent !== null && <Snapshot label="Placements" value={`${college.placements_percent}%`} />}
            {college.avg_package && <Snapshot label="Avg. Package" value={college.avg_package} />}
            <Snapshot label="Acceptance Rate" value={college.acceptance_rate} />
            <Snapshot label="Rating" value={`${college.rating} / 5`} />
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container detail-grid">
          <div>
            <h2>Programs offered</h2>
            <div className="detail__tag-row">
              {college.programs.map((p) => (
                <span className="badge" key={p}>{p}</span>
              ))}
            </div>

            <h3 className="detail__h3">Admission requirements</h3>
            <p className="detail__p">{college.admission_requirements}</p>

            {college.scholarships && (
              <>
                <h3 className="detail__h3">Scholarships</h3>
                <p className="detail__p">{college.scholarships}</p>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="section section--navy">
        <div className="container">
          <div className="detail-grid detail-grid--day">
            {college.top_recruiters.length > 0 && (
              <div>
                <h4>Top recruiters</h4>
                <div className="detail__tag-row">
                  {college.top_recruiters.map((r) => (
                    <span className="badge badge--navy" key={r}>{r}</span>
                  ))}
                </div>
              </div>
            )}
            <div>
              <h4>Campus highlights</h4>
              <ul className="detail__list">
                {college.campus_highlights.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
            </div>
            {college.related_career_slugs.length > 0 && (
              <div>
                <h4>Relevant careers</h4>
                <div className="detail__tag-row">
                  {college.related_career_slugs.map((slug) => (
                    <Link to={`/careers/${slug}`} className="badge badge--navy" key={slug}>
                      {slug.replace(/-/g, " ")}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="container">
        <Link to="/colleges" className="btn btn-ghost roadmap-body__back">
          ← Back to College Explorer
        </Link>
      </div>

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

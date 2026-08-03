import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";

export default function EntranceExams() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/exams")
      .then((r) => r.json())
      .then((data) => {
        setExams(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div>
      <Navbar />
      <section className="college-page">
        <div className="container">
          <p className="eyebrow">Entrance Exams</p>
          <h1>Know what you're preparing for.</h1>
          <p className="college-page__sub">Syllabus, difficulty, and a realistic prep strategy for each major exam.</p>

          {loading ? (
            <p className="explorer__status">Loading exams…</p>
          ) : (
            <div className="explorer__grid">
              {exams.map((e) => (
                <Link to={`/exams/${e.slug}`} className="career-card" key={e.slug}>
                  <div className="career-card__top">
                    <h3>{e.name}</h3>
                    <span className="badge">{e.difficulty}</span>
                  </div>
                  <p className="career-card__summary">{e.overview}</p>
                </Link>
              ))}
            </div>
          )}

          <Link to="/colleges" className="btn btn-ghost college-page__exams-link">
            ← Back to College Explorer
          </Link>
        </div>
      </section>
      <Footer />
    </div>
  );
}

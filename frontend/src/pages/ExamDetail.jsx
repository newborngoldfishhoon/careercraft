import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";

export default function ExamDetail() {
  const { slug } = useParams();
  const [exam, setExam] = useState(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    setStatus("loading");
    fetch(`/api/exams/${slug}`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data) => {
        setExam(data);
        setStatus("ok");
      })
      .catch(() => setStatus("notfound"));
  }, [slug]);

  if (status === "loading") {
    return (
      <div>
        <Navbar />
        <div className="container detail__status">Loading exam profile…</div>
        <Footer />
      </div>
    );
  }

  if (status === "notfound" || !exam) {
    return (
      <div>
        <Navbar />
        <div className="container detail__status">
          <h1>Exam not found</h1>
          <Link to="/exams" className="btn btn-primary">Back to Entrance Exams</Link>
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
          <p className="eyebrow">Entrance Exam</p>
          <h1>{exam.name}</h1>
          <p className="detail-hero__summary">{exam.overview}</p>
          <div className="detail-hero__snapshot">
            <Snapshot label="Difficulty" value={exam.difficulty} />
            <Snapshot label="Important Dates" value={exam.important_dates} />
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container detail-grid">
          <div>
            <h2>Eligibility</h2>
            <p className="detail__p">{exam.eligibility}</p>

            <h3 className="detail__h3">Syllabus</h3>
            <div className="detail__tag-row">
              {exam.syllabus.map((s) => (
                <span className="badge" key={s}>{s}</span>
              ))}
            </div>

            <h3 className="detail__h3">Past trends</h3>
            <p className="detail__p">{exam.past_trends}</p>

            <h3 className="detail__h3">Recommended strategy</h3>
            <p className="detail__p">{exam.recommended_strategy}</p>
          </div>
        </div>
      </section>

      <section className="section section--navy">
        <div className="container">
          <div className="detail-grid detail-grid--day">
            <div>
              <h4>Prep resources</h4>
              <div className="detail__tag-row">
                {exam.prep_resources.map((r) => (
                  <span className="badge badge--navy" key={r.name}>{r.type}: {r.name}</span>
                ))}
              </div>
            </div>
            {exam.related_career_slugs.length > 0 && (
              <div>
                <h4>Leads toward</h4>
                <div className="detail__tag-row">
                  {exam.related_career_slugs.map((slug) => (
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
        <Link to="/exams" className="btn btn-ghost roadmap-body__back">
          ← Back to Entrance Exams
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

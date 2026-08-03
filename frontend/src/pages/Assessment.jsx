import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";

export default function Assessment() {
  const [questions, setQuestions] = useState([]);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({}); // questionId -> tag
  const [phase, setPhase] = useState("loading"); // loading | quiz | submitting | results | error
  const [results, setResults] = useState(null);

  useEffect(() => {
    fetch("/api/assessment/questions")
      .then((r) => r.json())
      .then((data) => {
        setQuestions(data);
        setPhase("quiz");
      })
      .catch(() => setPhase("error"));
  }, []);

  function selectOption(questionId, tag) {
    const next = { ...answers, [questionId]: tag };
    setAnswers(next);

    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      submit(next);
    }
  }

  async function submit(finalAnswers) {
    setPhase("submitting");
    try {
      const res = await fetch("/api/assessment/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: Object.values(finalAnswers) }),
      });
      const data = await res.json();
      setResults(data);
      setPhase("results");
    } catch {
      setPhase("error");
    }
  }

  function restart() {
    setAnswers({});
    setStep(0);
    setResults(null);
    setPhase("quiz");
  }

  return (
    <div>
      <Navbar />

      {phase === "loading" && (
        <div className="container assessment__status">Loading the assessment…</div>
      )}

      {phase === "error" && (
        <div className="container assessment__status">
          <p>Something went wrong loading the assessment. Try refreshing.</p>
        </div>
      )}

      {(phase === "quiz" || phase === "submitting") && questions.length > 0 && (
        <section className="assessment">
          <div className="container assessment__inner">
            <p className="eyebrow">Career Match Assessment</p>
            <div className="assessment__progress">
              <div
                className="assessment__progress-fill"
                style={{ width: `${((step + (phase === "submitting" ? 1 : 0)) / questions.length) * 100}%` }}
              />
            </div>
            <span className="assessment__step-count">
              Question {step + 1} of {questions.length}
            </span>

            <h1 className="assessment__question">{questions[step].question}</h1>

            <div className="assessment__options">
              {questions[step].options.map((opt) => (
                <button
                  key={opt.tag}
                  className={"assessment__option" + (answers[questions[step].id] === opt.tag ? " assessment__option--selected" : "")}
                  onClick={() => selectOption(questions[step].id, opt.tag)}
                  disabled={phase === "submitting"}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {step > 0 && phase === "quiz" && (
              <button className="btn btn-ghost assessment__back" onClick={() => setStep(step - 1)}>
                ← Back
              </button>
            )}

            {phase === "submitting" && <p className="assessment__loading">Scoring your matches…</p>}
          </div>
        </section>
      )}

      {phase === "results" && results && (
        <section className="assessment-results">
          <div className="container">
            <p className="eyebrow">Your results</p>
            <h1>Careers worth exploring first.</h1>
            <p className="assessment-results__sub">
              Scored against your answers — not a verdict, just a strong place to start.
            </p>

            <div className="assessment-results__grid">
              {results.top.map((r, i) => (
                <div className="card assessment-results__card" key={r.slug}>
                  <span className="assessment-results__rank">#{i + 1} match</span>
                  <div className="assessment-results__score-row">
                    <h2>{r.title}</h2>
                    <span className="assessment-results__score">{r.score}%</span>
                  </div>
                  <p className="assessment-results__summary">{r.summary}</p>
                  {r.reasons.length > 0 && (
                    <ul className="assessment-results__reasons">
                      {r.reasons.map((reason) => (
                        <li key={reason}>{reason}</li>
                      ))}
                    </ul>
                  )}
                  <div className="career-card__badges">
                    <span className="badge">{r.avg_salary}</span>
                    <span className="badge">{r.demand_level} demand</span>
                  </div>
                  <Link to={`/careers/${r.slug}`} className="btn btn-primary assessment-results__link">
                    See full profile
                  </Link>
                </div>
              ))}
            </div>

            {results.alternatives.length > 0 && (
              <div className="assessment-results__alts">
                <h3>Also worth a look</h3>
                <div className="assessment-results__alts-row">
                  {results.alternatives.map((r) => (
                    <Link to={`/careers/${r.slug}`} className="assessment-results__alt" key={r.slug}>
                      <span>{r.title}</span>
                      <span className="assessment-results__alt-score">{r.score}%</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <button className="btn btn-ghost assessment-results__retake" onClick={restart}>
              Retake the assessment
            </button>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}

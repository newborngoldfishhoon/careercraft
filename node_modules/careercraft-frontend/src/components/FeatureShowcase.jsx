import { Link } from "react-router-dom";

const FEATURES = [
  {
    tag: "Explore",
    title: "Career Explorer",
    body: "Browse thousands of careers organized by category, not the alphabet — filter by salary, demand, remote potential, and more.",
    to: "/explore",
  },
  {
    tag: "Decide",
    title: "Career Match Assessment",
    body: "Answer questions about your interests and working style; get a ranked shortlist with the reasoning shown, not just a score.",
    to: "/assessment",
  },
  {
    tag: "Decide",
    title: "Career Comparison",
    body: "Put two or three careers side by side across salary, difficulty, growth, and lifestyle fit.",
    to: "/compare",
  },
  {
    tag: "Decide",
    title: "Skill Gap & Transition Analyzer",
    body: "See exactly which skills carry over from where you are now, and which ones stand between you and a target career.",
    to: "/transition",
  },
  {
    tag: "Commit",
    title: "Roadmaps",
    body: "A visual, staged path from fundamentals to job-ready — with milestones, timelines, and progress tracking built in.",
  },
  {
    tag: "Commit",
    title: "Career Commitment System",
    body: "Turn a chosen career into a mission with a target date, then track every milestone toward it from one dashboard.",
    to: "/dashboard",
  },
  {
    tag: "Grow",
    title: "AI Mentor",
    body: "Remembers your progress, adjusts your plan around your time, and tells you exactly what to do next.",
    to: "/mentor",
  },
];

export default function FeatureShowcase() {
  return (
    <section className="section" id="explore">
      <div className="container">
        <div className="section-head">
          <p className="eyebrow">What's inside</p>
          <h2>Everything between curiosity and a job offer.</h2>
          <p>Most career sites stop at information. CareerCraft carries you through the whole lifecycle.</p>
        </div>
        <div className="features__grid">
          {FEATURES.map((f) => {
            const Card = (
              <>
                <span className="features__tag">{f.tag}</span>
                <h3>{f.title}</h3>
                <p>{f.body}</p>
              </>
            );
            return f.to ? (
              <Link to={f.to} className="card features__card features__card--link" key={f.title}>
                {Card}
              </Link>
            ) : (
              <div className="card features__card" key={f.title}>
                {Card}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

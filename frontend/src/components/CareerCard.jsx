import { Link } from "react-router-dom";

export default function CareerCard({ career }) {
  return (
    <Link to={`/careers/${career.slug}`} className="career-card">
      <div className="career-card__top">
        <h3>{career.title}</h3>
        <span className="career-card__salary">{career.avg_salary}</span>
      </div>
      <p className="career-card__summary">{career.summary}</p>
      <div className="career-card__badges">
        <span className="badge">{career.difficulty_level}</span>
        <span className="badge">{career.demand_level} demand</span>
        <span className="badge">{career.remote_potential} remote</span>
      </div>
    </Link>
  );
}

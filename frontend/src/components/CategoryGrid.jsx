import { Link } from "react-router-dom";
import Icon from "./icons.jsx";

export default function CategoryGrid({ categories }) {
  return (
    <section className="section section--navy" id="compare">
      <div className="container">
        <div className="section-head">
          <p className="eyebrow eyebrow--light">Organized the way careers actually work</p>
          <h2>Not A to Z. By category.</h2>
          <p>Careers are grouped by field, not alphabet — so exploring feels like browsing a world, not a directory.</p>
        </div>
        <div className="categories__grid">
          {(categories || []).map((c) => (
            <Link to={`/explore?category=${c.slug}`} className="categories__card" key={c.slug}>
              <Icon name={c.icon} />
              <h3>{c.name}</h3>
              <p>{c.description}</p>
              <span className="categories__count">{c.career_count} careers</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";

export default function Community() {
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/communities")
      .then((r) => r.json())
      .then((data) => {
        setCommunities(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div>
      <Navbar />
      <section className="community-page">
        <div className="container">
          <p className="eyebrow">Community</p>
          <h1>Ask, share, and learn from people a few steps ahead.</h1>
          <p className="community-page__sub">Career-specific spaces for questions, experiences, reviews, and advice.</p>

          {loading ? (
            <p className="explorer__status">Loading communities…</p>
          ) : (
            <div className="community-grid">
              {communities.map((c) => (
                <Link to={`/community/${c.slug}`} className="community-card" key={c.slug}>
                  <h3>{c.name}</h3>
                  <p>{c.description}</p>
                  <span className="community-card__count">{c.post_count} post{c.post_count === 1 ? "" : "s"}</span>
                </Link>
              ))}
            </div>
          )}

          <div className="community-rules">
            <h2>Community guidelines</h2>
            <ul>
              <li>Respectful environment — disagree with ideas, not people.</li>
              <li>Constructive discussion — explain your reasoning, not just your conclusion.</li>
              <li>No spam or self-promotion unrelated to the conversation.</li>
              <li>No misleading information — cite sources for factual claims where you can.</li>
              <li>Report anything that crosses a line; posts are reviewed, not auto-removed.</li>
            </ul>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}

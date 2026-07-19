import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__grid">
        <div className="footer__brand">
          <span className="nav__logo">
            Career<span>Craft</span>
          </span>
          <p>Discovery, decision, and growth — one platform, one lifecycle.</p>
        </div>

        <div className="footer__col">
          <h4>Categories</h4>
          <Link to="/explore?category=technology">Technology</Link>
          <Link to="/explore?category=healthcare">Healthcare</Link>
          <Link to="/explore?category=business">Business</Link>
          <Link to="/explore">All categories</Link>
        </div>

        <div className="footer__col">
          <h4>Resources</h4>
          <Link to="/resources">Resource Library</Link>
          <Link to="/colleges">Colleges</Link>
          <Link to="/exams">Entrance Exams</Link>
          <Link to="/opportunities">Opportunities</Link>
        </div>

        <div className="footer__col">
          <h4>Communities</h4>
          <Link to="/community">All communities</Link>
          <Link to="/community/ai-engineering">AI Engineering</Link>
          <Link to="/community/design">Design</Link>
        </div>

        <div className="footer__col">
          <h4>Company</h4>
          <a href="#about">About</a>
          <a href="#privacy">Privacy policy</a>
          <a href="#terms">Terms</a>
          <a href="#contact">Contact</a>
        </div>

        <div className="footer__col">
          <h4>Follow</h4>
          <a href="#" aria-label="LinkedIn">LinkedIn</a>
          <a href="#" aria-label="Instagram">Instagram</a>
          <a href="#" aria-label="X">X</a>
        </div>
      </div>
      <div className="container footer__bottom">
        <span>© {new Date().getFullYear()} CareerCraft. All rights reserved.</span>
      </div>
    </footer>
  );
}

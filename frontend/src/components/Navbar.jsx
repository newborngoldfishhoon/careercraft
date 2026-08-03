import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function onLogout() {
    logout();
    navigate("/");
  }

  return (
    <header className="nav">
      <div className="container nav__inner">
        <Link to="/" className="nav__logo">
          Career<span>Craft</span>
        </Link>
        <nav className="nav__links">
          <Link to="/explore">Explore</Link>
          <Link to="/opportunities">Opportunities</Link>
          <Link to="/compare">Compare</Link>
          <Link to="/transition">Skill Gap</Link>
        </nav>
        <div className="nav__actions">
          {user ? (
            <>
              <Link to="/dashboard" className="btn btn-ghost">Dashboard</Link>
              <Link to="/profile" className="nav__user">
                {user.name.split(" ")[0]}
              </Link>
              <button className="btn btn-ghost" onClick={onLogout}>
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost">Log in</Link>
              <Link to="/assessment" className="btn btn-primary">Take the assessment</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

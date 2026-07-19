import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function Profile() {
  const { user, loading, updateProfile, logout } = useAuth();
  const [name, setName] = useState("");
  const [theme, setTheme] = useState("light");
  const [status, setStatus] = useState("idle"); // idle | saving | saved | error
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      setName(user.name);
      setTheme(user.theme || "light");
    }
  }, [user]);

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="container auth-page__inner">Loading…</div>
        <Footer />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  async function onSave(e) {
    e.preventDefault();
    setStatus("saving");
    setError("");
    try {
      await updateProfile({ name, theme });
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2000);
    } catch (err) {
      setError(err.message);
      setStatus("error");
    }
  }

  return (
    <div>
      <Navbar />
      <section className="auth-page">
        <div className="container auth-page__inner">
          <p className="eyebrow">Account</p>
          <h1>Your profile</h1>
          <p className="auth-page__sub">{user.email}</p>

          <form className="auth-form" onSubmit={onSave}>
            {error && <p className="auth-form__error">{error}</p>}
            <label>
              Name
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
            </label>

            <label>
              Theme
              <select value={theme} onChange={(e) => setTheme(e.target.value)}>
                <option value="light">Light</option>
                <option value="dark">Dark (visual toggle only, for now)</option>
              </select>
            </label>

            <button className="btn btn-primary auth-form__submit" disabled={status === "saving"}>
              {status === "saving" ? "Saving…" : status === "saved" ? "Saved ✓" : "Save changes"}
            </button>
          </form>

          <button className="btn btn-ghost auth-page__logout" onClick={logout}>
            Log out
          </button>
        </div>
      </section>
      <Footer />
    </div>
  );
}

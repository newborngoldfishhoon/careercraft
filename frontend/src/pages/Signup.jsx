import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await signup(form);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <Navbar />
      <section className="auth-page">
        <div className="container auth-page__inner">
          <p className="eyebrow">Create your account</p>
          <h1>Start building your path.</h1>
          <p className="auth-page__sub">Save careers, track roadmap progress, and pick up where you left off.</p>

          <form className="auth-form" onSubmit={onSubmit}>
            {error && <p className="auth-form__error">{error}</p>}
            <label>
              Name
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </label>
            <label>
              Email
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                minLength={8}
                required
              />
              <span className="auth-form__hint">At least 8 characters.</span>
            </label>
            <button className="btn btn-primary auth-form__submit" disabled={busy}>
              {busy ? "Creating account…" : "Create account"}
            </button>
          </form>

          <p className="auth-page__switch">
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </div>
      </section>
      <Footer />
    </div>
  );
}

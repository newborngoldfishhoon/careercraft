import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(form);
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
          <p className="eyebrow">Welcome back</p>
          <h1>Log in to CareerCraft.</h1>

          <form className="auth-form" onSubmit={onSubmit}>
            {error && <p className="auth-form__error">{error}</p>}
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
                required
              />
            </label>
            <button className="btn btn-primary auth-form__submit" disabled={busy}>
              {busy ? "Logging in…" : "Log in"}
            </button>
          </form>

          <p className="auth-page__switch">
            New to CareerCraft? <Link to="/signup">Create an account</Link>
          </p>
        </div>
      </section>
      <Footer />
    </div>
  );
}

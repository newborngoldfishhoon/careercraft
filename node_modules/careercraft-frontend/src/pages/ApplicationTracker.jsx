import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../lib/api.js";

const STATUSES = [
  { key: "saved", label: "Saved" },
  { key: "applied", label: "Applied" },
  { key: "interviewing", label: "Interviewing" },
  { key: "offer", label: "Offer" },
  { key: "rejected", label: "Rejected" },
];

export default function ApplicationTracker() {
  const { user, loading: authLoading } = useAuth();
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", organization: "", status: "saved", follow_up_date: "", notes: "" });
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    load();
  }, [user]);

  function load() {
    setLoading(true);
    api("/api/applications")
      .then(setApps)
      .catch(() => setApps([]))
      .finally(() => setLoading(false));
  }

  if (authLoading) return null;
  if (!user) return <Navigate to="/login" replace />;

  async function addApplication(e) {
    e.preventDefault();
    setError("");
    try {
      await api("/api/applications", { method: "POST", body: form });
      setForm({ title: "", organization: "", status: "saved", follow_up_date: "", notes: "" });
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function updateStatus(id, status) {
    setApps((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    try {
      await api(`/api/applications/${id}`, { method: "PATCH", body: { status } });
    } catch {
      load();
    }
  }

  async function removeApplication(id) {
    setApps((prev) => prev.filter((a) => a.id !== id));
    try {
      await api(`/api/applications/${id}`, { method: "DELETE" });
    } catch {
      load();
    }
  }

  return (
    <div>
      <Navbar />
      <section className="tracker-page">
        <div className="container">
          <p className="eyebrow">Application Tracker</p>
          <h1>Stay organized across every application.</h1>
          <p className="tracker-page__sub">
            <Link to="/opportunities">Track opportunities</Link> from the Hub, or add your own below.
          </p>

          <button className="btn btn-primary tracker-page__add-btn" onClick={() => setShowForm((s) => !s)}>
            {showForm ? "Cancel" : "+ Add an application"}
          </button>

          {showForm && (
            <form className="tracker-form" onSubmit={addApplication}>
              {error && <p className="auth-form__error">{error}</p>}
              <div className="tracker-form__row">
                <label>
                  Title
                  <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                </label>
                <label>
                  Organization
                  <input type="text" value={form.organization} onChange={(e) => setForm({ ...form, organization: e.target.value })} />
                </label>
              </div>
              <div className="tracker-form__row">
                <label>
                  Status
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    {STATUSES.map((s) => (
                      <option value={s.key} key={s.key}>{s.label}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Follow-up date
                  <input type="date" value={form.follow_up_date} onChange={(e) => setForm({ ...form, follow_up_date: e.target.value })} />
                </label>
              </div>
              <label>
                Notes
                <textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </label>
              <button className="btn btn-primary tracker-form__submit">Save application</button>
            </form>
          )}

          {loading ? (
            <p className="explorer__status">Loading your applications…</p>
          ) : apps.length === 0 ? (
            <p className="explorer__status">Nothing tracked yet — add one above or track something from the Opportunity Hub.</p>
          ) : (
            <div className="tracker-board">
              {STATUSES.map((s) => {
                const items = apps.filter((a) => a.status === s.key);
                return (
                  <div className="tracker-column" key={s.key}>
                    <div className="tracker-column__head">
                      <h3>{s.label}</h3>
                      <span className="badge">{items.length}</span>
                    </div>
                    <div className="tracker-column__items">
                      {items.map((a) => (
                        <div className="tracker-card" key={a.id}>
                          <h4>{a.title}</h4>
                          {a.organization && <p className="tracker-card__org">{a.organization}</p>}
                          {a.follow_up_date && <p className="tracker-card__followup">Follow up: {a.follow_up_date}</p>}
                          {a.notes && <p className="tracker-card__notes">{a.notes}</p>}
                          <div className="tracker-card__actions">
                            <select value={a.status} onChange={(e) => updateStatus(a.id, e.target.value)}>
                              {STATUSES.map((opt) => (
                                <option value={opt.key} key={opt.key}>{opt.label}</option>
                              ))}
                            </select>
                            <button className="tracker-card__remove" onClick={() => removeApplication(a.id)} aria-label="Remove">
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
      <Footer />
    </div>
  );
}

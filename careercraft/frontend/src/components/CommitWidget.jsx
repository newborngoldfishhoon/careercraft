import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../lib/api.js";

export default function CommitWidget({ career }) {
  const { user } = useAuth();
  const [commitment, setCommitment] = useState(undefined); // undefined = loading, null = none
  const [showForm, setShowForm] = useState(false);
  const [missionTitle, setMissionTitle] = useState(`Become a ${career.title} by ${new Date().getFullYear() + 2}`);
  const [targetDate, setTargetDate] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) {
      setCommitment(null);
      return;
    }
    api("/api/commit")
      .then((d) => setCommitment(d.commitment))
      .catch(() => setCommitment(null));
  }, [user]);

  async function submitCommit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const d = await api("/api/commit", {
        method: "POST",
        body: { career_slug: career.slug, mission_title: missionTitle, target_date: targetDate || null },
      });
      setCommitment(d.commitment);
      setShowForm(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (!user) {
    return (
      <Link to="/login" className="btn btn-primary">
        Log in to commit to this career
      </Link>
    );
  }

  if (commitment === undefined) {
    return (
      <button className="btn btn-primary" disabled>
        Loading…
      </button>
    );
  }

  if (commitment && commitment.career_slug === career.slug) {
    return (
      <Link to="/dashboard" className="btn btn-primary commit-widget__done">
        ✓ Committed — go to dashboard
      </Link>
    );
  }

  if (showForm) {
    return (
      <form className="commit-widget__form" onSubmit={submitCommit}>
        {error && <p className="auth-form__error">{error}</p>}
        <label>
          Your mission
          <input type="text" value={missionTitle} onChange={(e) => setMissionTitle(e.target.value)} required />
        </label>
        <label>
          Target date (optional)
          <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
        </label>
        <div className="commit-widget__form-actions">
          <button className="btn btn-primary" disabled={busy}>
            {busy ? "Committing…" : "Confirm commitment"}
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <button className="btn btn-primary" onClick={() => setShowForm(true)}>
      {commitment ? `Switch commitment to ${career.title}` : "Commit to this career"}
    </button>
  );
}

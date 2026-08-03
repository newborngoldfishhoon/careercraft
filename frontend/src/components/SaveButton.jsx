import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../lib/api.js";

export default function SaveButton({ slug }) {
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    api("/api/saved-careers")
      .then((list) => setSaved(list.some((c) => c.slug === slug)))
      .catch(() => {});
  }, [user, slug]);

  if (!user) return null;

  async function toggle() {
    setBusy(true);
    try {
      const d = await api("/api/saved-careers", { method: "POST", body: { slug } });
      setSaved(d.saved);
    } catch {
      // ignore — non-critical action
    } finally {
      setBusy(false);
    }
  }

  return (
    <button className={"btn btn-ghost save-btn" + (saved ? " save-btn--active" : "")} onClick={toggle} disabled={busy}>
      {saved ? "★ Saved" : "☆ Save"}
    </button>
  );
}

import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../lib/api.js";

const POST_TYPES = ["Question", "Experience", "Resource", "Review", "Advice", "Discuss Roadmaps", "Discussion"];

export default function CommunityDetail() {
  const { slug } = useParams();
  const { user } = useAuth();
  const [community, setCommunity] = useState(null);
  const [status, setStatus] = useState("loading");
  const [posts, setPosts] = useState([]);
  const [typeFilter, setTypeFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", body: "", post_type: "Discussion" });
  const [error, setError] = useState("");
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    setStatus("loading");
    fetch(`/api/communities/${slug}`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data) => {
        setCommunity(data);
        setStatus("ok");
      })
      .catch(() => setStatus("notfound"));
  }, [slug]);

  useEffect(() => {
    if (status !== "ok") return;
    loadPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, typeFilter]);

  function loadPosts() {
    const params = new URLSearchParams();
    if (typeFilter) params.set("type", typeFilter);
    fetch(`/api/communities/${slug}/posts?${params.toString()}`)
      .then((r) => r.json())
      .then(setPosts)
      .catch(() => setPosts([]));
  }

  async function submitPost(e) {
    e.preventDefault();
    setError("");
    setPosting(true);
    try {
      await api(`/api/communities/${slug}/posts`, { method: "POST", body: form });
      setForm({ title: "", body: "", post_type: "Discussion" });
      setShowForm(false);
      loadPosts();
    } catch (err) {
      setError(err.message);
    } finally {
      setPosting(false);
    }
  }

  if (status === "loading") {
    return (
      <div>
        <Navbar />
        <div className="container detail__status">Loading community…</div>
        <Footer />
      </div>
    );
  }

  if (status === "notfound" || !community) {
    return (
      <div>
        <Navbar />
        <div className="container detail__status">
          <h1>Community not found</h1>
          <Link to="/community" className="btn btn-primary">Back to Community</Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <section className="community-detail">
        <div className="container">
          <p className="eyebrow">Community</p>
          <h1>{community.name}</h1>
          <p className="community-detail__desc">{community.description}</p>

          {user ? (
            <button className="btn btn-primary community-detail__new-btn" onClick={() => setShowForm((s) => !s)}>
              {showForm ? "Cancel" : "+ New post"}
            </button>
          ) : (
            <p className="community-detail__login-note">
              <Link to="/login">Log in</Link> to post or comment — browsing is open to everyone.
            </p>
          )}

          {showForm && (
            <form className="tracker-form community-detail__form" onSubmit={submitPost}>
              {error && <p className="auth-form__error">{error}</p>}
              <label>
                Type
                <select value={form.post_type} onChange={(e) => setForm({ ...form, post_type: e.target.value })}>
                  {POST_TYPES.map((t) => (
                    <option value={t} key={t}>{t}</option>
                  ))}
                </select>
              </label>
              <label>
                Title
                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              </label>
              <label>
                Body
                <textarea rows={4} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} required />
              </label>
              <button className="btn btn-primary tracker-form__submit" disabled={posting}>
                {posting ? "Posting…" : "Post"}
              </button>
            </form>
          )}

          <div className="community-filter-row">
            <button className={"transition-mode__btn" + (typeFilter === "" ? " transition-mode__btn--active" : "")} onClick={() => setTypeFilter("")}>
              All
            </button>
            {POST_TYPES.map((t) => (
              <button
                key={t}
                className={"transition-mode__btn" + (typeFilter === t ? " transition-mode__btn--active" : "")}
                onClick={() => setTypeFilter(t)}
              >
                {t}
              </button>
            ))}
          </div>

          {posts.length === 0 ? (
            <p className="explorer__status">No posts yet — be the first.</p>
          ) : (
            <div className="post-list">
              {posts.map((p) => (
                <Link to={`/community/${slug}/posts/${p.id}`} className="post-list__item" key={p.id}>
                  <div className="post-list__top">
                    <span className="badge">{p.post_type}</span>
                    <span className="post-list__meta">{p.author_name} · {p.created_at.slice(0, 10)}</span>
                  </div>
                  <h3>{p.title}</h3>
                  <p>{p.body}</p>
                  <span className="post-list__comments">{p.comment_count} comment{p.comment_count === 1 ? "" : "s"}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
      <Footer />
    </div>
  );
}

import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../lib/api.js";

export default function PostDetail() {
  const { slug, id } = useParams();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [status, setStatus] = useState("loading");
  const [commentBody, setCommentBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [reported, setReported] = useState(false);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function load() {
    setStatus("loading");
    fetch(`/api/posts/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data) => {
        setPost(data);
        setStatus("ok");
      })
      .catch(() => setStatus("notfound"));
  }

  async function submitComment(e) {
    e.preventDefault();
    if (!commentBody.trim()) return;
    setPosting(true);
    try {
      await api(`/api/posts/${id}/comments`, { method: "POST", body: { body: commentBody } });
      setCommentBody("");
      load();
    } catch {
      // ignore
    } finally {
      setPosting(false);
    }
  }

  async function report() {
    try {
      await api(`/api/posts/${id}/report`, { method: "POST" });
      setReported(true);
    } catch {
      // ignore
    }
  }

  if (status === "loading") {
    return (
      <div>
        <Navbar />
        <div className="container detail__status">Loading post…</div>
        <Footer />
      </div>
    );
  }

  if (status === "notfound" || !post) {
    return (
      <div>
        <Navbar />
        <div className="container detail__status">
          <h1>Post not found</h1>
          <Link to={`/community/${slug}`} className="btn btn-primary">Back to community</Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <section className="post-detail">
        <div className="container post-detail__inner">
          <Link to={`/community/${slug}`} className="post-detail__back">← Back to community</Link>

          <span className="badge">{post.post_type}</span>
          <h1>{post.title}</h1>
          <p className="post-detail__meta">{post.author_name} · {post.created_at.slice(0, 10)}</p>
          <p className="post-detail__body">{post.body}</p>

          {user && (
            <button className="post-detail__report" onClick={report} disabled={reported}>
              {reported ? "Reported — thanks, we'll review it" : "Report this post"}
            </button>
          )}

          <h2 className="post-detail__comments-head">
            {post.comments.length} comment{post.comments.length === 1 ? "" : "s"}
          </h2>

          <div className="post-detail__comments">
            {post.comments.map((c) => (
              <div className="post-detail__comment" key={c.id}>
                <p className="post-detail__comment-meta">{c.author_name} · {c.created_at.slice(0, 10)}</p>
                <p>{c.body}</p>
              </div>
            ))}
          </div>

          {user ? (
            <form className="post-detail__comment-form" onSubmit={submitComment}>
              <textarea
                rows={3}
                placeholder="Add a comment…"
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
              />
              <button className="btn btn-primary" disabled={posting || !commentBody.trim()}>
                {posting ? "Posting…" : "Comment"}
              </button>
            </form>
          ) : (
            <p className="community-detail__login-note">
              <Link to="/login">Log in</Link> to comment.
            </p>
          )}
        </div>
      </section>
      <Footer />
    </div>
  );
}

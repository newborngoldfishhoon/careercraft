const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const db = require("./db");
const { QUESTIONS, DIMENSION_WEIGHTS, TAG_REASONS } = require("./questions");
const { signToken, attachUser, requireAuth } = require("./auth");
const { getRoadmapWithProgress } = require("./roadmap");
const { computeReadiness } = require("./readiness");
const { generateMentorReply } = require("./mentor");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(attachUser);

function serializeUser(row) {
  if (!row) return null;
  const { password_hash, ...safe } = row;
  return safe;
}

// --- Auth: signup / login / profile --------------------------------------
app.post("/api/auth/signup", (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !name.trim()) return res.status(400).json({ error: "Name is required." });
  if (!/^\S+@\S+\.\S+$/.test(email || "")) return res.status(400).json({ error: "Enter a valid email address." });
  if (!password || password.length < 8) return res.status(400).json({ error: "Password must be at least 8 characters." });

  const existing = db.prepare(`SELECT id FROM users WHERE email = ?`).get(email.toLowerCase());
  if (existing) return res.status(409).json({ error: "An account with that email already exists." });

  const password_hash = bcrypt.hashSync(password, 10);
  const info = db
    .prepare(`INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)`)
    .run(name.trim(), email.toLowerCase(), password_hash);

  const user = db.prepare(`SELECT * FROM users WHERE id = ?`).get(info.lastInsertRowid);
  res.status(201).json({ token: signToken(user), user: serializeUser(user) });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body || {};
  const user = db.prepare(`SELECT * FROM users WHERE email = ?`).get(String(email || "").toLowerCase());
  if (!user || !bcrypt.compareSync(password || "", user.password_hash)) {
    return res.status(401).json({ error: "Incorrect email or password." });
  }
  res.json({ token: signToken(user), user: serializeUser(user) });
});

app.get("/api/auth/me", requireAuth, (req, res) => {
  const user = db.prepare(`SELECT * FROM users WHERE id = ?`).get(req.userId);
  if (!user) return res.status(404).json({ error: "User not found." });
  res.json({ user: serializeUser(user) });
});

app.patch("/api/auth/profile", requireAuth, (req, res) => {
  const { name, avatar_url, theme } = req.body || {};
  const current = db.prepare(`SELECT * FROM users WHERE id = ?`).get(req.userId);
  if (!current) return res.status(404).json({ error: "User not found." });

  const next = {
    name: name !== undefined && name.trim() ? name.trim() : current.name,
    avatar_url: avatar_url !== undefined ? avatar_url : current.avatar_url,
    theme: theme !== undefined && ["light", "dark"].includes(theme) ? theme : current.theme,
  };

  db.prepare(`UPDATE users SET name = @name, avatar_url = @avatar_url, theme = @theme WHERE id = @id`).run({
    ...next,
    id: req.userId,
  });

  const updated = db.prepare(`SELECT * FROM users WHERE id = ?`).get(req.userId);
  res.json({ user: serializeUser(updated) });
});

// Password reset requires an email-sending service, which isn't wired up in
// this environment. This stub keeps the contract in place for later.
app.post("/api/auth/request-password-reset", (req, res) => {
  res.json({ ok: true, note: "Password reset emails aren't wired up yet in this environment." });
});

// --- Categories ---------------------------------------------------------
app.get("/api/categories", (req, res) => {
  const rows = db.prepare(`SELECT * FROM categories ORDER BY sort_order ASC`).all();
  res.json(rows);
});

// --- Trust stats ---------------------------------------------------------
app.get("/api/stats", (req, res) => {
  const rows = db.prepare(`SELECT label, value FROM trust_stats ORDER BY sort_order ASC`).all();
  res.json(rows);
});

// --- Careers: featured / trending / search ------------------------------
app.get("/api/careers/featured", (req, res) => {
  const rows = db.prepare(`SELECT * FROM careers WHERE is_featured = 1`).all();
  res.json(rows);
});

app.get("/api/careers/trending", (req, res) => {
  const rows = db.prepare(`SELECT * FROM careers WHERE is_trending = 1`).all();
  res.json(rows);
});

// --- Career Explorer: filterable list -----------------------------------
app.get("/api/careers", (req, res) => {
  const { category, difficulty, remote, demand, q, sort } = req.query;

  const where = [];
  const params = {};
  if (category) {
    where.push("category_slug = @category");
    params.category = category;
  }
  if (difficulty) {
    where.push("difficulty_level = @difficulty");
    params.difficulty = difficulty;
  }
  if (remote) {
    where.push("remote_potential = @remote");
    params.remote = remote;
  }
  if (demand) {
    where.push("demand_level = @demand");
    params.demand = demand;
  }
  if (q) {
    where.push("(title LIKE @q OR summary LIKE @q)");
    params.q = `%${q}%`;
  }

  const orderBy =
    {
      rating: "rating DESC",
      salary: "avg_salary DESC",
      trending: "is_trending DESC, is_featured DESC",
    }[sort] || "is_featured DESC, is_trending DESC, title ASC";

  const sql = `
    SELECT id, slug, title, category_slug, summary, avg_salary, demand_level, growth_potential,
           difficulty_level, remote_potential, rating, is_featured, is_trending
    FROM careers
    ${where.length ? "WHERE " + where.join(" AND ") : ""}
    ORDER BY ${orderBy}
  `;
  const rows = db.prepare(sql).all(params);
  res.json(rows);
});

app.get("/api/careers/search", (req, res) => {
  const q = (req.query.q || "").trim();
  if (!q) return res.json([]);
  const rows = db
    .prepare(`SELECT id, slug, title, category_slug, summary FROM careers WHERE title LIKE ? LIMIT 8`)
    .all(`%${q}%`);
  res.json(rows);
});

// --- Success stories -------------------------------------------------------
app.get("/api/success-stories", (req, res) => {
  const rows = db.prepare(`SELECT * FROM success_stories ORDER BY sort_order ASC`).all();
  res.json(rows);
});

// --- FAQs -------------------------------------------------------------
app.get("/api/faqs", (req, res) => {
  const rows = db.prepare(`SELECT question, answer FROM faqs ORDER BY sort_order ASC`).all();
  res.json(rows);
});

// --- Career Comparison ------------------------------------------------
const LEVEL_RANK = {
  difficulty: { Low: 1, Moderate: 2, High: 3 },
  remote: { Low: 1, Moderate: 2, High: 3 },
  demand: { Moderate: 1, High: 2, "Very High": 3 },
};

function parseSalaryNumber(str) {
  if (!str) return null;
  const match = String(str).match(/[\d,]+/);
  if (!match) return null;
  const n = parseInt(match[0].replace(/,/g, ""), 10);
  if (Number.isNaN(n)) return null;
  // Values under 1000 are almost certainly already in "k" (e.g. "128k")
  return n < 1000 ? n * 1000 : n;
}

function generateComparisonInsights(careers) {
  const salaries = careers.map((c) => parseSalaryNumber(c.avg_salary));
  const difficulties = careers.map((c) => LEVEL_RANK.difficulty[c.difficulty_level] || 2);
  const remotes = careers.map((c) => LEVEL_RANK.remote[c.remote_potential] || 2);
  const demands = careers.map((c) => LEVEL_RANK.demand[c.demand_level] || 2);

  const maxSalary = Math.max(...salaries.filter((s) => s !== null));
  const minDifficulty = Math.min(...difficulties);
  const maxDifficulty = Math.max(...difficulties);
  const maxRemote = Math.max(...remotes);
  const maxDemand = Math.max(...demands);

  return careers.map((c, i) => {
    const strengths = [];
    const tradeoffs = [];

    if (salaries[i] !== null && salaries[i] === maxSalary && salaries.filter((s) => s === maxSalary).length === 1) {
      strengths.push("Leads the group on average pay");
    }
    if (demands[i] === maxDemand) strengths.push(`${c.demand_level} job demand`);
    if (remotes[i] === maxRemote && c.remote_potential === "High") strengths.push("Strongest remote flexibility");
    if (difficulties[i] === minDifficulty && minDifficulty < maxDifficulty) {
      strengths.push("Fastest realistic path to entry-level");
    }

    if (difficulties[i] === maxDifficulty && maxDifficulty > minDifficulty) {
      tradeoffs.push("Requires the deepest training investment of this group");
    }
    if (remotes[i] === Math.min(...remotes) && c.remote_potential !== "High") {
      tradeoffs.push("More location-dependent than the others compared");
    }
    if (salaries[i] !== null && salaries[i] === Math.min(...salaries.filter((s) => s !== null))) {
      tradeoffs.push("Trails the group on average pay");
    }

    if (strengths.length === 0) strengths.push("A solid, well-rounded option in this comparison");
    if (tradeoffs.length === 0) tradeoffs.push("No major tradeoffs relative to the others compared");

    return {
      slug: c.slug,
      title: c.title,
      strengths: [...new Set(strengths)].slice(0, 3),
      tradeoffs: [...new Set(tradeoffs)].slice(0, 2),
    };
  });
}

app.get("/api/careers/compare", (req, res) => {
  const slugs = String(req.query.slugs || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 3);

  if (slugs.length < 2) {
    return res.status(400).json({ error: "Provide at least 2 career slugs, comma-separated." });
  }

  const placeholders = slugs.map(() => "?").join(",");
  const careers = db
    .prepare(
      `SELECT slug, title, category_slug, summary, avg_salary, demand_level, growth_potential,
              difficulty_level, remote_potential, education_requirement, rating
       FROM careers WHERE slug IN (${placeholders})`
    )
    .all(...slugs);

  // Preserve the order the user picked them in.
  const ordered = slugs.map((s) => careers.find((c) => c.slug === s)).filter(Boolean);

  if (ordered.length < 2) {
    return res.status(404).json({ error: "Not enough matching careers found." });
  }

  res.json({
    careers: ordered,
    insights: generateComparisonInsights(ordered),
  });
});

// --- Opportunity Hub ----------------------------------------------------
app.get("/api/opportunities", (req, res) => {
  const { type, career, remote } = req.query;
  const where = [];
  const params = {};
  if (type) {
    where.push("type = @type");
    params.type = type;
  }
  if (career) {
    where.push("career_slug = @career");
    params.career = career;
  }
  if (remote === "true") where.push("remote = 1");

  const rows = db
    .prepare(
      `SELECT o.*, c.title AS career_title FROM opportunities o
       JOIN careers c ON c.slug = o.career_slug
       ${where.length ? "WHERE " + where.join(" AND ") : ""}
       ORDER BY o.deadline IS NULL, o.deadline ASC`
    )
    .all(params);
  res.json(rows);
});

app.get("/api/opportunities/types", (req, res) => {
  const rows = db.prepare(`SELECT DISTINCT type FROM opportunities ORDER BY type ASC`).all();
  res.json(rows.map((r) => r.type));
});

// Smart recommendations: filtered to the user's committed career, then
// biased by readiness — lower-readiness users see internships/bootcamps
// first, higher-readiness users see jobs/fellowships first.
app.get("/api/opportunities/recommended", requireAuth, (req, res) => {
  const commitment = db.prepare(`SELECT career_slug FROM commitments WHERE user_id = ?`).get(req.userId);
  if (!commitment) return res.json({ opportunities: [], reason: "no-commitment" });

  const readiness = computeReadiness(commitment.career_slug, req.userId);
  const score = readiness ? readiness.score : 0;

  const rows = db
    .prepare(
      `SELECT o.*, c.title AS career_title FROM opportunities o
       JOIN careers c ON c.slug = o.career_slug
       WHERE o.career_slug = ?`
    )
    .all(commitment.career_slug);

  const earlyStageTypes = new Set(["Internship", "Bootcamp", "Volunteer", "Hackathon", "Competition", "Certification"]);
  const advancedTypes = new Set(["Job", "Fellowship", "Apprenticeship", "Research Program"]);

  rows.sort((a, b) => {
    const aScore = score < 50 ? (earlyStageTypes.has(a.type) ? 0 : 1) : advancedTypes.has(a.type) ? 0 : 1;
    const bScore = score < 50 ? (earlyStageTypes.has(b.type) ? 0 : 1) : advancedTypes.has(b.type) ? 0 : 1;
    if (aScore !== bScore) return aScore - bScore;
    return Math.abs(a.min_readiness - score) - Math.abs(b.min_readiness - score);
  });

  res.json({ opportunities: rows.slice(0, 6), reason: "matched", readinessScore: score });
});

// --- Application Tracker --------------------------------------------------
app.get("/api/applications", requireAuth, (req, res) => {
  const rows = db
    .prepare(`SELECT * FROM applications WHERE user_id = ? ORDER BY updated_at DESC`)
    .all(req.userId);
  res.json(rows);
});

app.post("/api/applications", requireAuth, (req, res) => {
  const { opportunity_id, title, organization, status, notes, follow_up_date } = req.body || {};

  let finalTitle = title;
  let finalOrg = organization;
  if (opportunity_id) {
    const opp = db.prepare(`SELECT title, organization FROM opportunities WHERE id = ?`).get(opportunity_id);
    if (opp) {
      finalTitle = finalTitle || opp.title;
      finalOrg = finalOrg || opp.organization;
    }
  }
  if (!finalTitle || !finalTitle.trim()) return res.status(400).json({ error: "Title is required." });

  const info = db
    .prepare(
      `INSERT INTO applications (user_id, opportunity_id, title, organization, status, notes, follow_up_date)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      req.userId,
      opportunity_id || null,
      finalTitle.trim(),
      (finalOrg || "").trim(),
      status && ["saved", "applied", "interviewing", "offer", "rejected"].includes(status) ? status : "saved",
      notes || null,
      follow_up_date || null
    );

  const created = db.prepare(`SELECT * FROM applications WHERE id = ?`).get(info.lastInsertRowid);
  res.status(201).json(created);
});

app.patch("/api/applications/:id", requireAuth, (req, res) => {
  const existing = db.prepare(`SELECT * FROM applications WHERE id = ? AND user_id = ?`).get(req.params.id, req.userId);
  if (!existing) return res.status(404).json({ error: "Application not found." });

  const { status, notes, follow_up_date } = req.body || {};
  const next = {
    status: status && ["saved", "applied", "interviewing", "offer", "rejected"].includes(status) ? status : existing.status,
    notes: notes !== undefined ? notes : existing.notes,
    follow_up_date: follow_up_date !== undefined ? follow_up_date : existing.follow_up_date,
  };

  db.prepare(
    `UPDATE applications SET status = @status, notes = @notes, follow_up_date = @follow_up_date, updated_at = datetime('now') WHERE id = @id`
  ).run({ ...next, id: req.params.id });

  res.json(db.prepare(`SELECT * FROM applications WHERE id = ?`).get(req.params.id));
});

app.delete("/api/applications/:id", requireAuth, (req, res) => {
  const existing = db.prepare(`SELECT id FROM applications WHERE id = ? AND user_id = ?`).get(req.params.id, req.userId);
  if (!existing) return res.status(404).json({ error: "Application not found." });
  db.prepare(`DELETE FROM applications WHERE id = ?`).run(req.params.id);
  res.json({ ok: true });
});


// These are the same underlying operation: compare a set of "current"
// skills (typed manually, or pulled from a source career's own skill list)
// against a target career's required skills. The spec treats them as two
// features; this endpoint serves both — source_type distinguishes them.
const IMPORTANCE_ORDER = { Critical: 3, High: 2, Moderate: 1 };

function parseJsonSafe(v) {
  try {
    return v ? JSON.parse(v) : [];
  } catch {
    return [];
  }
}

function getCareerSkillList(slug) {
  const c = db.prepare(`SELECT skills_technical, skills_soft, skills_industry FROM careers WHERE slug = ?`).get(slug);
  if (!c) return [];
  return [
    ...parseJsonSafe(c.skills_technical).map((s) => ({ ...s, group: "Technical" })),
    ...parseJsonSafe(c.skills_soft).map((s) => ({ ...s, group: "Soft" })),
    ...parseJsonSafe(c.skills_industry).map((s) => ({ ...s, group: "Industry" })),
  ];
}

app.post("/api/transition", (req, res) => {
  const { source_type, source_career_slug, current_skills, target_career_slug } = req.body || {};

  const target = db
    .prepare(`SELECT slug, title, difficulty_level FROM careers WHERE slug = ?`)
    .get(target_career_slug || "");
  if (!target) return res.status(404).json({ error: "Target career not found." });

  const targetSkills = getCareerSkillList(target.slug);
  if (targetSkills.length === 0) {
    return res.status(404).json({ error: "No detailed skill data for this target career yet — try one of the four flagship careers (AI Engineer, UX Designer, Registered Nurse, Product Manager)." });
  }

  let sourceLabel;
  let currentSkillNames = [];

  if (source_type === "career") {
    const source = db.prepare(`SELECT slug, title FROM careers WHERE slug = ?`).get(source_career_slug || "");
    if (!source) return res.status(404).json({ error: "Source career not found." });
    const sourceSkills = getCareerSkillList(source.slug);
    if (sourceSkills.length === 0) {
      return res.status(404).json({
        error: `We don't have a detailed skill profile for ${source.title} yet — try entering your skills manually instead.`,
      });
    }
    sourceLabel = source.title;
    currentSkillNames = sourceSkills.map((s) => s.name);
  } else {
    sourceLabel = "your entered skills";
    currentSkillNames = Array.isArray(current_skills) ? current_skills.filter(Boolean) : [];
    if (currentSkillNames.length === 0) {
      return res.status(400).json({ error: "Enter at least one current skill." });
    }
  }

  const currentLower = currentSkillNames.map((s) => s.toLowerCase().trim());

  const matched = [];
  const missing = [];
  targetSkills.forEach((ts) => {
    const isTransferable = currentLower.some(
      (cs) => cs.length > 2 && (ts.name.toLowerCase().includes(cs) || cs.includes(ts.name.toLowerCase()))
    );
    (isTransferable ? matched : missing).push({ name: ts.name, importance: ts.importance, group: ts.group });
  });

  missing.sort((a, b) => (IMPORTANCE_ORDER[b.importance] || 0) - (IMPORTANCE_ORDER[a.importance] || 0));

  const matchPercent = targetSkills.length ? Math.round((matched.length / targetSkills.length) * 100) : 0;

  let difficultyLabel;
  if (matchPercent >= 60) difficultyLabel = "Easier transition";
  else if (matchPercent >= 30) difficultyLabel = "Moderate transition";
  else difficultyLabel = "Significant transition";

  const roadmap = getRoadmapWithProgress(target.slug, null);
  const totalRoadmapWeeks = roadmap
    ? roadmap.stages.flatMap((s) => s.milestones).reduce((sum, m) => sum + (m.weeks || 0), 0)
    : null;
  const missingRatio = targetSkills.length ? missing.length / targetSkills.length : 1;
  const estimatedTimelineWeeks = totalRoadmapWeeks !== null ? Math.round(totalRoadmapWeeks * Math.max(missingRatio, 0.15)) : null;

  const certRow = db.prepare(`SELECT certifications FROM careers WHERE slug = ?`).get(target.slug);
  const certifications = parseJsonSafe(certRow.certifications).slice(0, 2);

  const specRow = db.prepare(`SELECT specializations FROM careers WHERE slug = ?`).get(target.slug);
  const portfolioSuggestions = parseJsonSafe(specRow.specializations)
    .slice(0, 2)
    .map((s) => `A small project in ${s.name.toLowerCase()} — ${s.description}`);

  res.json({
    target: { slug: target.slug, title: target.title },
    source: { type: source_type, label: sourceLabel },
    matched,
    missing,
    matchPercent,
    difficultyLabel,
    estimatedTimelineWeeks,
    recommendedCertifications: certifications,
    portfolioSuggestions,
  });
});

// --- College & Education Explorer -----------------------------------------
function parseCollegeRow(row) {
  return {
    ...row,
    programs: parseJsonSafe(row.programs),
    top_recruiters: parseJsonSafe(row.top_recruiters),
    campus_highlights: parseJsonSafe(row.campus_highlights),
    related_career_slugs: parseJsonSafe(row.related_career_slugs),
  };
}

app.get("/api/colleges", (req, res) => {
  const { type, country, q } = req.query;
  const where = [];
  const params = {};
  if (type) {
    where.push("type = @type");
    params.type = type;
  }
  if (country) {
    where.push("country = @country");
    params.country = country;
  }
  if (q) {
    where.push("name LIKE @q");
    params.q = `%${q}%`;
  }
  const rows = db
    .prepare(
      `SELECT slug, name, type, location, country, overview, fees, placements_percent, avg_package, acceptance_rate, rating
       FROM colleges ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY rating DESC`
    )
    .all(params);
  res.json(rows);
});

app.get("/api/colleges/:slug", (req, res) => {
  const row = db.prepare(`SELECT * FROM colleges WHERE slug = ?`).get(req.params.slug);
  if (!row) return res.status(404).json({ error: "College not found." });
  res.json(parseCollegeRow(row));
});

app.get("/api/exams", (req, res) => {
  const rows = db.prepare(`SELECT slug, name, overview, difficulty FROM entrance_exams ORDER BY name ASC`).all();
  res.json(rows);
});

app.get("/api/exams/:slug", (req, res) => {
  const row = db.prepare(`SELECT * FROM entrance_exams WHERE slug = ?`).get(req.params.slug);
  if (!row) return res.status(404).json({ error: "Exam not found." });
  res.json({
    ...row,
    syllabus: parseJsonSafe(row.syllabus),
    prep_resources: parseJsonSafe(row.prep_resources),
    related_career_slugs: parseJsonSafe(row.related_career_slugs),
  });
});

// --- Community ------------------------------------------------------------
const POST_TYPES = ["Question", "Experience", "Resource", "Review", "Advice", "Discuss Roadmaps", "Discussion"];

app.get("/api/communities", (req, res) => {
  const rows = db
    .prepare(
      `SELECT c.*, (SELECT COUNT(*) FROM posts p WHERE p.community_slug = c.slug) AS post_count
       FROM communities c ORDER BY c.sort_order ASC`
    )
    .all();
  res.json(rows);
});

app.get("/api/communities/:slug", (req, res) => {
  const community = db.prepare(`SELECT * FROM communities WHERE slug = ?`).get(req.params.slug);
  if (!community) return res.status(404).json({ error: "Community not found." });
  res.json(community);
});

app.get("/api/communities/:slug/posts", (req, res) => {
  const { type, q } = req.query;
  const where = ["p.community_slug = @slug"];
  const params = { slug: req.params.slug };
  if (type) {
    where.push("p.post_type = @type");
    params.type = type;
  }
  if (q) {
    where.push("(p.title LIKE @q OR p.body LIKE @q)");
    params.q = `%${q}%`;
  }
  const rows = db
    .prepare(
      `SELECT p.id, p.post_type, p.title, p.body, p.created_at, u.name AS author_name,
              (SELECT COUNT(*) FROM comments cm WHERE cm.post_id = p.id) AS comment_count
       FROM posts p JOIN users u ON u.id = p.user_id
       WHERE ${where.join(" AND ")}
       ORDER BY p.created_at DESC`
    )
    .all(params);
  res.json(rows);
});

app.post("/api/communities/:slug/posts", requireAuth, (req, res) => {
  const community = db.prepare(`SELECT slug FROM communities WHERE slug = ?`).get(req.params.slug);
  if (!community) return res.status(404).json({ error: "Community not found." });

  const { title, body, post_type } = req.body || {};
  if (!title || !title.trim()) return res.status(400).json({ error: "Title is required." });
  if (!body || !body.trim()) return res.status(400).json({ error: "Post body can't be empty." });

  const type = POST_TYPES.includes(post_type) ? post_type : "Discussion";
  const info = db
    .prepare(`INSERT INTO posts (community_slug, user_id, post_type, title, body) VALUES (?, ?, ?, ?, ?)`)
    .run(community.slug, req.userId, type, title.trim(), body.trim());

  const post = db
    .prepare(
      `SELECT p.id, p.post_type, p.title, p.body, p.created_at, u.name AS author_name
       FROM posts p JOIN users u ON u.id = p.user_id WHERE p.id = ?`
    )
    .get(info.lastInsertRowid);
  res.status(201).json(post);
});

app.get("/api/posts/:id", (req, res) => {
  const post = db
    .prepare(
      `SELECT p.*, u.name AS author_name FROM posts p JOIN users u ON u.id = p.user_id WHERE p.id = ?`
    )
    .get(req.params.id);
  if (!post) return res.status(404).json({ error: "Post not found." });

  const comments = db
    .prepare(
      `SELECT cm.id, cm.body, cm.created_at, u.name AS author_name
       FROM comments cm JOIN users u ON u.id = cm.user_id
       WHERE cm.post_id = ? ORDER BY cm.created_at ASC`
    )
    .all(req.params.id);

  res.json({ ...post, comments });
});

app.post("/api/posts/:id/comments", requireAuth, (req, res) => {
  const post = db.prepare(`SELECT id FROM posts WHERE id = ?`).get(req.params.id);
  if (!post) return res.status(404).json({ error: "Post not found." });

  const body = (req.body?.body || "").trim();
  if (!body) return res.status(400).json({ error: "Comment can't be empty." });

  const info = db.prepare(`INSERT INTO comments (post_id, user_id, body) VALUES (?, ?, ?)`).run(post.id, req.userId, body);
  const comment = db
    .prepare(
      `SELECT cm.id, cm.body, cm.created_at, u.name AS author_name
       FROM comments cm JOIN users u ON u.id = cm.user_id WHERE cm.id = ?`
    )
    .get(info.lastInsertRowid);
  res.status(201).json(comment);
});

// Lightweight moderation hook — flags a post for the (not-yet-built) Admin
// dashboard to review. Doesn't hide content automatically; one report
// shouldn't be enough to silently remove someone's post.
app.post("/api/posts/:id/report", requireAuth, (req, res) => {
  const post = db.prepare(`SELECT id FROM posts WHERE id = ?`).get(req.params.id);
  if (!post) return res.status(404).json({ error: "Post not found." });
  db.prepare(`UPDATE posts SET report_count = report_count + 1 WHERE id = ?`).run(post.id);
  res.json({ ok: true });
});

app.delete("/api/posts/:id", requireAuth, (req, res) => {
  const post = db.prepare(`SELECT id FROM posts WHERE id = ? AND user_id = ?`).get(req.params.id, req.userId);
  if (!post) return res.status(404).json({ error: "Post not found or not yours to delete." });
  db.prepare(`DELETE FROM comments WHERE post_id = ?`).run(post.id);
  db.prepare(`DELETE FROM posts WHERE id = ?`).run(post.id);
  res.json({ ok: true });
});


app.get("/api/resources", (req, res) => {
  const { type, career, level, cost, q } = req.query;
  const where = [];
  const params = {};
  if (type) {
    where.push("type = @type");
    params.type = type;
  }
  if (career) {
    where.push("career_slug = @career");
    params.career = career;
  }
  if (level) {
    where.push("level = @level");
    params.level = level;
  }
  if (cost) {
    where.push("cost = @cost");
    params.cost = cost;
  }
  if (q) {
    where.push("(title LIKE @q OR description LIKE @q)");
    params.q = `%${q}%`;
  }
  const rows = db
    .prepare(
      `SELECT r.*, c.title AS career_title FROM resources r
       JOIN careers c ON c.slug = r.career_slug
       ${where.length ? "WHERE " + where.join(" AND ") : ""}
       ORDER BY r.is_trending DESC, r.is_community_favorite DESC, r.title ASC`
    )
    .all(params);
  res.json(rows);
});

app.get("/api/resources/types", (req, res) => {
  const rows = db.prepare(`SELECT DISTINCT type FROM resources ORDER BY type ASC`).all();
  res.json(rows.map((r) => r.type));
});


app.get("/api/careers/:slug/skills/progress", requireAuth, (req, res) => {
  const rows = db
    .prepare(`SELECT skill_name FROM user_skills WHERE user_id = ? AND career_slug = ?`)
    .all(req.userId, req.params.slug);
  res.json(rows.map((r) => r.skill_name));
});

app.post("/api/careers/:slug/skills/progress", requireAuth, (req, res) => {
  const { skill_name, acquired } = req.body || {};
  if (!skill_name) return res.status(400).json({ error: "skill_name is required." });

  if (acquired) {
    db.prepare(`INSERT OR IGNORE INTO user_skills (user_id, career_slug, skill_name) VALUES (?, ?, ?)`).run(
      req.userId,
      req.params.slug,
      skill_name
    );
  } else {
    db.prepare(`DELETE FROM user_skills WHERE user_id = ? AND career_slug = ? AND skill_name = ?`).run(
      req.userId,
      req.params.slug,
      skill_name
    );
  }
  res.json(computeReadiness(req.params.slug, req.userId));
});

// --- AI Mentor (remembers commitment/roadmap/readiness across sessions) --
app.get("/api/mentor/history", requireAuth, (req, res) => {
  const rows = db
    .prepare(`SELECT role, content, created_at FROM mentor_messages WHERE user_id = ? ORDER BY id ASC`)
    .all(req.userId);
  res.json(rows);
});

app.post("/api/mentor/message", requireAuth, (req, res) => {
  const content = (req.body?.content || "").trim();
  if (!content) return res.status(400).json({ error: "Message can't be empty." });

  const user = db.prepare(`SELECT name FROM users WHERE id = ?`).get(req.userId);

  db.prepare(`INSERT INTO mentor_messages (user_id, role, content) VALUES (?, 'user', ?)`).run(req.userId, content);

  const reply = generateMentorReply(req.userId, user.name, content);

  db.prepare(`INSERT INTO mentor_messages (user_id, role, content) VALUES (?, 'mentor', ?)`).run(req.userId, reply);

  res.status(201).json({ reply });
});

app.delete("/api/mentor/history", requireAuth, (req, res) => {
  db.prepare(`DELETE FROM mentor_messages WHERE user_id = ?`).run(req.userId);
  res.json({ ok: true });
});


// --- Career Readiness Engine -----------------------------------------
app.get("/api/readiness/:slug", requireAuth, (req, res) => {
  const readiness = computeReadiness(req.params.slug, req.userId);
  if (!readiness) return res.status(404).json({ error: "Career not found." });
  res.json(readiness);
});


app.get("/api/commit", requireAuth, (req, res) => {
  const commitment = db.prepare(`SELECT * FROM commitments WHERE user_id = ?`).get(req.userId);
  if (!commitment) return res.json({ commitment: null });

  const career = db.prepare(`SELECT slug, title, summary, avg_salary, category_slug FROM careers WHERE slug = ?`).get(
    commitment.career_slug
  );
  res.json({ commitment: { ...commitment, career } });
});

app.post("/api/commit", requireAuth, (req, res) => {
  const { career_slug, mission_title, target_date } = req.body || {};
  const career = db.prepare(`SELECT slug, title FROM careers WHERE slug = ?`).get(career_slug || "");
  if (!career) return res.status(404).json({ error: "That career doesn't exist." });

  const mission = mission_title && mission_title.trim() ? mission_title.trim() : `Become a ${career.title}`;

  db.prepare(
    `INSERT INTO commitments (user_id, career_slug, mission_title, target_date)
     VALUES (@user_id, @career_slug, @mission_title, @target_date)
     ON CONFLICT(user_id) DO UPDATE SET
       career_slug = excluded.career_slug,
       mission_title = excluded.mission_title,
       target_date = excluded.target_date,
       created_at = datetime('now')`
  ).run({ user_id: req.userId, career_slug: career.slug, mission_title: mission, target_date: target_date || null });

  const commitment = db.prepare(`SELECT * FROM commitments WHERE user_id = ?`).get(req.userId);
  res.status(201).json({ commitment: { ...commitment, career } });
});

app.delete("/api/commit", requireAuth, (req, res) => {
  db.prepare(`DELETE FROM commitments WHERE user_id = ?`).run(req.userId);
  res.json({ ok: true });
});

// --- Saved Careers ------------------------------------------------------
app.get("/api/saved-careers", requireAuth, (req, res) => {
  const rows = db
    .prepare(
      `SELECT c.slug, c.title, c.summary, c.avg_salary, c.demand_level
       FROM saved_careers sc JOIN careers c ON c.slug = sc.career_slug
       WHERE sc.user_id = ? ORDER BY sc.created_at DESC`
    )
    .all(req.userId);
  res.json(rows);
});

app.post("/api/saved-careers", requireAuth, (req, res) => {
  const { slug } = req.body || {};
  const career = db.prepare(`SELECT slug FROM careers WHERE slug = ?`).get(slug || "");
  if (!career) return res.status(404).json({ error: "Career not found." });

  const existing = db.prepare(`SELECT id FROM saved_careers WHERE user_id = ? AND career_slug = ?`).get(req.userId, slug);
  if (existing) {
    db.prepare(`DELETE FROM saved_careers WHERE id = ?`).run(existing.id);
    return res.json({ saved: false });
  }
  db.prepare(`INSERT INTO saved_careers (user_id, career_slug) VALUES (?, ?)`).run(req.userId, slug);
  res.json({ saved: true });
});

// --- Personal Dashboard ---------------------------------------------------
app.get("/api/dashboard", requireAuth, (req, res) => {
  const commitment = db.prepare(`SELECT * FROM commitments WHERE user_id = ?`).get(req.userId);
  const savedCareers = db
    .prepare(
      `SELECT c.slug, c.title, c.summary, c.avg_salary
       FROM saved_careers sc JOIN careers c ON c.slug = sc.career_slug
       WHERE sc.user_id = ? ORDER BY sc.created_at DESC`
    )
    .all(req.userId);

  if (!commitment) {
    return res.json({ commitment: null, roadmap: null, savedCareers });
  }

  const career = db
    .prepare(`SELECT slug, title, summary, avg_salary, demand_level, category_slug FROM careers WHERE slug = ?`)
    .get(commitment.career_slug);
  const roadmap = getRoadmapWithProgress(commitment.career_slug, req.userId);
  const readiness = computeReadiness(commitment.career_slug, req.userId);

  res.json({
    commitment: { ...commitment, career },
    roadmap,
    readiness,
    savedCareers,
  });
});

app.get("/api/assessment/questions", (req, res) => {
  res.json(QUESTIONS.map((q) => ({ id: q.id, question: q.question, options: q.options })));
});

app.post("/api/assessment/submit", (req, res) => {
  const answers = Array.isArray(req.body.answers) ? req.body.answers : [];
  if (answers.length === 0) {
    return res.status(400).json({ error: "No answers submitted." });
  }

  // Each answer tag looks like "dimension:value" — pull the dimension out
  // so we know how much weight it carries.
  const weightedAnswers = answers
    .map((tag) => {
      const dimension = String(tag).split(":")[0];
      return { tag, dimension, weight: DIMENSION_WEIGHTS[dimension] || 1 };
    })
    .filter((a) => a.weight);

  const maxScore = weightedAnswers.reduce((sum, a) => sum + a.weight, 0);

  const careers = db
    .prepare(`SELECT id, slug, title, category_slug, summary, avg_salary, demand_level, difficulty_level, match_tags FROM careers`)
    .all();

  const scored = careers.map((c) => {
    let tags = [];
    try {
      tags = c.match_tags ? JSON.parse(c.match_tags) : [];
    } catch {
      tags = [];
    }
    const matchedAnswers = weightedAnswers.filter((a) => tags.includes(a.tag));
    const rawScore = matchedAnswers.reduce((sum, a) => sum + a.weight, 0);
    const score = maxScore > 0 ? Math.round((rawScore / maxScore) * 100) : 0;
    const reasons = matchedAnswers
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 3)
      .map((a) => TAG_REASONS[a.tag])
      .filter(Boolean);

    return {
      slug: c.slug,
      title: c.title,
      category_slug: c.category_slug,
      summary: c.summary,
      avg_salary: c.avg_salary,
      demand_level: c.demand_level,
      difficulty_level: c.difficulty_level,
      score,
      reasons,
    };
  });

  scored.sort((a, b) => b.score - a.score);

  res.json({
    top: scored.slice(0, 3),
    alternatives: scored.slice(3, 6),
  });
});


// Lightweight rule-based responder for the hero's "AI Career Assistant" entry
// point. Swap this out for a real LLM call (e.g. the Anthropic API) once a
// key is wired up server-side.
app.post("/api/ai/quick-guidance", (req, res) => {
  const prompt = (req.body.prompt || "").toLowerCase();
  let reply =
    "Tell me a bit about what you enjoy or what you're optimizing for (pay, flexibility, impact) and I'll point you toward a few careers worth exploring.";
  let suggestions = [];

  if (prompt.includes("cod") || prompt.includes("program") || prompt.includes("computer")) {
    reply = "Coding and problem-solving map well onto several fast-growing paths. Here are a few strong starting points:";
    suggestions = ["AI Engineer", "Data Analyst", "Cybersecurity Analyst"];
  } else if (prompt.includes("pay") || prompt.includes("salary") || prompt.includes("money")) {
    reply = "If pay is the priority, these careers currently combine strong compensation with real demand:";
    suggestions = ["AI Engineer", "Product Manager", "Financial Analyst"];
  } else if (prompt.includes("people") || prompt.includes("help") || prompt.includes("care")) {
    reply = "Careers built around directly helping people tend to fit this well:";
    suggestions = ["Registered Nurse", "UX Designer"];
  }

  res.json({ reply, suggestions });
});

// --- Newsletter / CTA capture --------------------------------------------
app.post("/api/newsletter", (req, res) => {
  const email = (req.body.email || "").trim();
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ error: "Enter a valid email address." });
  }
  try {
    db.prepare(`INSERT INTO newsletter_signups (email) VALUES (?)`).run(email);
  } catch (e) {
    // unique constraint -> already signed up, treat as success
  }
  res.json({ ok: true });
});

// --- Learning Roadmap ------------------------------------------------
app.get("/api/careers/:slug/roadmap", (req, res) => {
  const roadmap = getRoadmapWithProgress(req.params.slug, req.userId);
  if (!roadmap) return res.status(404).json({ error: "No roadmap written yet for this career." });
  res.json(roadmap);
});

app.post("/api/careers/:slug/roadmap/progress", requireAuth, (req, res) => {
  const { milestone_id, completed } = req.body || {};
  if (!milestone_id) return res.status(400).json({ error: "milestone_id is required." });

  if (completed) {
    db.prepare(
      `INSERT OR IGNORE INTO roadmap_progress (user_id, career_slug, milestone_id) VALUES (?, ?, ?)`
    ).run(req.userId, req.params.slug, milestone_id);
  } else {
    db.prepare(`DELETE FROM roadmap_progress WHERE user_id = ? AND career_slug = ? AND milestone_id = ?`).run(
      req.userId,
      req.params.slug,
      milestone_id
    );
  }

  const roadmap = getRoadmapWithProgress(req.params.slug, req.userId);
  res.json(roadmap);
});

// --- Career Detail: full profile ------------------------------------------
// Registered last among /api/careers/* routes: this is a catch-all param
// route, and Express matches in registration order, so every literal path
// above (featured, trending, search) must come first or it would be
// swallowed here (e.g. a request for /api/careers/search would otherwise be
// interpreted as slug="search").
app.get("/api/careers/:slug", (req, res) => {
  const career = db.prepare(`SELECT * FROM careers WHERE slug = ?`).get(req.params.slug);
  if (!career) return res.status(404).json({ error: "Career not found" });

  const jsonFields = [
    "day_responsibilities",
    "day_challenges",
    "day_tools",
    "skills_technical",
    "skills_soft",
    "skills_industry",
    "education_pathways",
    "certifications",
    "specializations",
  ];
  jsonFields.forEach((f) => {
    try {
      career[f] = career[f] ? JSON.parse(career[f]) : [];
    } catch {
      career[f] = [];
    }
  });

  career.countries = db.prepare(`SELECT * FROM career_countries WHERE career_id = ?`).all(career.id);

  res.json(career);
});

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.listen(PORT, () => {
  console.log(`CareerCraft API running on http://localhost:${PORT}`);
});

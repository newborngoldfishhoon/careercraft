const fs = require("fs");
const path = require("path");

function loadEnvFile(envPath) {
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx !== -1) {
          const key = trimmed.substring(0, eqIdx).trim();
          const val = trimmed.substring(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
          if (key && !process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    }
  }
}
loadEnvFile(path.join(__dirname, ".env"));
loadEnvFile(path.join(__dirname, "../.env"));

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const {
  supabase,
  selectAll,
  selectOne,
  insertRow,
  insertIgnore,
  updateRows,
  deleteRows,
  countRows,
  upsertRow,
} = require("./db");
const { QUESTIONS, DIMENSION_WEIGHTS, TAG_REASONS } = require("./questions");
const { signToken, attachUser, requireAuth } = require("./auth");
const { getRoadmapWithProgress } = require("./roadmap");
const { computeReadiness } = require("./readiness");
const { generateMentorReply } = require("./mentor");
const { getDashboardHtml } = require("./dashboardHtml");

const app = express();
const PORT = process.env.PORT || 4000;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "openai/gpt-4o";
const OPENROUTER_TITLE = process.env.OPENROUTER_TITLE || "CareerCraft Mentor";
const OPENROUTER_REFERER = process.env.OPENROUTER_REFERER || "https://careercraft.example.com";

const recentLogs = [];
const MAX_LOGS = 50;

app.use((req, res, next) => {
  const start = Date.now();
  const originalEnd = res.end;
  res.end = function (...args) {
    const duration = Date.now() - start;
    if (!req.url.startsWith("/api/diagnostics")) {
      recentLogs.unshift({
        timestamp: new Date().toISOString(),
        method: req.method,
        url: req.originalUrl || req.url,
        status: res.statusCode,
        durationMs: duration
      });
      if (recentLogs.length > MAX_LOGS) recentLogs.pop();
    }
    return originalEnd.apply(this, args);
  };
  next();
});

app.use(cors());
app.use(express.json());
app.use(attachUser);

async function getGroqMentorReply(userId, userName, message) {
  if (!GROQ_API_KEY) return null;

  const commitment = await selectOne("commitments", { filters: { user_id: userId } });
  const career = commitment
    ? await selectOne("careers", { columns: "slug, title", filters: { slug: commitment.career_slug } })
    : null;
  const roadmap = commitment ? await getRoadmapWithProgress(commitment.career_slug, userId) : null;
  const readiness = commitment ? await computeReadiness(commitment.career_slug, userId) : null;

  const systemContent = `You are CareerCraft's AI mentor. Your job is to give ultra-concise, direct, highly actionable career guidance.
RULES:
- Be extremely concise (2-4 sentences max or short bullet points).
- NO fluff, filler words, or generic intros/outros (avoid "Hello!", "Hope this helps!", or generic pleasantries).
- Get straight to the answer using the user's career context.`;
  let contextContent = `User name: ${userName}\n`;
  if (career) {
    contextContent += `Committed career: ${career.title}\n`;
  }
  if (roadmap) {
    contextContent += `Roadmap progress: ${roadmap.percent}%\n`;
    const next = roadmap.nextMilestones?.[0];
    if (next) {
      contextContent += `Next milestone: ${next.title} (${next.stage}, ~${next.weeks}w)\n`;
    }
  }
  if (readiness) {
    contextContent += `Readiness score: ${readiness.score}%\n`;
    if (readiness.priorityImprovements?.length) {
      contextContent += `Top improvement: ${readiness.priorityImprovements[0]}\n`;
    }
  }

  const payload = {
    model: GROQ_MODEL,
    messages: [
      { role: "system", content: systemContent },
      { role: "system", content: contextContent },
      { role: "user", content: message },
    ],
    temperature: 0.7,
    max_tokens: 1024,
  };

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Groq request failed: ${response.status} ${response.statusText} - ${errorBody}`);
  }

  const data = await response.json();
  return data?.choices?.[0]?.message?.content?.trim() || null;
}

async function getOpenRouterMentorReply(userId, userName, message) {
  if (!OPENROUTER_API_KEY) return null;

  const commitment = await selectOne("commitments", { filters: { user_id: userId } });
  const career = commitment
    ? await selectOne("careers", { columns: "slug, title", filters: { slug: commitment.career_slug } })
    : null;
  const roadmap = commitment ? await getRoadmapWithProgress(commitment.career_slug, userId) : null;
  const readiness = commitment ? await computeReadiness(commitment.career_slug, userId) : null;

  const systemContent = `You are CareerCraft's AI mentor. Your job is to give ultra-concise, direct, highly actionable career guidance.
RULES:
- Be extremely concise (2-4 sentences max or short bullet points).
- NO fluff, filler words, or generic intros/outros (avoid "Hello!", "Hope this helps!", or generic pleasantries).
- Get straight to the answer using the user's career context.`;
  let contextContent = `User name: ${userName}\n`;
  if (career) {
    contextContent += `Committed career: ${career.title}\n`;
  }
  if (roadmap) {
    contextContent += `Roadmap progress: ${roadmap.percent}%\n`;
    const next = roadmap.nextMilestones?.[0];
    if (next) {
      contextContent += `Next milestone: ${next.title} (${next.stage}, ~${next.weeks}w)\n`;
    }
  }
  if (readiness) {
    contextContent += `Readiness score: ${readiness.score}%\n`;
    if (readiness.priorityImprovements?.length) {
      contextContent += `Top improvement: ${readiness.priorityImprovements[0]}\n`;
    }
  }

  const payload = {
    model: OPENROUTER_MODEL,
    messages: [
      { role: "system", content: systemContent },
      { role: "system", content: contextContent },
      { role: "user", content: message },
    ],
  };

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "Referer": OPENROUTER_REFERER,
      "X-Title": OPENROUTER_TITLE,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenRouter request failed: ${response.status} ${response.statusText} - ${errorBody}`);
  }

  const data = await response.json();
  return data?.choices?.[0]?.message?.content?.trim() || null;
}

function serializeUser(row) {
  if (!row) return null;
  const { password_hash, ...safe } = row;
  return safe;
}

// --- Auth: signup / login / profile --------------------------------------
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    if (!name || !name.trim()) return res.status(400).json({ error: "Name is required." });
    if (!/^\S+@\S+\.\S+$/.test(email || "")) return res.status(400).json({ error: "Enter a valid email address." });
    if (!password || password.length < 8) return res.status(400).json({ error: "Password must be at least 8 characters." });

    const existing = await selectOne("users", { columns: "id", filters: { email: email.toLowerCase() } });
    if (existing) return res.status(409).json({ error: "An account with that email already exists." });

    const password_hash = bcrypt.hashSync(password, 10);
    const user = await insertRow("users", { name: name.trim(), email: email.toLowerCase(), password_hash });
    res.status(201).json({ token: signToken(user), user: serializeUser(user) });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const user = await selectOne("users", { filters: { email: String(email || "").toLowerCase() } });
    if (!user || !bcrypt.compareSync(password || "", user.password_hash)) {
      return res.status(401).json({ error: "Incorrect email or password." });
    }
    res.json({ token: signToken(user), user: serializeUser(user) });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

app.get("/api/auth/me", requireAuth, async (req, res) => {
  try {
    const user = await selectOne("users", { filters: { id: req.userId } });
    if (!user) return res.status(404).json({ error: "User not found." });
    res.json({ user: serializeUser(user) });
  } catch (err) {
    console.error("Auth/me error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

app.patch("/api/auth/profile", requireAuth, async (req, res) => {
  try {
    const { name, avatar_url, theme } = req.body || {};
    const current = await selectOne("users", { filters: { id: req.userId } });
    if (!current) return res.status(404).json({ error: "User not found." });

    const next = {
      name: name !== undefined && name.trim() ? name.trim() : current.name,
      avatar_url: avatar_url !== undefined ? avatar_url : current.avatar_url,
      theme: theme !== undefined && ["light", "dark"].includes(theme) ? theme : current.theme,
    };

    const updated = await updateRows("users", next, { id: req.userId });
    res.json({ user: serializeUser(updated[0] || current) });
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

// Password reset requires an email-sending service, which isn't wired up in
// this environment. This stub keeps the contract in place for later.
app.post("/api/auth/request-password-reset", (req, res) => {
  res.json({ ok: true, note: "Password reset emails aren't wired up yet in this environment." });
});

// --- Categories ---------------------------------------------------------
app.get("/api/categories", async (req, res) => {
  try {
    const rows = await selectAll("categories", { order: { column: "sort_order", ascending: true } });
    res.json(rows);
  } catch (err) {
    console.error("Categories error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

// --- Trust stats ---------------------------------------------------------
app.get("/api/stats", async (req, res) => {
  try {
    const rows = await selectAll("trust_stats", {
      columns: "label, value",
      order: { column: "sort_order", ascending: true },
    });
    res.json(rows);
  } catch (err) {
    console.error("Stats error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

// --- Careers: featured / trending / search ------------------------------
app.get("/api/careers/featured", async (req, res) => {
  try {
    const rows = await selectAll("careers", { filters: { is_featured: 1 } });
    res.json(rows);
  } catch (err) {
    console.error("Featured careers error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

app.get("/api/careers/trending", async (req, res) => {
  try {
    const rows = await selectAll("careers", { filters: { is_trending: 1 } });
    res.json(rows);
  } catch (err) {
    console.error("Trending careers error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

// --- Career Explorer: filterable list -----------------------------------
app.get("/api/careers", async (req, res) => {
  try {
    const { category, difficulty, remote, demand, q, sort } = req.query;

    const filters = {};
    if (category) filters.category_slug = category;
    if (difficulty) filters.difficulty_level = difficulty;
    if (remote) filters.remote_potential = remote;
    if (demand) filters.demand_level = demand;

    const columns = "id, slug, title, category_slug, summary, avg_salary, demand_level, growth_potential, difficulty_level, remote_potential, rating, is_featured, is_trending";

    const orderMap = {
      rating: [{ column: "rating", ascending: false }],
      salary: [{ column: "avg_salary", ascending: false }],
      trending: [{ column: "is_trending", ascending: false }, { column: "is_featured", ascending: false }],
    };
    const order = orderMap[sort] || [
      { column: "is_featured", ascending: false },
      { column: "is_trending", ascending: false },
      { column: "title", ascending: true },
    ];

    const ilike = {};
    if (q) {
      // For "or" searches across title and summary, use the orFilter
    }

    const rows = await selectAll("careers", {
      columns,
      filters,
      order,
      ilike,
      orFilter: q ? `title.ilike.%${q}%,summary.ilike.%${q}%` : undefined,
    });
    res.json(rows);
  } catch (err) {
    console.error("Careers list error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

app.get("/api/careers/search", async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    if (!q) return res.json([]);
    const rows = await selectAll("careers", {
      columns: "id, slug, title, category_slug, summary",
      ilike: { title: `%${q}%` },
      rawQuery: (query) => query.limit(8),
    });
    res.json(rows);
  } catch (err) {
    console.error("Careers search error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

// --- Success stories -------------------------------------------------------
app.get("/api/success-stories", async (req, res) => {
  try {
    const rows = await selectAll("success_stories", { order: { column: "sort_order", ascending: true } });
    res.json(rows);
  } catch (err) {
    console.error("Success stories error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

// --- FAQs -------------------------------------------------------------
app.get("/api/faqs", async (req, res) => {
  try {
    const rows = await selectAll("faqs", {
      columns: "question, answer",
      order: { column: "sort_order", ascending: true },
    });
    res.json(rows);
  } catch (err) {
    console.error("FAQs error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
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

app.get("/api/careers/compare", async (req, res) => {
  try {
    const slugs = String(req.query.slugs || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 3);

    if (slugs.length < 2) {
      return res.status(400).json({ error: "Provide at least 2 career slugs, comma-separated." });
    }

    const { data: careers, error } = await supabase
      .from("careers")
      .select("slug, title, category_slug, summary, avg_salary, demand_level, growth_potential, difficulty_level, remote_potential, education_requirement, rating")
      .in("slug", slugs);

    if (error) throw error;

    // Preserve the order the user picked them in.
    const ordered = slugs.map((s) => careers.find((c) => c.slug === s)).filter(Boolean);

    if (ordered.length < 2) {
      return res.status(404).json({ error: "Not enough matching careers found." });
    }

    res.json({
      careers: ordered,
      insights: generateComparisonInsights(ordered),
    });
  } catch (err) {
    console.error("Compare error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

// --- Opportunity Hub ----------------------------------------------------
app.get("/api/opportunities", async (req, res) => {
  try {
    const { type, career, remote } = req.query;
    // Use a raw query through supabase for the JOIN
    let query = supabase
      .from("opportunities")
      .select("*, careers!inner(title)");

    if (type) query = query.eq("type", type);
    if (career) query = query.eq("career_slug", career);
    if (remote === "true") query = query.eq("remote", 1);

    query = query.order("deadline", { ascending: true, nullsFirst: false });

    const { data, error } = await query;
    if (error) throw error;

    // Flatten the join result to match the old API shape
    const rows = (data || []).map((row) => {
      const { careers, ...rest } = row;
      return { ...rest, career_title: careers?.title || "" };
    });
    res.json(rows);
  } catch (err) {
    console.error("Opportunities error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

app.get("/api/opportunities/types", async (req, res) => {
  try {
    const { data, error } = await supabase.from("opportunities").select("type");
    if (error) throw error;
    const types = [...new Set((data || []).map((r) => r.type))].sort();
    res.json(types);
  } catch (err) {
    console.error("Opportunity types error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

// Smart recommendations: filtered to the user's committed career, then
// biased by readiness — lower-readiness users see internships/bootcamps
// first, higher-readiness users see jobs/fellowships first.
app.get("/api/opportunities/recommended", requireAuth, async (req, res) => {
  try {
    const commitment = await selectOne("commitments", { columns: "career_slug", filters: { user_id: req.userId } });
    if (!commitment) return res.json({ opportunities: [], reason: "no-commitment" });

    const readiness = await computeReadiness(commitment.career_slug, req.userId);
    const score = readiness ? readiness.score : 0;

    const { data: rows, error } = await supabase
      .from("opportunities")
      .select("*, careers!inner(title)")
      .eq("career_slug", commitment.career_slug);
    if (error) throw error;

    const flatRows = (rows || []).map((row) => {
      const { careers, ...rest } = row;
      return { ...rest, career_title: careers?.title || "" };
    });

    const earlyStageTypes = new Set(["Internship", "Bootcamp", "Volunteer", "Hackathon", "Competition", "Certification"]);
    const advancedTypes = new Set(["Job", "Fellowship", "Apprenticeship", "Research Program"]);

    flatRows.sort((a, b) => {
      const aScore = score < 50 ? (earlyStageTypes.has(a.type) ? 0 : 1) : advancedTypes.has(a.type) ? 0 : 1;
      const bScore = score < 50 ? (earlyStageTypes.has(b.type) ? 0 : 1) : advancedTypes.has(b.type) ? 0 : 1;
      if (aScore !== bScore) return aScore - bScore;
      return Math.abs(a.min_readiness - score) - Math.abs(b.min_readiness - score);
    });

    res.json({ opportunities: flatRows.slice(0, 6), reason: "matched", readinessScore: score });
  } catch (err) {
    console.error("Recommended opportunities error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

// --- Application Tracker --------------------------------------------------
app.get("/api/applications", requireAuth, async (req, res) => {
  try {
    const rows = await selectAll("applications", {
      filters: { user_id: req.userId },
      order: { column: "updated_at", ascending: false },
    });
    res.json(rows);
  } catch (err) {
    console.error("Applications list error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

app.post("/api/applications", requireAuth, async (req, res) => {
  try {
    const { opportunity_id, title, organization, status, notes, follow_up_date } = req.body || {};

    let finalTitle = title;
    let finalOrg = organization;
    if (opportunity_id) {
      const opp = await selectOne("opportunities", { columns: "title, organization", filters: { id: opportunity_id } });
      if (opp) {
        finalTitle = finalTitle || opp.title;
        finalOrg = finalOrg || opp.organization;
      }
    }
    if (!finalTitle || !finalTitle.trim()) return res.status(400).json({ error: "Title is required." });

    const created = await insertRow("applications", {
      user_id: req.userId,
      opportunity_id: opportunity_id || null,
      title: finalTitle.trim(),
      organization: (finalOrg || "").trim(),
      status: status && ["saved", "applied", "interviewing", "offer", "rejected"].includes(status) ? status : "saved",
      notes: notes || null,
      follow_up_date: follow_up_date || null,
    });

    res.status(201).json(created);
  } catch (err) {
    console.error("Application create error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

app.patch("/api/applications/:id", requireAuth, async (req, res) => {
  try {
    const existing = await selectOne("applications", { filters: { id: parseInt(req.params.id), user_id: req.userId } });
    if (!existing) return res.status(404).json({ error: "Application not found." });

    const { status, notes, follow_up_date } = req.body || {};
    const next = {
      status: status && ["saved", "applied", "interviewing", "offer", "rejected"].includes(status) ? status : existing.status,
      notes: notes !== undefined ? notes : existing.notes,
      follow_up_date: follow_up_date !== undefined ? follow_up_date : existing.follow_up_date,
      updated_at: new Date().toISOString(),
    };

    const updated = await updateRows("applications", next, { id: parseInt(req.params.id) });
    res.json(updated[0] || existing);
  } catch (err) {
    console.error("Application update error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

app.delete("/api/applications/:id", requireAuth, async (req, res) => {
  try {
    const existing = await selectOne("applications", { columns: "id", filters: { id: parseInt(req.params.id), user_id: req.userId } });
    if (!existing) return res.status(404).json({ error: "Application not found." });
    await deleteRows("applications", { id: parseInt(req.params.id) });
    res.json({ ok: true });
  } catch (err) {
    console.error("Application delete error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
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

async function getCareerSkillList(slug) {
  const c = await selectOne("careers", { columns: "skills_technical, skills_soft, skills_industry", filters: { slug } });
  if (!c) return [];
  return [
    ...parseJsonSafe(c.skills_technical).map((s) => ({ ...s, group: "Technical" })),
    ...parseJsonSafe(c.skills_soft).map((s) => ({ ...s, group: "Soft" })),
    ...parseJsonSafe(c.skills_industry).map((s) => ({ ...s, group: "Industry" })),
  ];
}

app.post("/api/transition", async (req, res) => {
  try {
    const { source_type, source_career_slug, current_skills, target_career_slug } = req.body || {};

    const target = await selectOne("careers", {
      columns: "slug, title, difficulty_level",
      filters: { slug: target_career_slug || "" },
    });
    if (!target) return res.status(404).json({ error: "Target career not found." });

    const targetSkills = await getCareerSkillList(target.slug);
    if (targetSkills.length === 0) {
      return res.status(404).json({ error: "No detailed skill data for this target career yet — try one of the four flagship careers (AI Engineer, UX Designer, Registered Nurse, Product Manager)." });
    }

    let sourceLabel;
    let currentSkillNames = [];

    if (source_type === "career") {
      const source = await selectOne("careers", { columns: "slug, title", filters: { slug: source_career_slug || "" } });
      if (!source) return res.status(404).json({ error: "Source career not found." });
      const sourceSkills = await getCareerSkillList(source.slug);
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

    const roadmap = await getRoadmapWithProgress(target.slug, null);
    const totalRoadmapWeeks = roadmap
      ? roadmap.stages.flatMap((s) => s.milestones).reduce((sum, m) => sum + (m.weeks || 0), 0)
      : null;
    const missingRatio = targetSkills.length ? missing.length / targetSkills.length : 1;
    const estimatedTimelineWeeks = totalRoadmapWeeks !== null ? Math.round(totalRoadmapWeeks * Math.max(missingRatio, 0.15)) : null;

    const certRow = await selectOne("careers", { columns: "certifications", filters: { slug: target.slug } });
    const certifications = parseJsonSafe(certRow.certifications).slice(0, 2);

    const specRow = await selectOne("careers", { columns: "specializations", filters: { slug: target.slug } });
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
  } catch (err) {
    console.error("Transition error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
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

app.get("/api/colleges", async (req, res) => {
  try {
    const { type, country, q } = req.query;
    const filters = {};
    if (type) filters.type = type;
    if (country) filters.country = country;

    const rows = await selectAll("colleges", {
      columns: "slug, name, type, location, country, overview, fees, placements_percent, avg_package, acceptance_rate, rating",
      filters,
      ilike: q ? { name: `%${q}%` } : undefined,
      order: { column: "rating", ascending: false },
    });
    res.json(rows);
  } catch (err) {
    console.error("Colleges error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

app.get("/api/colleges/:slug", async (req, res) => {
  try {
    const row = await selectOne("colleges", { filters: { slug: req.params.slug } });
    if (!row) return res.status(404).json({ error: "College not found." });
    res.json(parseCollegeRow(row));
  } catch (err) {
    console.error("College detail error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

app.get("/api/exams", async (req, res) => {
  try {
    const rows = await selectAll("entrance_exams", {
      columns: "slug, name, overview, difficulty",
      order: { column: "name", ascending: true },
    });
    res.json(rows);
  } catch (err) {
    console.error("Exams error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

app.get("/api/exams/:slug", async (req, res) => {
  try {
    const row = await selectOne("entrance_exams", { filters: { slug: req.params.slug } });
    if (!row) return res.status(404).json({ error: "Exam not found." });
    res.json({
      ...row,
      syllabus: parseJsonSafe(row.syllabus),
      prep_resources: parseJsonSafe(row.prep_resources),
      related_career_slugs: parseJsonSafe(row.related_career_slugs),
    });
  } catch (err) {
    console.error("Exam detail error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

// --- Community ------------------------------------------------------------
const POST_TYPES = ["Question", "Experience", "Resource", "Review", "Advice", "Discuss Roadmaps", "Discussion"];

app.get("/api/communities", async (req, res) => {
  try {
    // Supabase doesn't support subqueries in select directly the same way,
    // so we'll get communities and count posts separately
    const communities = await selectAll("communities", { order: { column: "sort_order", ascending: true } });

    // Get post counts per community
    const postCounts = {};
    for (const c of communities) {
      const count = await countRows("posts", { community_slug: c.slug });
      postCounts[c.slug] = count;
    }

    const rows = communities.map((c) => ({ ...c, post_count: postCounts[c.slug] || 0 }));
    res.json(rows);
  } catch (err) {
    console.error("Communities error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

app.get("/api/communities/:slug", async (req, res) => {
  try {
    const community = await selectOne("communities", { filters: { slug: req.params.slug } });
    if (!community) return res.status(404).json({ error: "Community not found." });
    res.json(community);
  } catch (err) {
    console.error("Community detail error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

app.get("/api/communities/:slug/posts", async (req, res) => {
  try {
    const { type, q } = req.query;

    let query = supabase
      .from("posts")
      .select("id, post_type, title, body, created_at, users!inner(name)")
      .eq("community_slug", req.params.slug)
      .order("created_at", { ascending: false });

    if (type) query = query.eq("post_type", type);
    if (q) query = query.or(`title.ilike.%${q}%,body.ilike.%${q}%`);

    const { data: posts, error } = await query;
    if (error) throw error;

    // Get comment counts for each post
    const rows = [];
    for (const p of (posts || [])) {
      const commentCount = await countRows("comments", { post_id: p.id });
      const { users, ...rest } = p;
      rows.push({ ...rest, author_name: users?.name || "", comment_count: commentCount });
    }

    res.json(rows);
  } catch (err) {
    console.error("Community posts error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

app.post("/api/communities/:slug/posts", requireAuth, async (req, res) => {
  try {
    const community = await selectOne("communities", { columns: "slug", filters: { slug: req.params.slug } });
    if (!community) return res.status(404).json({ error: "Community not found." });

    const { title, body, post_type } = req.body || {};
    if (!title || !title.trim()) return res.status(400).json({ error: "Title is required." });
    if (!body || !body.trim()) return res.status(400).json({ error: "Post body can't be empty." });

    const type = POST_TYPES.includes(post_type) ? post_type : "Discussion";
    const inserted = await insertRow("posts", {
      community_slug: community.slug,
      user_id: req.userId,
      post_type: type,
      title: title.trim(),
      body: body.trim(),
    });

    // Fetch with author name
    const { data: post, error } = await supabase
      .from("posts")
      .select("id, post_type, title, body, created_at, users!inner(name)")
      .eq("id", inserted.id)
      .single();
    if (error) throw error;

    const { users, ...rest } = post;
    res.status(201).json({ ...rest, author_name: users?.name || "" });
  } catch (err) {
    console.error("Create post error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

app.get("/api/posts/:id", async (req, res) => {
  try {
    const { data: post, error: postErr } = await supabase
      .from("posts")
      .select("*, users!inner(name)")
      .eq("id", parseInt(req.params.id))
      .single();
    if (postErr || !post) return res.status(404).json({ error: "Post not found." });

    const { users: postUser, ...postRest } = post;

    const { data: comments, error: cmErr } = await supabase
      .from("comments")
      .select("id, body, created_at, users!inner(name)")
      .eq("post_id", parseInt(req.params.id))
      .order("created_at", { ascending: true });
    if (cmErr) throw cmErr;

    const flatComments = (comments || []).map((cm) => {
      const { users, ...rest } = cm;
      return { ...rest, author_name: users?.name || "" };
    });

    res.json({ ...postRest, author_name: postUser?.name || "", comments: flatComments });
  } catch (err) {
    console.error("Post detail error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

app.post("/api/posts/:id/comments", requireAuth, async (req, res) => {
  try {
    const post = await selectOne("posts", { columns: "id", filters: { id: parseInt(req.params.id) } });
    if (!post) return res.status(404).json({ error: "Post not found." });

    const body = (req.body?.body || "").trim();
    if (!body) return res.status(400).json({ error: "Comment can't be empty." });

    const inserted = await insertRow("comments", { post_id: post.id, user_id: req.userId, body });

    const { data: comment, error } = await supabase
      .from("comments")
      .select("id, body, created_at, users!inner(name)")
      .eq("id", inserted.id)
      .single();
    if (error) throw error;

    const { users, ...rest } = comment;
    res.status(201).json({ ...rest, author_name: users?.name || "" });
  } catch (err) {
    console.error("Create comment error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

// Lightweight moderation hook — flags a post for the (not-yet-built) Admin
// dashboard to review. Doesn't hide content automatically; one report
// shouldn't be enough to silently remove someone's post.
app.post("/api/posts/:id/report", requireAuth, async (req, res) => {
  try {
    const post = await selectOne("posts", { columns: "id, report_count", filters: { id: parseInt(req.params.id) } });
    if (!post) return res.status(404).json({ error: "Post not found." });
    await updateRows("posts", { report_count: (post.report_count || 0) + 1 }, { id: post.id });
    res.json({ ok: true });
  } catch (err) {
    console.error("Report post error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

app.delete("/api/posts/:id", requireAuth, async (req, res) => {
  try {
    const post = await selectOne("posts", { columns: "id", filters: { id: parseInt(req.params.id), user_id: req.userId } });
    if (!post) return res.status(404).json({ error: "Post not found or not yours to delete." });
    await deleteRows("comments", { post_id: post.id });
    await deleteRows("posts", { id: post.id });
    res.json({ ok: true });
  } catch (err) {
    console.error("Delete post error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});


app.get("/api/resources", async (req, res) => {
  try {
    const { type, career, level, cost, q } = req.query;

    let query = supabase
      .from("resources")
      .select("*, careers!inner(title)")
      .order("is_trending", { ascending: false })
      .order("is_community_favorite", { ascending: false })
      .order("title", { ascending: true });

    if (type) query = query.eq("type", type);
    if (career) query = query.eq("career_slug", career);
    if (level) query = query.eq("level", level);
    if (cost) query = query.eq("cost", cost);
    if (q) query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`);

    const { data, error } = await query;
    if (error) throw error;

    const rows = (data || []).map((row) => {
      const { careers, ...rest } = row;
      return { ...rest, career_title: careers?.title || "" };
    });
    res.json(rows);
  } catch (err) {
    console.error("Resources error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

app.get("/api/resources/types", async (req, res) => {
  try {
    const { data, error } = await supabase.from("resources").select("type");
    if (error) throw error;
    const types = [...new Set((data || []).map((r) => r.type))].sort();
    res.json(types);
  } catch (err) {
    console.error("Resource types error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});


app.get("/api/careers/:slug/skills/progress", requireAuth, async (req, res) => {
  try {
    const rows = await selectAll("user_skills", {
      columns: "skill_name",
      filters: { user_id: req.userId, career_slug: req.params.slug },
    });
    res.json(rows.map((r) => r.skill_name));
  } catch (err) {
    console.error("Skills progress error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

app.post("/api/careers/:slug/skills/progress", requireAuth, async (req, res) => {
  try {
    const { skill_name, acquired } = req.body || {};
    if (!skill_name) return res.status(400).json({ error: "skill_name is required." });

    if (acquired) {
      // INSERT OR IGNORE equivalent
      const existing = await selectOne("user_skills", {
        columns: "id",
        filters: { user_id: req.userId, career_slug: req.params.slug, skill_name },
      });
      if (!existing) {
        await insertRow("user_skills", { user_id: req.userId, career_slug: req.params.slug, skill_name });
      }
    } else {
      await deleteRows("user_skills", { user_id: req.userId, career_slug: req.params.slug, skill_name });
    }
    const readiness = await computeReadiness(req.params.slug, req.userId);
    res.json(readiness);
  } catch (err) {
    console.error("Skills progress update error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

// --- AI Mentor (remembers commitment/roadmap/readiness across sessions) --
app.get("/api/mentor/history", requireAuth, async (req, res) => {
  try {
    const rows = await selectAll("mentor_messages", {
      columns: "role, content, created_at",
      filters: { user_id: req.userId },
      order: { column: "id", ascending: true },
    });
    res.json(rows);
  } catch (err) {
    console.error("Mentor history error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

app.post("/api/mentor/message", requireAuth, async (req, res) => {
  try {
    const content = (req.body?.content || "").trim();
    if (!content) return res.status(400).json({ error: "Message can't be empty." });

    const user = await selectOne("users", { columns: "name", filters: { id: req.userId } });
    const userName = user?.name || "CareerCraft user";

    await insertRow("mentor_messages", { user_id: req.userId, role: "user", content });

    let reply = null;
    if (GROQ_API_KEY) {
      try {
        reply = await getGroqMentorReply(req.userId, userName, content);
      } catch (err) {
        console.error("Groq AI mentor reply failed:", err);
      }
    }

    if (!reply && OPENROUTER_API_KEY) {
      try {
        reply = await getOpenRouterMentorReply(req.userId, userName, content);
      } catch (err) {
        console.error("OpenRouter mentor reply failed:", err);
      }
    }

    if (!reply) {
      reply = await generateMentorReply(req.userId, userName, content);
    }

    await insertRow("mentor_messages", { user_id: req.userId, role: "mentor", content: reply });

    res.status(201).json({ reply });
  } catch (err) {
    console.error("Mentor message error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

app.delete("/api/mentor/history", requireAuth, async (req, res) => {
  try {
    await deleteRows("mentor_messages", { user_id: req.userId });
    res.json({ ok: true });
  } catch (err) {
    console.error("Delete mentor history error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});


// --- Career Readiness Engine -----------------------------------------
app.get("/api/readiness/:slug", requireAuth, async (req, res) => {
  try {
    const readiness = await computeReadiness(req.params.slug, req.userId);
    if (!readiness) return res.status(404).json({ error: "Career not found." });
    res.json(readiness);
  } catch (err) {
    console.error("Readiness error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});


app.get("/api/commit", requireAuth, async (req, res) => {
  try {
    const commitment = await selectOne("commitments", { filters: { user_id: req.userId } });
    if (!commitment) return res.json({ commitment: null });

    const career = await selectOne("careers", {
      columns: "slug, title, summary, avg_salary, category_slug",
      filters: { slug: commitment.career_slug },
    });
    res.json({ commitment: { ...commitment, career } });
  } catch (err) {
    console.error("Get commitment error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

app.post("/api/commit", requireAuth, async (req, res) => {
  try {
    const { career_slug, mission_title, target_date } = req.body || {};
    const career = await selectOne("careers", { columns: "slug, title", filters: { slug: career_slug || "" } });
    if (!career) return res.status(404).json({ error: "That career doesn't exist." });

    const mission = mission_title && mission_title.trim() ? mission_title.trim() : `Become a ${career.title}`;

    await upsertRow("commitments", {
      user_id: req.userId,
      career_slug: career.slug,
      mission_title: mission,
      target_date: target_date || null,
      created_at: new Date().toISOString(),
    }, "user_id");

    const commitment = await selectOne("commitments", { filters: { user_id: req.userId } });
    res.status(201).json({ commitment: { ...commitment, career } });
  } catch (err) {
    console.error("Create commitment error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

app.delete("/api/commit", requireAuth, async (req, res) => {
  try {
    await deleteRows("commitments", { user_id: req.userId });
    res.json({ ok: true });
  } catch (err) {
    console.error("Delete commitment error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

// --- Saved Careers ------------------------------------------------------
app.get("/api/saved-careers", requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("saved_careers")
      .select("careers!inner(slug, title, summary, avg_salary, demand_level)")
      .eq("user_id", req.userId)
      .order("created_at", { ascending: false });
    if (error) throw error;

    const rows = (data || []).map((r) => r.careers);
    res.json(rows);
  } catch (err) {
    console.error("Saved careers error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

app.post("/api/saved-careers", requireAuth, async (req, res) => {
  try {
    const { slug } = req.body || {};
    const career = await selectOne("careers", { columns: "slug", filters: { slug: slug || "" } });
    if (!career) return res.status(404).json({ error: "Career not found." });

    const existing = await selectOne("saved_careers", { columns: "id", filters: { user_id: req.userId, career_slug: slug } });
    if (existing) {
      await deleteRows("saved_careers", { id: existing.id });
      return res.json({ saved: false });
    }
    await insertRow("saved_careers", { user_id: req.userId, career_slug: slug });
    res.json({ saved: true });
  } catch (err) {
    console.error("Toggle saved career error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

// --- Personal Dashboard ---------------------------------------------------
app.get("/api/dashboard", requireAuth, async (req, res) => {
  try {
    const commitment = await selectOne("commitments", { filters: { user_id: req.userId } });

    const { data: savedData, error: savedErr } = await supabase
      .from("saved_careers")
      .select("careers!inner(slug, title, summary, avg_salary)")
      .eq("user_id", req.userId)
      .order("created_at", { ascending: false });
    if (savedErr) throw savedErr;
    const savedCareers = (savedData || []).map((r) => r.careers);

    if (!commitment) {
      return res.json({ commitment: null, roadmap: null, savedCareers });
    }

    const career = await selectOne("careers", {
      columns: "slug, title, summary, avg_salary, demand_level, category_slug",
      filters: { slug: commitment.career_slug },
    });
    const roadmap = await getRoadmapWithProgress(commitment.career_slug, req.userId);
    const readiness = await computeReadiness(commitment.career_slug, req.userId);

    res.json({
      commitment: { ...commitment, career },
      roadmap,
      readiness,
      savedCareers,
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

app.get("/api/assessment/questions", (req, res) => {
  res.json(QUESTIONS.map((q) => ({ id: q.id, question: q.question, options: q.options })));
});

app.post("/api/assessment/submit", async (req, res) => {
  try {
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

    const careers = await selectAll("careers", {
      columns: "id, slug, title, category_slug, summary, avg_salary, demand_level, difficulty_level, match_tags",
    });

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
  } catch (err) {
    console.error("Assessment submit error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
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
app.post("/api/newsletter", async (req, res) => {
  try {
    const email = (req.body.email || "").trim();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ error: "Enter a valid email address." });
    }
    // INSERT OR IGNORE equivalent — just swallow unique constraint errors
    try {
      await insertRow("newsletter_signups", { email });
    } catch (e) {
      // unique constraint -> already signed up, treat as success
    }
    res.json({ ok: true });
  } catch (err) {
    console.error("Newsletter error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

// --- Learning Roadmap ------------------------------------------------
app.get("/api/careers/:slug/roadmap", async (req, res) => {
  try {
    const roadmap = await getRoadmapWithProgress(req.params.slug, req.userId);
    if (!roadmap) return res.status(404).json({ error: "No roadmap written yet for this career." });
    res.json(roadmap);
  } catch (err) {
    console.error("Roadmap error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

app.post("/api/careers/:slug/roadmap/progress", requireAuth, async (req, res) => {
  try {
    const { milestone_id, completed } = req.body || {};
    if (!milestone_id) return res.status(400).json({ error: "milestone_id is required." });

    if (completed) {
      // INSERT OR IGNORE equivalent
      const existing = await selectOne("roadmap_progress", {
        columns: "id",
        filters: { user_id: req.userId, career_slug: req.params.slug, milestone_id },
      });
      if (!existing) {
        await insertRow("roadmap_progress", { user_id: req.userId, career_slug: req.params.slug, milestone_id });
      }
    } else {
      await deleteRows("roadmap_progress", { user_id: req.userId, career_slug: req.params.slug, milestone_id });
    }

    const roadmap = await getRoadmapWithProgress(req.params.slug, req.userId);
    res.json(roadmap);
  } catch (err) {
    console.error("Roadmap progress error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

// --- Career Detail: full profile ------------------------------------------
// Registered last among /api/careers/* routes: this is a catch-all param
// route, and Express matches in registration order, so every literal path
// above (featured, trending, search) must come first or it would be
// swallowed here (e.g. a request for /api/careers/search would otherwise be
// interpreted as slug="search").
app.get("/api/careers/:slug", async (req, res) => {
  try {
    const career = await selectOne("careers", { filters: { slug: req.params.slug } });
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

    career.countries = await selectAll("career_countries", { filters: { career_id: career.id } });

    res.json(career);
  } catch (err) {
    console.error("Career detail error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.get("/api/diagnostics/stats", async (req, res) => {
  try {
    const tables = [
      "careers", "categories", "users", "commitments", "faqs",
      "trust_stats", "colleges", "entrance_exams", "resources",
      "communities", "posts", "newsletter_signups"
    ];
    const tableCounts = {};
    for (const t of tables) {
      tableCounts[t] = await countRows(t);
    }

    res.json({
      status: "online",
      uptimeSeconds: process.uptime(),
      nodeVersion: process.version,
      memoryUsage: process.memoryUsage(),
      env: process.env.NODE_ENV || "development",
      port: PORT,
      database: {
        type: "supabase-postgresql",
        connected: true,
        tables: tableCounts
      }
    });
  } catch (err) {
    console.error("Diagnostics stats error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

app.get("/api/diagnostics/logs", (req, res) => {
  res.json({ logs: recentLogs });
});

app.get("/api/diagnostics/db-check", async (req, res) => {
  try {
    // PostgreSQL equivalent of SQLite's pragma quick_check
    const { data, error } = await supabase.from("categories").select("id").limit(1);
    if (error) throw error;
    res.json({ status: "ok", checkResult: "Supabase connection is healthy" });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// Root & Diagnostics Dashboard UI
app.get("/", (req, res) => {
  res.setHeader("Content-Type", "text/html");
  res.send(getDashboardHtml(PORT));
});

app.get("/diagnostics", (req, res) => {
  res.setHeader("Content-Type", "text/html");
  res.send(getDashboardHtml(PORT));
});

app.listen(PORT, () => {
  console.log(`CareerCraft API running on http://localhost:${PORT}`);
});

const path = require("path");
const Database = require("better-sqlite3");

const DB_PATH = path.join(__dirname, "careercraft.db");
const db = new Database(DB_PATH);

db.pragma("journal_mode = WAL");

// --- Schema -----------------------------------------------------------
db.exec(`
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  career_count INTEGER NOT NULL DEFAULT 0,
  icon TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS careers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  category_slug TEXT NOT NULL,
  summary TEXT NOT NULL,
  avg_salary TEXT NOT NULL,
  demand_level TEXT NOT NULL,
  growth_potential TEXT NOT NULL,
  difficulty_level TEXT NOT NULL DEFAULT 'Moderate',
  remote_potential TEXT NOT NULL DEFAULT 'Moderate',
  education_requirement TEXT NOT NULL DEFAULT 'Varies',
  rating REAL NOT NULL DEFAULT 4.2,
  is_featured INTEGER NOT NULL DEFAULT 0,
  is_trending INTEGER NOT NULL DEFAULT 0,

  -- "About this career"
  about_what TEXT,
  about_why TEXT,
  about_suitable TEXT,
  about_not_suitable TEXT,
  about_misconceptions TEXT,

  -- "Day in the life" (JSON-encoded arrays/strings, parsed by the API layer)
  day_responsibilities TEXT,   -- JSON array of strings
  day_schedule TEXT,
  day_challenges TEXT,         -- JSON array of strings
  day_tools TEXT,              -- JSON array of strings

  -- Skills, grouped
  skills_technical TEXT,       -- JSON array of {name, description, importance, difficulty}
  skills_soft TEXT,            -- JSON array of {name, description, importance, difficulty}
  skills_industry TEXT,        -- JSON array of {name, description, importance, difficulty}

  education_pathways TEXT,     -- JSON array of {name, description}
  certifications TEXT,         -- JSON array of {level, name, cost, benefit}
  specializations TEXT,        -- JSON array of {name, description}
  match_tags TEXT,             -- JSON array of trait tags, e.g. ["interest:technical","pace:fast"]

  -- Learning Roadmap, one JSON array of milestones per stage:
  -- {id, title, description, resources: [{name, type}], weeks}
  roadmap_beginner TEXT,
  roadmap_intermediate TEXT,
  roadmap_advanced TEXT
);

CREATE TABLE IF NOT EXISTS career_countries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  career_id INTEGER NOT NULL REFERENCES careers(id),
  country TEXT NOT NULL,
  avg_salary TEXT NOT NULL,
  entry_salary TEXT NOT NULL,
  senior_salary TEXT NOT NULL,
  demand_level TEXT NOT NULL,
  competition_level TEXT NOT NULL,
  top_cities TEXT NOT NULL,
  top_employers TEXT NOT NULL,
  visa_info TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS trust_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  label TEXT NOT NULL,
  value TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS success_stories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  headline TEXT NOT NULL,
  path TEXT NOT NULL,
  quote TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS faqs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  avatar_url TEXT,
  theme TEXT NOT NULL DEFAULT 'light',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS commitments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id),
  career_slug TEXT NOT NULL,
  mission_title TEXT NOT NULL,
  target_date TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS roadmap_progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  career_slug TEXT NOT NULL,
  milestone_id TEXT NOT NULL,
  completed_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, career_slug, milestone_id)
);

CREATE TABLE IF NOT EXISTS saved_careers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  career_slug TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, career_slug)
);

CREATE TABLE IF NOT EXISTS user_skills (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  career_slug TEXT NOT NULL,
  skill_name TEXT NOT NULL,
  acquired_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, career_slug, skill_name)
);

CREATE TABLE IF NOT EXISTS mentor_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  role TEXT NOT NULL CHECK (role IN ('user', 'mentor')),
  content TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS opportunities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  career_slug TEXT NOT NULL,
  organization TEXT NOT NULL,
  location TEXT NOT NULL,
  remote INTEGER NOT NULL DEFAULT 0,
  description TEXT NOT NULL,
  url TEXT,
  deadline TEXT,
  min_readiness INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  opportunity_id INTEGER REFERENCES opportunities(id),
  title TEXT NOT NULL,
  organization TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'saved' CHECK (status IN ('saved','applied','interviewing','offer','rejected')),
  notes TEXT,
  follow_up_date TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS colleges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,               -- Government, Private, International, Specialized, Online
  location TEXT NOT NULL,
  country TEXT NOT NULL,
  overview TEXT NOT NULL,
  programs TEXT NOT NULL,           -- JSON array of strings
  fees TEXT NOT NULL,
  scholarships TEXT,
  placements_percent INTEGER,
  avg_package TEXT,
  top_recruiters TEXT,              -- JSON array of strings
  admission_requirements TEXT,
  acceptance_rate TEXT,
  campus_highlights TEXT,           -- JSON array of strings
  rating REAL NOT NULL DEFAULT 4.0,
  related_career_slugs TEXT         -- JSON array of career slugs
);

CREATE TABLE IF NOT EXISTS entrance_exams (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  overview TEXT NOT NULL,
  eligibility TEXT NOT NULL,
  syllabus TEXT,                    -- JSON array of strings
  difficulty TEXT NOT NULL,
  prep_resources TEXT,              -- JSON array of {name, type}
  important_dates TEXT,
  past_trends TEXT,
  recommended_strategy TEXT,
  related_career_slugs TEXT         -- JSON array of career slugs
);

CREATE TABLE IF NOT EXISTS resources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  type TEXT NOT NULL,             -- YouTube Channel, Documentation, Course, Book, Blog, Podcast, Community, Practice Platform, Research Paper, Tool, Template
  career_slug TEXT NOT NULL,
  level TEXT NOT NULL,            -- Beginner, Intermediate, Advanced
  cost TEXT NOT NULL,             -- Free, Paid
  url TEXT,
  description TEXT NOT NULL,
  is_trending INTEGER NOT NULL DEFAULT 0,
  is_community_favorite INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS communities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category_slug TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  community_slug TEXT NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users(id),
  post_type TEXT NOT NULL DEFAULT 'Discussion', -- Question, Experience, Resource, Review, Advice, Discussion
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  report_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL REFERENCES posts(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS newsletter_signups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`);

module.exports = db;

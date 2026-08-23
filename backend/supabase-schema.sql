-- CareerCraft: Supabase PostgreSQL Schema
-- Translated from SQLite schema in db.js

-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  career_count INTEGER NOT NULL DEFAULT 0,
  icon TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS careers (
  id SERIAL PRIMARY KEY,
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

  -- "Day in the life" (JSON-encoded arrays/strings)
  day_responsibilities TEXT,
  day_schedule TEXT,
  day_challenges TEXT,
  day_tools TEXT,

  -- Skills, grouped
  skills_technical TEXT,
  skills_soft TEXT,
  skills_industry TEXT,

  education_pathways TEXT,
  certifications TEXT,
  specializations TEXT,
  match_tags TEXT,

  -- Learning Roadmap
  roadmap_beginner TEXT,
  roadmap_intermediate TEXT,
  roadmap_advanced TEXT
);

CREATE TABLE IF NOT EXISTS career_countries (
  id SERIAL PRIMARY KEY,
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
  id SERIAL PRIMARY KEY,
  label TEXT NOT NULL,
  value TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS success_stories (
  id SERIAL PRIMARY KEY,
  headline TEXT NOT NULL,
  path TEXT NOT NULL,
  quote TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS faqs (
  id SERIAL PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  avatar_url TEXT,
  theme TEXT NOT NULL DEFAULT 'light',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS commitments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id),
  career_slug TEXT NOT NULL,
  mission_title TEXT NOT NULL,
  target_date TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS roadmap_progress (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  career_slug TEXT NOT NULL,
  milestone_id TEXT NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, career_slug, milestone_id)
);

CREATE TABLE IF NOT EXISTS saved_careers (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  career_slug TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, career_slug)
);

CREATE TABLE IF NOT EXISTS user_skills (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  career_slug TEXT NOT NULL,
  skill_name TEXT NOT NULL,
  acquired_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, career_slug, skill_name)
);

CREATE TABLE IF NOT EXISTS mentor_messages (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  role TEXT NOT NULL CHECK (role IN ('user', 'mentor')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS opportunities (
  id SERIAL PRIMARY KEY,
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
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  opportunity_id INTEGER REFERENCES opportunities(id),
  title TEXT NOT NULL,
  organization TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'saved' CHECK (status IN ('saved','applied','interviewing','offer','rejected')),
  notes TEXT,
  follow_up_date TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS colleges (
  id SERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  location TEXT NOT NULL,
  country TEXT NOT NULL,
  overview TEXT NOT NULL,
  programs TEXT NOT NULL,
  fees TEXT NOT NULL,
  scholarships TEXT,
  placements_percent INTEGER,
  avg_package TEXT,
  top_recruiters TEXT,
  admission_requirements TEXT,
  acceptance_rate TEXT,
  campus_highlights TEXT,
  rating REAL NOT NULL DEFAULT 4.0,
  related_career_slugs TEXT
);

CREATE TABLE IF NOT EXISTS entrance_exams (
  id SERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  overview TEXT NOT NULL,
  eligibility TEXT NOT NULL,
  syllabus TEXT,
  difficulty TEXT NOT NULL,
  prep_resources TEXT,
  important_dates TEXT,
  past_trends TEXT,
  recommended_strategy TEXT,
  related_career_slugs TEXT
);

CREATE TABLE IF NOT EXISTS resources (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  career_slug TEXT NOT NULL,
  level TEXT NOT NULL,
  cost TEXT NOT NULL,
  url TEXT,
  description TEXT NOT NULL,
  is_trending INTEGER NOT NULL DEFAULT 0,
  is_community_favorite INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS communities (
  id SERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category_slug TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS posts (
  id SERIAL PRIMARY KEY,
  community_slug TEXT NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users(id),
  post_type TEXT NOT NULL DEFAULT 'Discussion',
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  report_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS comments (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL REFERENCES posts(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS newsletter_signups (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- RLS POLICIES
-- ============================================================
-- Since the Express backend handles all auth via JWT middleware,
-- and we're using the anon key, we need RLS policies that allow
-- the anon role to perform all operations. The Express layer
-- ensures only authenticated users can hit protected routes.
-- ============================================================

-- Helper: enable RLS on all tables, then add permissive policies

-- Public read-only tables (seed data)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_full_access" ON categories FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE careers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_full_access" ON careers FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE career_countries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_full_access" ON career_countries FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE trust_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_full_access" ON trust_stats FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE success_stories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_full_access" ON success_stories FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_full_access" ON faqs FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_full_access" ON opportunities FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE colleges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_full_access" ON colleges FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE entrance_exams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_full_access" ON entrance_exams FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_full_access" ON resources FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_full_access" ON communities FOR ALL USING (true) WITH CHECK (true);

-- User data tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_full_access" ON users FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE commitments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_full_access" ON commitments FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE roadmap_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_full_access" ON roadmap_progress FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE saved_careers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_full_access" ON saved_careers FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE user_skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_full_access" ON user_skills FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE mentor_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_full_access" ON mentor_messages FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_full_access" ON applications FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_full_access" ON posts FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_full_access" ON comments FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE newsletter_signups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_full_access" ON newsletter_signups FOR ALL USING (true) WITH CHECK (true);

/**
 * setup-supabase.js
 * Verifies the Supabase schema is correctly set up.
 * Usage: node setup-supabase.js
 *
 * PREREQUISITE: You must first run supabase-schema.sql in the Supabase
 * Dashboard SQL Editor. This script then verifies all tables exist.
 */

const fs = require("fs");
const path = require("path");

// Load env
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

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("❌ SUPABASE_URL and SUPABASE_ANON_KEY must be set in .env");
  process.exit(1);
}

async function verify() {
  const { createClient } = require("@supabase/supabase-js");
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const tables = [
    "categories", "careers", "career_countries", "trust_stats",
    "success_stories", "faqs", "users", "commitments",
    "roadmap_progress", "saved_careers", "user_skills", "mentor_messages",
    "opportunities", "applications", "colleges", "entrance_exams",
    "resources", "communities", "posts", "comments", "newsletter_signups",
  ];

  console.log("🔍 Verifying Supabase schema...\n");
  console.log(`   Project: ${SUPABASE_URL}\n`);

  let found = 0;
  let missing = 0;

  for (const table of tables) {
    const { error } = await supabase.from(table).select("id").limit(1);
    if (error) {
      console.log(`   ❌ ${table} — not found`);
      missing++;
    } else {
      console.log(`   ✅ ${table}`);
      found++;
    }
  }

  console.log(`\n   Found: ${found}/${tables.length} tables`);

  if (missing > 0) {
    console.log(`\n⚠️  ${missing} table(s) are missing. To create them:\n`);
    console.log("   1. Open: https://supabase.com/dashboard");
    console.log("   2. Select your project");
    console.log("   3. Go to 'SQL Editor' (left sidebar)");
    console.log("   4. Click 'New query'");
    console.log("   5. Paste the ENTIRE contents of: backend/supabase-schema.sql");
    console.log("   6. Click 'Run'");
    console.log("\n   Then run this script again: node setup-supabase.js\n");
    process.exit(1);
  } else {
    console.log("\n✅ All 21 tables are present. Supabase schema is ready!");
    process.exit(0);
  }
}

verify().catch((err) => {
  console.error("❌ Unexpected error:", err.message);
  process.exit(1);
});

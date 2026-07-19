const db = require("./db");

function parseJsonSafe(v) {
  try {
    return v ? JSON.parse(v) : [];
  } catch {
    return [];
  }
}

// Builds the full roadmap (all three stages) for a career, marking which
// milestones a given user has completed. Pass userId = null for an
// unauthenticated view (nothing marked complete).
function getRoadmapWithProgress(careerSlug, userId) {
  const career = db
    .prepare(`SELECT slug, title, roadmap_beginner, roadmap_intermediate, roadmap_advanced FROM careers WHERE slug = ?`)
    .get(careerSlug);
  if (!career) return null;

  const stages = [
    { key: "beginner", label: "Beginner", milestones: parseJsonSafe(career.roadmap_beginner) },
    { key: "intermediate", label: "Intermediate", milestones: parseJsonSafe(career.roadmap_intermediate) },
    { key: "advanced", label: "Advanced", milestones: parseJsonSafe(career.roadmap_advanced) },
  ];

  const allMilestones = stages.flatMap((s) => s.milestones);
  if (allMilestones.length === 0) return null;

  let completedIds = new Set();
  if (userId) {
    const rows = db
      .prepare(`SELECT milestone_id FROM roadmap_progress WHERE user_id = ? AND career_slug = ?`)
      .all(userId, careerSlug);
    completedIds = new Set(rows.map((r) => r.milestone_id));
  }

  stages.forEach((s) => {
    s.milestones = s.milestones.map((m) => ({ ...m, completed: completedIds.has(m.id) }));
  });

  const totalCount = allMilestones.length;
  const completedCount = allMilestones.filter((m) => completedIds.has(m.id)).length;
  const percent = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;

  const nextMilestones = stages
    .flatMap((s) => s.milestones.map((m) => ({ ...m, stage: s.label })))
    .filter((m) => !m.completed)
    .slice(0, 3);

  return {
    slug: career.slug,
    title: career.title,
    stages,
    percent,
    completedCount,
    totalCount,
    nextMilestones,
  };
}

module.exports = { getRoadmapWithProgress };

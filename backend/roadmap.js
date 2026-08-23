const { selectOne, selectAll } = require("./db");

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
async function getRoadmapWithProgress(careerSlug, userId) {
  const career = await selectOne("careers", {
    columns: "slug, title, roadmap_beginner, roadmap_intermediate, roadmap_advanced",
    filters: { slug: careerSlug },
  });
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
    const rows = await selectAll("roadmap_progress", {
      columns: "milestone_id",
      filters: { user_id: userId, career_slug: careerSlug },
    });
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

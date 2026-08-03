const db = require("./db");
const { getRoadmapWithProgress } = require("./roadmap");

function parseJsonSafe(v) {
  try {
    return v ? JSON.parse(v) : [];
  } catch {
    return [];
  }
}

const IMPORTANCE_RANK = { Critical: 3, High: 2, Moderate: 1 };

function computeReadiness(careerSlug, userId) {
  const career = db
    .prepare(`SELECT slug, title, skills_technical, skills_soft, skills_industry FROM careers WHERE slug = ?`)
    .get(careerSlug);
  if (!career) return null;

  const allSkills = [
    ...parseJsonSafe(career.skills_technical).map((s) => ({ ...s, group: "Technical" })),
    ...parseJsonSafe(career.skills_soft).map((s) => ({ ...s, group: "Soft" })),
    ...parseJsonSafe(career.skills_industry).map((s) => ({ ...s, group: "Industry" })),
  ];

  const acquiredRows = db
    .prepare(`SELECT skill_name FROM user_skills WHERE user_id = ? AND career_slug = ?`)
    .all(userId, careerSlug);
  const acquiredNames = new Set(acquiredRows.map((r) => r.skill_name));

  const skillsWithStatus = allSkills.map((s) => ({ ...s, acquired: acquiredNames.has(s.name) }));
  const skillsTotal = skillsWithStatus.length;
  const skillsAcquiredCount = skillsWithStatus.filter((s) => s.acquired).length;
  const skillsPercent = skillsTotal ? Math.round((skillsAcquiredCount / skillsTotal) * 100) : 0;

  const roadmap = getRoadmapWithProgress(careerSlug, userId);
  const roadmapPercent = roadmap ? roadmap.percent : 0;

  // Roadmap progress is weighted more heavily — it's the more concrete,
  // step-by-step signal. Skills fill in the rest.
  const hasRoadmap = Boolean(roadmap);
  const hasSkills = skillsTotal > 0;
  let score;
  if (hasRoadmap && hasSkills) score = Math.round(roadmapPercent * 0.6 + skillsPercent * 0.4);
  else if (hasRoadmap) score = roadmapPercent;
  else if (hasSkills) score = skillsPercent;
  else score = 0;

  const strengths = skillsWithStatus.filter((s) => s.acquired).map((s) => s.name);

  const missing = skillsWithStatus
    .filter((s) => !s.acquired)
    .sort((a, b) => (IMPORTANCE_RANK[b.importance] || 0) - (IMPORTANCE_RANK[a.importance] || 0))
    .map((s) => ({ name: s.name, importance: s.importance, group: s.group }));

  const priorityImprovements = missing.filter((s) => s.importance === "Critical").slice(0, 3).map((s) => s.name);

  let recommendedNextStep = "Mark the skills you already have to sharpen this score.";
  let estimatedTimelineWeeks = null;
  if (roadmap && roadmap.nextMilestones.length > 0) {
    const next = roadmap.nextMilestones[0];
    recommendedNextStep = `${next.stage}: ${next.title}`;
    estimatedTimelineWeeks = roadmap.stages
      .flatMap((s) => s.milestones)
      .filter((m) => !m.completed)
      .reduce((sum, m) => sum + (m.weeks || 0), 0);
  } else if (priorityImprovements.length > 0) {
    recommendedNextStep = `Build up ${priorityImprovements[0]} — it's marked critical for this career.`;
  }

  if (priorityImprovements.length === 0 && missing.length > 0) {
    priorityImprovements.push(missing[0].name);
  }

  return {
    slug: career.slug,
    title: career.title,
    score,
    roadmapPercent: hasRoadmap ? roadmapPercent : null,
    skillsPercent: hasSkills ? skillsPercent : null,
    strengths,
    missing,
    priorityImprovements,
    recommendedNextStep,
    estimatedTimelineWeeks,
  };
}

module.exports = { computeReadiness };

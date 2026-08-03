const db = require("./db");
const { getRoadmapWithProgress } = require("./roadmap");
const { computeReadiness } = require("./readiness");

function getMentorContext(userId) {
  const commitment = db.prepare(`SELECT * FROM commitments WHERE user_id = ?`).get(userId);
  if (!commitment) return { commitment: null };

  const career = db.prepare(`SELECT slug, title FROM careers WHERE slug = ?`).get(commitment.career_slug);
  const roadmap = getRoadmapWithProgress(commitment.career_slug, userId);
  const readiness = computeReadiness(commitment.career_slug, userId);

  return { commitment, career, roadmap, readiness };
}

function greetingForNoCommitment(userName) {
  return (
    `Hi ${userName.split(" ")[0]} — you haven't committed to a career yet, so I don't have a plan to guide you through. ` +
    `Take the Career Match Assessment or browse the Explorer, then commit to one from its profile page. Once you do, ` +
    `I'll track your roadmap and skills and give you real next steps instead of general advice.`
  );
}

function generateMentorReply(userId, userName, message) {
  const ctx = getMentorContext(userId);
  const text = (message || "").toLowerCase();

  if (!ctx.commitment) {
    return greetingForNoCommitment(userName);
  }

  const { career, roadmap, readiness } = ctx;
  const next = roadmap?.nextMilestones?.[0];

  const nextStepLine = next
    ? `Your next milestone is **${next.title}** (${next.stage} stage, ~${next.weeks}w).`
    : roadmap
    ? `You've completed every milestone on the ${career.title} roadmap — nice work. Consider revisiting specializations or moving on to real projects and applications.`
    : `There's no written roadmap for ${career.title} yet, so I can't point to a specific milestone.`;

  if (/(stuck|overwhelmed|stressed|behind|give up|frustrat)/.test(text)) {
    return (
      `That's a completely normal place to be partway through a ${career.title} path — it doesn't mean you're off track. ` +
      `You're at ${roadmap ? roadmap.percent : 0}% on the roadmap already. Don't try to catch up all at once: just take the next ` +
      `single step. ${nextStepLine} That's it for now — one milestone at a time.`
    );
  }

  if (/interview/.test(text)) {
    return (
      `For ${career.title} interviews: expect a mix of role-specific questions and behavioral ones. Review the "Required skills" ` +
      `section on your career profile and be ready to speak to concrete examples for anything marked Critical. ` +
      `${readiness?.priorityImprovements?.length ? `Right now, ${readiness.priorityImprovements[0]} is your biggest gap — worth shoring up before interviews start.` : "Your skill coverage looks solid — focus prep time on storytelling around real projects."}`
    );
  }

  if (/(resume|cv\b)/.test(text)) {
    return (
      `For your resume: lead with concrete outcomes, not just responsibilities — numbers if you have them. ` +
      `Given you're ${roadmap ? roadmap.percent : 0}% through the ${career.title} roadmap, make sure any completed projects from your milestones ` +
      `show up as bullet points, not just "completed a course." Employers weigh built things over studied things.`
    );
  }

  if (/portfolio/.test(text)) {
    return (
      `A strong ${career.title} portfolio needs 2–3 pieces that are deep rather than many that are shallow. ` +
      `${nextStepLine} If that milestone produces something shippable, that's your next portfolio entry.`
    );
  }

  if (/(hour|hours|busy|only have|this week|limited time)/.test(text)) {
    return (
      `Given limited time, don't spread thin — pick one thing. ${nextStepLine} Block time for just that, and skip everything else ` +
      `this week. Consistent small steps beat occasional big ones.`
    );
  }

  if (/(complete|completed|finished|done)/.test(text)) {
    return (
      `Good work. ${nextStepLine} Head to your roadmap and check that milestone off if you haven't already — it's what keeps your ` +
      `readiness score (currently ${readiness ? readiness.score : 0}%) accurate.`
    );
  }

  if (/(next|what should i do|what now|what's next)/.test(text)) {
    return `${nextStepLine} Your overall roadmap progress is ${roadmap ? roadmap.percent : 0}%, and your readiness score is ${
      readiness ? readiness.score : 0
    }%.`;
  }

  // Default: a status readout plus a nudge.
  return (
    `Quick status on ${career.title}: ${roadmap ? roadmap.percent : 0}% through the roadmap, ${
      readiness ? readiness.score : 0
    }% readiness score. ${nextStepLine} Ask me about your next step, interview prep, your resume, or your portfolio any time.`
  );
}

module.exports = { generateMentorReply };

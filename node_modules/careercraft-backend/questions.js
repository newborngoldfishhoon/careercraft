// Each question maps to one "dimension". Every option carries a tag; the
// tag format is "dimension:value" (e.g. "interest:technical"). Careers are
// tagged the same way in careers.match_tags, so scoring is just an overlap
// count between the user's selected tags and each career's tags, weighted
// by how much that dimension should matter.

const QUESTIONS = [
  {
    id: "interest",
    dimension: "interest",
    question: "What kind of work energizes you most?",
    options: [
      { label: "Building and coding technical systems", tag: "interest:technical" },
      { label: "Directly helping or caring for people", tag: "interest:people" },
      { label: "Organizing plans and driving decisions", tag: "interest:business" },
      { label: "Designing or creating something visual", tag: "interest:creative" },
      { label: "Digging into numbers and data", tag: "interest:analytical" },
    ],
  },
  {
    id: "work_style",
    dimension: "work_style",
    question: "How do you like to work day to day?",
    options: [
      { label: "Mostly independently, with deep focus time", tag: "work_style:solo" },
      { label: "Constantly with a team", tag: "work_style:team" },
      { label: "A mix of both", tag: "work_style:flexible" },
    ],
  },
  {
    id: "pace",
    dimension: "pace",
    question: "What pace suits you best?",
    options: [
      { label: "Fast-changing — always something new", tag: "pace:fast" },
      { label: "Steady and predictable", tag: "pace:steady" },
    ],
  },
  {
    id: "risk",
    dimension: "risk",
    question: "How do you feel about risk in a career?",
    options: [
      { label: "I like high-risk, high-reward paths", tag: "risk:high" },
      { label: "Somewhere in between", tag: "risk:medium" },
      { label: "I prefer stability and predictability", tag: "risk:low" },
    ],
  },
  {
    id: "priority",
    dimension: "priority",
    question: "What matters most to you in a career?",
    options: [
      { label: "Highest possible pay", tag: "priority:pay" },
      { label: "Meaningful impact on others", tag: "priority:impact" },
      { label: "Work-life balance", tag: "priority:balance" },
    ],
  },
  {
    id: "remote",
    dimension: "remote",
    question: "Where do you want to work?",
    options: [
      { label: "Fully remote", tag: "remote:remote" },
      { label: "In-person / hands-on", tag: "remote:in-person" },
    ],
  },
  {
    id: "people_facing",
    dimension: "people_facing",
    question: "Do you want to work directly with people day to day?",
    options: [
      { label: "Yes, constantly", tag: "people_facing:true" },
      { label: "No, I'd rather work behind the scenes", tag: "people_facing:false" },
    ],
  },
  {
    id: "difficulty",
    dimension: "difficulty",
    question: "How much training are you willing to invest before starting?",
    options: [
      { label: "A lot — an advanced degree or years of study", tag: "difficulty:High" },
      { label: "Some — certifications or a couple of years", tag: "difficulty:Moderate" },
      { label: "As little as possible — I want to start fast", tag: "difficulty:Low" },
    ],
  },
];

// How much each dimension should count toward the match score.
const DIMENSION_WEIGHTS = {
  interest: 3,
  priority: 2,
  people_facing: 2,
  work_style: 1,
  pace: 1,
  risk: 1,
  remote: 1,
  difficulty: 1,
};

// Human-readable reasoning strings, keyed by tag, used to explain a match.
const TAG_REASONS = {
  "interest:technical": "matches your interest in hands-on technical work",
  "interest:people": "fits your interest in directly helping people",
  "interest:business": "aligns with your interest in organizing and driving decisions",
  "interest:creative": "fits your interest in visual, creative work",
  "interest:analytical": "matches your interest in data and analysis",
  "work_style:solo": "suits your preference for independent, focused work",
  "work_style:team": "suits your preference for team-based work",
  "work_style:flexible": "fits your preference for a mix of solo and team work",
  "pace:fast": "matches your preference for a fast-changing environment",
  "pace:steady": "fits your preference for a steady, predictable pace",
  "risk:high": "aligns with your appetite for higher risk, higher reward",
  "risk:medium": "fits your moderate risk tolerance",
  "risk:low": "matches your preference for stability",
  "priority:pay": "tends to offer strong compensation",
  "priority:impact": "offers meaningful day-to-day impact",
  "priority:balance": "tends to support better work-life balance",
  "remote:remote": "offers strong remote flexibility",
  "remote:in-person": "fits your preference for hands-on, in-person work",
  "people_facing:true": "involves working directly with people, as you'd prefer",
  "people_facing:false": "lets you work more behind the scenes, as you'd prefer",
  "difficulty:High": "matches your willingness to invest in deeper training",
  "difficulty:Moderate": "fits a moderate training investment",
  "difficulty:Low": "lets you get started with minimal upfront training",
};

module.exports = { QUESTIONS, DIMENSION_WEIGHTS, TAG_REASONS };

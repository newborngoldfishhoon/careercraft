const db = require("./db");
const bcrypt = require("bcryptjs");

const categories = [
  ["Technology", "technology", "Software, data, cloud, and the systems that run modern life.", 412, "cpu"],
  ["Healthcare", "healthcare", "Medicine, nursing, therapy, and the science of caring for people.", 268, "pulse"],
  ["Business", "business", "Strategy, operations, and the work of running organizations.", 331, "briefcase"],
  ["Finance", "finance", "Markets, investing, banking, and managing money at scale.", 194, "chart"],
  ["Education", "education", "Teaching, curriculum design, and shaping how people learn.", 152, "book"],
  ["Law", "law", "Courts, contracts, policy, and the rules that govern society.", 118, "scale"],
  ["Government", "government", "Public service, policy-making, and civic institutions.", 97, "landmark"],
  ["Creative Arts", "creative-arts", "Design, film, music, writing, and visual storytelling.", 176, "palette"],
  ["Science", "science", "Research, discovery, and the pursuit of how things work.", 203, "flask"],
  ["Sports", "sports", "Athletics, coaching, sports medicine, and performance science.", 84, "trophy"],
  ["Entrepreneurship", "entrepreneurship", "Founding, building, and scaling new ventures.", 61, "rocket"],
];

const j = (v) => JSON.stringify(v);

// Fully-detailed careers — power the Career Detail page.
const detailedCareers = [
  {
    slug: "ai-engineer",
    title: "AI Engineer",
    category_slug: "technology",
    summary: "Designs and builds systems that learn from data.",
    avg_salary: "$128k avg (US)",
    demand_level: "Very High",
    growth_potential: "Expanding rapidly",
    difficulty_level: "High",
    remote_potential: "High",
    education_requirement: "Bachelor's (often; self-taught paths exist)",
    rating: 4.6,
    is_featured: 1,
    is_trending: 1,
    about_what: "An AI Engineer builds the systems that let software learn patterns from data instead of following fixed rules — from recommendation engines to language models.",
    about_why: "As data volume and compute have grown, more products rely on learned behavior rather than hand-coded logic, and someone has to design, train, and ship those systems responsibly.",
    about_suitable: "People who enjoy math, experimentation, and iterating on something that doesn't work the first time.",
    about_not_suitable: "Those who want fully predictable, deterministic outcomes every time — model behavior is probabilistic by nature.",
    about_misconceptions: "It isn't mostly about inventing new algorithms; most day-to-day work is data pipelines, evaluation, and integration.",
    day_responsibilities: j([
      "Clean and prepare training data",
      "Train, fine-tune, and evaluate models",
      "Build pipelines to serve models in production",
      "Monitor model performance and drift",
    ]),
    day_schedule: "Typically 9–6, with heavier blocks around training runs and release windows.",
    day_challenges: j(["Debugging silent data quality issues", "Balancing model accuracy against latency and cost", "Explaining probabilistic results to non-technical stakeholders"]),
    day_tools: j(["Python", "PyTorch or TensorFlow", "Jupyter", "Cloud ML platforms (SageMaker, Vertex AI)"]),
    skills_technical: j([
      { name: "Python", description: "The primary language for ML tooling and pipelines.", importance: "Critical", difficulty: "Moderate" },
      { name: "Linear algebra & statistics", description: "The math underlying most model architectures.", importance: "Critical", difficulty: "High" },
      { name: "Model evaluation", description: "Choosing and interpreting the right metrics.", importance: "High", difficulty: "Moderate" },
    ]),
    skills_soft: j([
      { name: "Structured experimentation", description: "Designing tests that isolate what actually changed.", importance: "High", difficulty: "Moderate" },
      { name: "Written communication", description: "Explaining model limits clearly to other teams.", importance: "Moderate", difficulty: "Moderate" },
    ]),
    skills_industry: j([
      { name: "MLOps", description: "Deploying and monitoring models reliably in production.", importance: "High", difficulty: "High" },
    ]),
    education_pathways: j([
      { name: "Traditional Degree", description: "CS or a related degree with an ML specialization." },
      { name: "Bootcamp Path", description: "Intensive 3–6 month applied ML programs." },
      { name: "Self-Taught Path", description: "Structured online courses plus a public project portfolio." },
    ]),
    certifications: j([
      { level: "Beginner", name: "DeepLearning.AI ML Specialization", cost: "$49/mo", benefit: "Strong foundation in core concepts" },
      { level: "Advanced", name: "AWS Certified Machine Learning – Specialty", cost: "$300", benefit: "Signals production ML experience" },
    ]),
    specializations: j([
      { name: "NLP / LLMs", description: "Language understanding and generation systems." },
      { name: "Computer Vision", description: "Image and video understanding systems." },
      { name: "MLOps", description: "Infrastructure for training and serving models at scale." },
    ]),
    match_tags: j(["interest:technical", "interest:analytical", "work_style:flexible", "pace:fast", "risk:high", "priority:pay", "priority:impact", "remote:remote", "people_facing:false", "difficulty:High"]),
    roadmap_beginner: j([
      { id: "ai-b1", title: "Python fundamentals", description: "Syntax, data structures, functions, and basic scripting.", resources: [{ name: "Python.org tutorial", type: "Docs" }, { name: "CS50P", type: "Course" }], weeks: 4 },
      { id: "ai-b2", title: "Math foundations", description: "Linear algebra, probability, and statistics for ML.", resources: [{ name: "Khan Academy Linear Algebra", type: "Course" }], weeks: 5 },
      { id: "ai-b3", title: "First ML models", description: "Train basic regression and classification models with scikit-learn.", resources: [{ name: "scikit-learn docs", type: "Docs" }], weeks: 3 },
      { id: "ai-b4", title: "Mini project", description: "Build and share a small end-to-end ML project.", resources: [{ name: "Kaggle Getting Started", type: "Practice" }], weeks: 2 },
    ]),
    roadmap_intermediate: j([
      { id: "ai-i1", title: "Deep learning fundamentals", description: "Neural networks, backpropagation, and training loops.", resources: [{ name: "DeepLearning.AI Specialization", type: "Course" }], weeks: 6 },
      { id: "ai-i2", title: "Framework fluency", description: "Build models in PyTorch or TensorFlow beyond tutorials.", resources: [{ name: "PyTorch official tutorials", type: "Docs" }], weeks: 5 },
      { id: "ai-i3", title: "Portfolio project", description: "Ship a project solving a real problem, documented publicly.", resources: [{ name: "GitHub Pages", type: "Tool" }], weeks: 4 },
      { id: "ai-i4", title: "Networking & internship prep", description: "Resume, portfolio review, and applying to internships.", resources: [{ name: "LinkedIn", type: "Community" }], weeks: 3 },
    ]),
    roadmap_advanced: j([
      { id: "ai-a1", title: "Choose a specialization", description: "Go deep on NLP, computer vision, or MLOps.", resources: [], weeks: 6 },
      { id: "ai-a2", title: "Production ML systems", description: "Model serving, monitoring, and deployment at scale.", resources: [{ name: "AWS ML Specialty", type: "Certification" }], weeks: 8 },
      { id: "ai-a3", title: "Interview preparation", description: "ML system design and coding interview practice.", resources: [{ name: "Practice platforms", type: "Practice" }], weeks: 4 },
      { id: "ai-a4", title: "Apply and land the role", description: "Targeted applications with a tailored portfolio.", resources: [], weeks: 4 },
    ]),
    countries: [
      ["United States", "$128,000", "$95,000", "$185,000", "Very High", "High", "San Francisco, Seattle, New York", "Google, Meta, OpenAI, Anthropic", "H-1B common; employer sponsorship standard"],
      ["India", "₹18,00,000", "₹9,00,000", "₹35,00,000", "Very High", "Very High", "Bengaluru, Hyderabad, Pune", "TCS, Infosys, Google India", "Not applicable domestically"],
      ["United Kingdom", "£65,000", "£42,000", "£95,000", "High", "High", "London, Cambridge", "DeepMind, Revolut, ARM", "Skilled Worker visa route"],
    ],
  },
  {
    slug: "ux-designer",
    title: "UX Designer",
    category_slug: "technology",
    summary: "Shapes how people experience digital products.",
    avg_salary: "$96k avg (US)",
    demand_level: "High",
    growth_potential: "Steady growth",
    difficulty_level: "Moderate",
    remote_potential: "High",
    education_requirement: "Portfolio matters more than a specific degree",
    rating: 4.4,
    is_featured: 1,
    is_trending: 0,
    about_what: "A UX Designer researches how people use a product, then designs the flows, screens, and interactions that make it usable and pleasant.",
    about_why: "Products succeed or fail on whether people can actually use them — UX work is what connects what a business builds to what a person can navigate.",
    about_suitable: "People who like a mix of empathy-driven research and precise visual craft.",
    about_not_suitable: "Those who want to work in pure isolation — the role is inherently collaborative with engineers and product managers.",
    about_misconceptions: "It's not just \"making things pretty\" — most of the job is structuring flows and validating decisions with real users.",
    day_responsibilities: j(["Run user interviews and usability tests", "Wireframe and prototype flows", "Maintain a design system", "Collaborate with engineers on implementation"]),
    day_schedule: "Flexible, with recurring research and critique sessions.",
    day_challenges: j(["Balancing user needs against business constraints", "Getting research time on tight timelines"]),
    day_tools: j(["Figma", "Maze or UserTesting", "Notion", "Design systems"]),
    skills_technical: j([
      { name: "Prototyping", description: "Building interactive mockups for testing.", importance: "Critical", difficulty: "Moderate" },
      { name: "Information architecture", description: "Structuring content and navigation logically.", importance: "High", difficulty: "Moderate" },
    ]),
    skills_soft: j([
      { name: "User empathy", description: "Understanding needs different from your own.", importance: "Critical", difficulty: "Moderate" },
      { name: "Presenting decisions", description: "Defending design choices with evidence.", importance: "High", difficulty: "Moderate" },
    ]),
    skills_industry: j([{ name: "Design systems", description: "Building reusable, consistent component libraries.", importance: "High", difficulty: "Moderate" }]),
    education_pathways: j([
      { name: "Bootcamp Path", description: "3–6 month UX-focused intensives." },
      { name: "Self-Taught Path", description: "Portfolio projects plus case studies." },
      { name: "Traditional Degree", description: "HCI, design, or psychology degrees." },
    ]),
    certifications: j([{ level: "Beginner", name: "Google UX Design Certificate", cost: "$49/mo", benefit: "Recognized entry credential with a portfolio built in" }]),
    specializations: j([
      { name: "Product Design", description: "End-to-end ownership of a product's experience." },
      { name: "UX Research", description: "Focused on studies and evidence over visual craft." },
    ]),
    match_tags: j(["interest:creative", "interest:people", "work_style:team", "pace:fast", "risk:medium", "priority:impact", "priority:balance", "remote:remote", "people_facing:true", "difficulty:Moderate"]),
    roadmap_beginner: j([
      { id: "ux-b1", title: "Design fundamentals", description: "Layout, color, typography, and visual hierarchy.", resources: [{ name: "Refactoring UI", type: "Book" }], weeks: 3 },
      { id: "ux-b2", title: "Learn Figma", description: "Wireframing and prototyping tools of the trade.", resources: [{ name: "Figma official tutorials", type: "Course" }], weeks: 3 },
      { id: "ux-b3", title: "UX research basics", description: "Interviewing users and running simple usability tests.", resources: [{ name: "Google UX Design Certificate", type: "Course" }], weeks: 4 },
      { id: "ux-b4", title: "First case study", description: "Redesign an existing app and document your process.", resources: [], weeks: 3 },
    ]),
    roadmap_intermediate: j([
      { id: "ux-i1", title: "End-to-end product design", description: "Take a project from research to a shippable prototype.", resources: [], weeks: 6 },
      { id: "ux-i2", title: "Design systems", description: "Build and maintain a reusable component library.", resources: [], weeks: 4 },
      { id: "ux-i3", title: "Portfolio site", description: "Publish 2–3 strong case studies publicly.", resources: [{ name: "Personal portfolio site", type: "Tool" }], weeks: 3 },
      { id: "ux-i4", title: "Internship / junior role prep", description: "Mock portfolio reviews and interview practice.", resources: [], weeks: 3 },
    ]),
    roadmap_advanced: j([
      { id: "ux-a1", title: "Choose a specialization", description: "Product design or dedicated UX research.", resources: [], weeks: 5 },
      { id: "ux-a2", title: "Lead a real product area", description: "Own a feature end to end with cross-functional partners.", resources: [], weeks: 8 },
      { id: "ux-a3", title: "Mentorship & critique", description: "Give and receive structured design critique regularly.", resources: [], weeks: 4 },
      { id: "ux-a4", title: "Senior-level applications", description: "Target roles with a portfolio showing measurable impact.", resources: [], weeks: 4 },
    ]),
    countries: [
      ["United States", "$96,000", "$68,000", "$140,000", "High", "High", "San Francisco, Austin, New York", "Apple, Airbnb, Figma", "H-1B common"],
      ["Germany", "€58,000", "€42,000", "€80,000", "Moderate", "Moderate", "Berlin, Munich", "SAP, Zalando", "EU Blue Card route"],
    ],
  },
  {
    slug: "registered-nurse",
    title: "Registered Nurse",
    category_slug: "healthcare",
    summary: "Delivers direct patient care across settings.",
    avg_salary: "$82k avg (US)",
    demand_level: "Very High",
    growth_potential: "Expanding rapidly",
    difficulty_level: "High",
    remote_potential: "Low",
    education_requirement: "Nursing degree + licensure (NCLEX-RN)",
    rating: 4.3,
    is_featured: 0,
    is_trending: 1,
    about_what: "A Registered Nurse provides direct patient care — administering treatment, monitoring conditions, and coordinating with doctors and specialists.",
    about_why: "Healthcare systems depend on nurses for the majority of hands-on patient care and are structurally short-staffed almost everywhere.",
    about_suitable: "People who stay calm under pressure and want work with immediate, tangible impact on others.",
    about_not_suitable: "Those who need a strictly predictable schedule — shift work, nights, and weekends are common.",
    about_misconceptions: "Nursing isn't just following doctors' orders — RNs make independent clinical judgment calls constantly.",
    day_responsibilities: j(["Monitor patient vitals and conditions", "Administer medications and treatments", "Coordinate with physicians and specialists", "Document care accurately"]),
    day_schedule: "Often 12-hour shifts, including nights, weekends, and holidays.",
    day_challenges: j(["Physically and emotionally demanding shifts", "Staffing shortages increasing workload"]),
    day_tools: j(["Electronic health record systems", "Medical monitoring equipment"]),
    skills_technical: j([{ name: "Clinical assessment", description: "Reading and interpreting patient conditions.", importance: "Critical", difficulty: "High" }]),
    skills_soft: j([
      { name: "Composure under pressure", description: "Making clear decisions in emergencies.", importance: "Critical", difficulty: "High" },
      { name: "Communication", description: "Clearly relaying information to patients and doctors.", importance: "Critical", difficulty: "Moderate" },
    ]),
    skills_industry: j([{ name: "Electronic health records", description: "Accurate, compliant patient documentation.", importance: "High", difficulty: "Moderate" }]),
    education_pathways: j([
      { name: "Traditional Degree", description: "BSN (Bachelor of Science in Nursing), 4 years." },
      { name: "Diploma", description: "ADN (Associate Degree in Nursing), 2–3 years." },
    ]),
    certifications: j([{ level: "Required", name: "NCLEX-RN licensure", cost: "$200 exam fee", benefit: "Legally required to practice as an RN" }]),
    specializations: j([
      { name: "ICU / Critical Care", description: "High-acuity patient monitoring." },
      { name: "Pediatrics", description: "Care for infants, children, and adolescents." },
    ]),
    match_tags: j(["interest:people", "work_style:team", "pace:fast", "risk:low", "priority:impact", "remote:in-person", "people_facing:true", "difficulty:High"]),
    roadmap_beginner: j([
      { id: "rn-b1", title: "Prerequisite coursework", description: "Anatomy, physiology, and basic chemistry.", resources: [], weeks: 12 },
      { id: "rn-b2", title: "Nursing school admission", description: "Apply and enroll in an accredited ADN or BSN program.", resources: [], weeks: 8 },
      { id: "rn-b3", title: "Foundational clinical skills", description: "Vitals, basic procedures, and patient communication.", resources: [], weeks: 16 },
    ]),
    roadmap_intermediate: j([
      { id: "rn-i1", title: "Clinical rotations", description: "Hands-on rotations across specialties (med-surg, pediatrics, etc).", resources: [], weeks: 40 },
      { id: "rn-i2", title: "NCLEX-RN preparation", description: "Structured review and practice exams.", resources: [{ name: "NCLEX prep course", type: "Course" }], weeks: 8 },
      { id: "rn-i3", title: "Licensure", description: "Pass the NCLEX-RN and apply for state licensure.", resources: [], weeks: 4 },
    ]),
    roadmap_advanced: j([
      { id: "rn-a1", title: "First RN role", description: "Start in a general unit to build broad clinical experience.", resources: [], weeks: 24 },
      { id: "rn-a2", title: "Choose a specialization", description: "ICU, pediatrics, or another focus area.", resources: [], weeks: 24 },
      { id: "rn-a3", title: "Specialty certification", description: "Pursue a specialty credential (e.g. CCRN for critical care).", resources: [], weeks: 12 },
    ]),
    countries: [
      ["United States", "$82,000", "$62,000", "$115,000", "Very High", "Moderate", "Multiple metro areas nationwide", "HCA Healthcare, Kaiser Permanente", "Employer-sponsored visas available for shortage roles"],
      ["Canada", "CA$78,000", "CA$58,000", "CA$100,000", "Very High", "Low", "Toronto, Vancouver", "Provincial health authorities", "Express Entry pathways for nurses"],
    ],
  },
  {
    slug: "product-manager",
    title: "Product Manager",
    category_slug: "business",
    summary: "Directs what gets built and why.",
    avg_salary: "$118k avg (US)",
    demand_level: "High",
    growth_potential: "Steady growth",
    difficulty_level: "Moderate",
    remote_potential: "High",
    education_requirement: "Any degree; experience matters more",
    rating: 4.3,
    is_featured: 1,
    is_trending: 1,
    about_what: "A Product Manager decides what a team builds next and why, translating business and user needs into a concrete plan for engineers and designers.",
    about_why: "As products grow complex, someone needs to prioritize ruthlessly and keep every team aligned on the same goal.",
    about_suitable: "People who like connecting dots across business, design, and engineering without owning any one craft outright.",
    about_not_suitable: "Those who want deep, single-discipline technical mastery rather than broad coordination.",
    about_misconceptions: "PMs don't manage people — they influence direction without direct authority over the team.",
    day_responsibilities: j(["Prioritize the roadmap", "Write specs and requirements", "Run stakeholder syncs", "Analyze usage data to guide decisions"]),
    day_schedule: "Meeting-heavy; focus time is often blocked deliberately.",
    day_challenges: j(["Saying no to reasonable requests", "Aligning stakeholders with competing priorities"]),
    day_tools: j(["Jira or Linear", "Amplitude or Mixpanel", "Figma (for review)", "Notion"]),
    skills_technical: j([{ name: "Data analysis", description: "Reading usage data to inform prioritization.", importance: "High", difficulty: "Moderate" }]),
    skills_soft: j([
      { name: "Prioritization", description: "Choosing what matters most with limited resources.", importance: "Critical", difficulty: "High" },
      { name: "Stakeholder communication", description: "Aligning different teams around one plan.", importance: "Critical", difficulty: "Moderate" },
    ]),
    skills_industry: j([{ name: "Roadmapping", description: "Sequencing work against business goals.", importance: "High", difficulty: "Moderate" }]),
    education_pathways: j([
      { name: "Traditional Degree", description: "Any bachelor's degree — business or CS common but not required." },
      { name: "Internal Transfer", description: "Moving into PM from engineering, design, or support roles." },
    ]),
    certifications: j([{ level: "Beginner", name: "Product School PM Certificate", cost: "$4,000+", benefit: "Structured framework and network for career switchers" }]),
    specializations: j([
      { name: "Growth PM", description: "Focused on acquisition and retention metrics." },
      { name: "Platform PM", description: "Focused on internal tools and infrastructure." },
    ]),
    match_tags: j(["interest:business", "interest:analytical", "work_style:team", "pace:fast", "risk:medium", "priority:pay", "priority:impact", "remote:remote", "people_facing:true", "difficulty:Moderate"]),
    roadmap_beginner: j([
      { id: "pm-b1", title: "Product fundamentals", description: "Product lifecycle, discovery vs delivery, and core frameworks.", resources: [{ name: "Product School basics", type: "Course" }], weeks: 3 },
      { id: "pm-b2", title: "Analytics literacy", description: "Reading dashboards and basic SQL for product questions.", resources: [], weeks: 4 },
      { id: "pm-b3", title: "Write your first spec", description: "Practice writing a PRD for a hypothetical feature.", resources: [], weeks: 2 },
    ]),
    roadmap_intermediate: j([
      { id: "pm-i1", title: "Cross-functional experience", description: "Work closely with an engineering and design team on a real feature.", resources: [], weeks: 8 },
      { id: "pm-i2", title: "Prioritization frameworks", description: "RICE, Kano, and other frameworks applied to a real backlog.", resources: [], weeks: 4 },
      { id: "pm-i3", title: "Case study portfolio", description: "Document 1–2 product decisions with reasoning and outcomes.", resources: [], weeks: 3 },
      { id: "pm-i4", title: "APM / associate PM roles", description: "Target associate or rotational PM programs.", resources: [], weeks: 4 },
    ]),
    roadmap_advanced: j([
      { id: "pm-a1", title: "Choose a focus", description: "Growth, platform, or a specific product line.", resources: [], weeks: 6 },
      { id: "pm-a2", title: "Own a roadmap end to end", description: "Full ownership of prioritization and delivery for an area.", resources: [], weeks: 12 },
      { id: "pm-a3", title: "Stakeholder leadership", description: "Align execs and cross-functional leads around a strategy.", resources: [], weeks: 8 },
      { id: "pm-a4", title: "Senior PM applications", description: "Target senior roles backed by measurable product outcomes.", resources: [], weeks: 4 },
    ]),
    countries: [
      ["United States", "$118,000", "$85,000", "$170,000", "High", "High", "San Francisco, New York, Seattle", "Google, Amazon, Stripe", "H-1B common"],
      ["Singapore", "S$110,000", "S$75,000", "S$160,000", "High", "High", "Singapore", "Grab, Sea Group, ByteDance", "Employment Pass route"],
    ],
  },
];

// Lightweight careers — appear in the Explorer grid, minimal detail data.
const basicCareers = [
  { slug: "data-analyst", title: "Data Analyst", category_slug: "technology", summary: "Turns raw data into decisions.", avg_salary: "$78k avg (US)", demand_level: "High", growth_potential: "Steady growth", difficulty_level: "Moderate", remote_potential: "High", is_featured: 1, is_trending: 0, match_tags: j(["interest:analytical", "work_style:flexible", "pace:steady", "risk:low", "priority:balance", "remote:remote", "people_facing:false", "difficulty:Moderate"]) },
  { slug: "financial-analyst", title: "Financial Analyst", category_slug: "finance", summary: "Evaluates investments and business performance.", avg_salary: "$91k avg (US)", demand_level: "Moderate", growth_potential: "Steady growth", difficulty_level: "Moderate", remote_potential: "Moderate", is_featured: 0, is_trending: 0, match_tags: j(["interest:analytical", "interest:business", "work_style:team", "pace:steady", "risk:low", "priority:pay", "remote:in-person", "people_facing:false", "difficulty:Moderate"]) },
  { slug: "cybersecurity-analyst", title: "Cybersecurity Analyst", category_slug: "technology", summary: "Protects systems from digital threats.", avg_salary: "$104k avg (US)", demand_level: "Very High", growth_potential: "Expanding rapidly", difficulty_level: "High", remote_potential: "High", is_featured: 1, is_trending: 1, match_tags: j(["interest:technical", "interest:analytical", "work_style:flexible", "pace:fast", "risk:medium", "priority:pay", "priority:impact", "remote:remote", "people_facing:false", "difficulty:High"]) },
  { slug: "mechanical-engineer", title: "Mechanical Engineer", category_slug: "technology", summary: "Designs physical systems and machines.", avg_salary: "$91k avg (US)", demand_level: "Moderate", growth_potential: "Stable", difficulty_level: "Moderate", remote_potential: "Low", is_featured: 0, is_trending: 0, match_tags: j(["interest:technical", "work_style:team", "pace:steady", "risk:low", "priority:balance", "remote:in-person", "people_facing:false", "difficulty:Moderate"]) },
];

const trustStats = [
  ["Careers Mapped", "3,400+", 1],
  ["Career Categories", "24", 2],
  ["Learning Resources", "58,000+", 3],
  ["Users Who Found Direction", "210,000+", 4],
];

const successStories = [
  ["From classroom to career", "School Student → Dream College", "I had no idea what I wanted until I ran the assessment. Two years later I'm studying exactly what fits me.", 1],
  ["A second start, on purpose", "Career Switcher → New Industry", "Fourteen years in accounting, then six months of focused learning. I'm a product manager now.", 2],
  ["The internship that stuck", "Student → Internship → Full-Time Role", "The roadmap told me exactly what to build. The projects got me the interview.", 3],
];

const faqs = [
  ["Which career is best for me?", "There's no single best career — only the one that fits your interests, strengths, and the life you want. The Career Match Assessment compares your answers against real career data to suggest strong fits, with the reasoning shown alongside each one."],
  ["How do I change careers?", "Start with the Career Transition Engine: it compares your current skills against a target career, flags what transfers directly, and builds a learning plan for the gap."],
  ["Which skills are in demand?", "Demand varies by career and country. Every career page lists in-demand technical, soft, and industry skills, updated alongside real job market signals."],
  ["How long does it take to become job-ready?", "It depends on your starting point and target role. Your personal Readiness Score gives a live estimate based on your skills, projects, and progress so far."],
  ["Which country is best for my chosen career?", "Every career page includes country-by-country breakdowns: salary bands, demand, visa notes, and top employers, so you can compare before you commit."],
];

const insertCategory = db.prepare(
  `INSERT OR IGNORE INTO categories (name, slug, description, career_count, icon, sort_order) VALUES (?, ?, ?, ?, ?, ?)`
);
categories.forEach((c, i) => insertCategory.run(c[0], c[1], c[2], c[3], c[4], i + 1));

const insertDetailedCareer = db.prepare(`
  INSERT INTO careers (
    slug, title, category_slug, summary, avg_salary, demand_level, growth_potential,
    difficulty_level, remote_potential, education_requirement, rating, is_featured, is_trending,
    about_what, about_why, about_suitable, about_not_suitable, about_misconceptions,
    day_responsibilities, day_schedule, day_challenges, day_tools,
    skills_technical, skills_soft, skills_industry,
    education_pathways, certifications, specializations, match_tags,
    roadmap_beginner, roadmap_intermediate, roadmap_advanced
  ) VALUES (
    @slug, @title, @category_slug, @summary, @avg_salary, @demand_level, @growth_potential,
    @difficulty_level, @remote_potential, @education_requirement, @rating, @is_featured, @is_trending,
    @about_what, @about_why, @about_suitable, @about_not_suitable, @about_misconceptions,
    @day_responsibilities, @day_schedule, @day_challenges, @day_tools,
    @skills_technical, @skills_soft, @skills_industry,
    @education_pathways, @certifications, @specializations, @match_tags,
    @roadmap_beginner, @roadmap_intermediate, @roadmap_advanced
  )
`);

const insertBasicCareer = db.prepare(`
  INSERT INTO careers (slug, title, category_slug, summary, avg_salary, demand_level, growth_potential, difficulty_level, remote_potential, is_featured, is_trending, match_tags)
  VALUES (@slug, @title, @category_slug, @summary, @avg_salary, @demand_level, @growth_potential, @difficulty_level, @remote_potential, @is_featured, @is_trending, @match_tags)
`);

const insertCountry = db.prepare(`
  INSERT INTO career_countries (career_id, country, avg_salary, entry_salary, senior_salary, demand_level, competition_level, top_cities, top_employers, visa_info)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const careerCount = db.prepare(`SELECT COUNT(*) AS n FROM careers`).get().n;
if (careerCount === 0) {
  detailedCareers.forEach((c) => {
    const { countries, ...rest } = c;
    const info = insertDetailedCareer.run(rest);
    countries.forEach((row) => insertCountry.run(info.lastInsertRowid, ...row));
  });
  basicCareers.forEach((c) => insertBasicCareer.run(c));
}

const insertStat = db.prepare(`INSERT INTO trust_stats (label, value, sort_order) VALUES (?, ?, ?)`);
const statCount = db.prepare(`SELECT COUNT(*) AS n FROM trust_stats`).get().n;
if (statCount === 0) trustStats.forEach((s) => insertStat.run(s[0], s[1], s[2]));

const insertStory = db.prepare(`INSERT INTO success_stories (headline, path, quote, sort_order) VALUES (?, ?, ?, ?)`);
const storyCount = db.prepare(`SELECT COUNT(*) AS n FROM success_stories`).get().n;
if (storyCount === 0) successStories.forEach((s) => insertStory.run(...s));

const insertFaq = db.prepare(`INSERT INTO faqs (question, answer, sort_order) VALUES (?, ?, ?)`);
const faqCount = db.prepare(`SELECT COUNT(*) AS n FROM faqs`).get().n;
if (faqCount === 0) faqs.forEach((f, i) => insertFaq.run(f[0], f[1], i + 1));

const opportunities = [
  // AI Engineer
  ["AI Residency Program", "Fellowship", "ai-engineer", "Anthropic", "San Francisco, CA", 0, "A structured 6-month residency for engineers moving into applied ML research.", "https://www.anthropic.com/careers", "2026-09-15", 40],
  ["ML Summer Internship", "Internship", "ai-engineer", "Google", "Mountain View, CA", 0, "Summer internship building and evaluating ML models on real product data.", "https://careers.google.com", "2026-11-01", 15],
  ["Kaggle Getting Started Competition", "Competition", "ai-engineer", "Kaggle", "Remote", 1, "A beginner-friendly competition to practice end-to-end model building.", "https://kaggle.com/competitions", null, 0],
  ["AWS ML Specialty Certification", "Certification", "ai-engineer", "Amazon Web Services", "Remote", 1, "Industry-recognized certification validating production ML skills.", "https://aws.amazon.com/certification", null, 45],
  // UX Designer
  ["Product Design Internship", "Internship", "ux-designer", "Figma", "San Francisco, CA", 1, "Summer internship shipping real product design work with a mentor.", "https://figma.com/careers", "2026-10-20", 15],
  ["UX Portfolio Bootcamp", "Bootcamp", "ux-designer", "Springboard", "Remote", 1, "A 3-month bootcamp focused on building a hire-ready UX portfolio.", "https://springboard.com", null, 0],
  ["Design Hackathon: Accessibility", "Hackathon", "ux-designer", "AIGA", "Austin, TX", 0, "A weekend hackathon designing accessible interfaces for real nonprofits.", "https://aiga.org", "2026-08-22", 5],
  ["Google UX Design Certificate", "Certification", "ux-designer", "Google", "Remote", 1, "Entry-level certification with a built-in portfolio.", "https://grow.google/certificates/ux-design", null, 0],
  // Registered Nurse
  ["New Grad RN Residency", "Job", "registered-nurse", "Kaiser Permanente", "Oakland, CA", 0, "A structured first-year program for newly licensed RNs.", "https://kaiserpermanentejobs.org", "2026-09-01", 55],
  ["Nursing Student Volunteer Program", "Volunteer", "registered-nurse", "Red Cross", "Multiple locations", 0, "Hands-on clinical volunteer hours for nursing students.", "https://redcross.org/volunteer", null, 0],
  ["NCLEX-RN Scholarship", "Scholarship", "registered-nurse", "American Nurses Foundation", "Remote", 1, "Need-based scholarship covering NCLEX exam and prep costs.", "https://nursingworld.org", "2026-08-30", 0],
  // Product Manager
  ["Associate Product Manager Program", "Job", "product-manager", "Stripe", "San Francisco, CA", 0, "A rotational APM program for early-career product managers.", "https://stripe.com/jobs", "2026-10-10", 50],
  ["Product Management Fellowship", "Fellowship", "product-manager", "Product School", "Remote", 1, "A part-time fellowship pairing fellows with practicing PM mentors.", "https://productschool.com", null, 20],
  ["Case Study Competition: New Feature Launch", "Competition", "product-manager", "Product School", "Remote", 1, "Write and present a product strategy case study, judged by working PMs.", "https://productschool.com/competition", "2026-09-05", 10],
  // Data Analyst
  ["Data Analytics Internship", "Internship", "data-analyst", "Spotify", "New York, NY", 1, "Summer internship analyzing product and listener behavior data.", "https://spotifyjobs.com", "2026-10-15", 15],
  ["SQL & Data Bootcamp", "Bootcamp", "data-analyst", "DataCamp", "Remote", 1, "An 8-week intensive covering SQL, dashboards, and statistics.", "https://datacamp.com", null, 0],
  // Cybersecurity Analyst
  ["Cybersecurity Apprenticeship", "Apprenticeship", "cybersecurity-analyst", "CrowdStrike", "Austin, TX", 0, "A paid apprenticeship pairing entry-level analysts with senior mentors.", "https://crowdstrike.com/careers", "2026-09-20", 25],
  ["Capture The Flag: Beginner Track", "Hackathon", "cybersecurity-analyst", "picoCTF", "Remote", 1, "A beginner-friendly security competition covering core concepts.", "https://picoctf.org", "2026-08-15", 0],
  // Financial Analyst
  ["Investment Banking Summer Analyst", "Internship", "financial-analyst", "Goldman Sachs", "New York, NY", 0, "A structured summer program for aspiring financial analysts.", "https://goldmansachs.com/careers", "2026-11-15", 20],
  // Mechanical Engineer
  ["Robotics Research Program", "Research Program", "mechanical-engineer", "MIT Lincoln Laboratory", "Cambridge, MA", 0, "A summer research program for undergraduate mechanical engineers.", "https://ll.mit.edu", "2026-10-01", 20],
];

const insertOpportunity = db.prepare(`
  INSERT INTO opportunities (title, type, career_slug, organization, location, remote, description, url, deadline, min_readiness)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
const opportunityCount = db.prepare(`SELECT COUNT(*) AS n FROM opportunities`).get().n;
if (opportunityCount === 0) opportunities.forEach((o) => insertOpportunity.run(...o));

const colleges = [
  {
    slug: "iit-bombay",
    name: "Indian Institute of Technology Bombay",
    type: "Government",
    location: "Mumbai, Maharashtra",
    country: "India",
    overview: "One of India's premier engineering institutes, known for rigorous academics and strong industry ties.",
    programs: j(["Computer Science & Engineering", "Electrical Engineering", "Mechanical Engineering", "Design"]),
    fees: "₹2.5L/year (domestic)",
    scholarships: "Merit-cum-means scholarships; government fee waivers for reserved categories.",
    placements_percent: 95,
    avg_package: "₹21L/year",
    top_recruiters: j(["Google", "Microsoft", "Goldman Sachs", "Qualcomm"]),
    admission_requirements: "JEE Advanced rank within institute cutoff.",
    acceptance_rate: "~1%",
    campus_highlights: j(["Powai lake-side campus", "Strong startup incubation cell", "150+ student clubs"]),
    rating: 4.8,
    related_career_slugs: j(["ai-engineer", "mechanical-engineer", "cybersecurity-analyst"]),
  },
  {
    slug: "manipal-institute-of-technology",
    name: "Manipal Institute of Technology",
    type: "Private",
    location: "Manipal, Karnataka",
    country: "India",
    overview: "A large private engineering college known for a broad program catalog and an active campus life.",
    programs: j(["Computer Science", "Information Technology", "Mechanical Engineering", "Biomedical Engineering"]),
    fees: "₹4.5L/year",
    scholarships: "Merit scholarships up to 100% tuition for top entrance scorers.",
    placements_percent: 88,
    avg_package: "₹9L/year",
    top_recruiters: j(["Amazon", "TCS", "Infosys", "Cisco"]),
    admission_requirements: "MET (Manipal Entrance Test) score or JEE Main percentile.",
    acceptance_rate: "~35%",
    campus_highlights: j(["Fully residential campus", "Strong alumni network", "Dedicated innovation center"]),
    rating: 4.3,
    related_career_slugs: j(["ai-engineer", "mechanical-engineer", "data-analyst"]),
  },
  {
    slug: "mit",
    name: "Massachusetts Institute of Technology",
    type: "International",
    location: "Cambridge, Massachusetts",
    country: "United States",
    overview: "A globally leading research university across engineering, computer science, and the physical sciences.",
    programs: j(["Computer Science", "Electrical Engineering", "Mechanical Engineering", "Management (Sloan)"]),
    fees: "$60,000/year (before aid)",
    scholarships: "Need-blind admission for domestic applicants with need-based financial aid.",
    placements_percent: 97,
    avg_package: "$135,000/year",
    top_recruiters: j(["Google", "Meta", "McKinsey", "SpaceX"]),
    admission_requirements: "Standardized tests, essays, strong STEM coursework; highly selective.",
    acceptance_rate: "~4%",
    campus_highlights: j(["World-class research labs", "Strong entrepreneurship culture", "Cross-registration with Harvard"]),
    rating: 4.9,
    related_career_slugs: j(["ai-engineer", "product-manager", "mechanical-engineer"]),
  },
  {
    slug: "national-institute-of-design",
    name: "National Institute of Design",
    type: "Specialized",
    location: "Ahmedabad, Gujarat",
    country: "India",
    overview: "India's leading design institute, covering product, communication, and industrial design.",
    programs: j(["Industrial Design", "Communication Design", "UX Design", "Textile Design"]),
    fees: "₹4L/year",
    scholarships: "Need-based fee concessions for select students.",
    placements_percent: 92,
    avg_package: "₹12L/year",
    top_recruiters: j(["Google", "Titan", "Tata Elxsi", "Zomato"]),
    admission_requirements: "NID DAT entrance exam plus studio test and interview.",
    acceptance_rate: "~2%",
    campus_highlights: j(["Extensive design studios", "Strong industry-sponsored projects", "Active alumni design network"]),
    rating: 4.6,
    related_career_slugs: j(["ux-designer"]),
  },
  {
    slug: "university-of-london-online",
    name: "University of London (Online)",
    type: "Online",
    location: "Remote",
    country: "United Kingdom",
    overview: "Accredited UK degrees delivered fully online, popular for working professionals and international students.",
    programs: j(["BSc Computer Science", "BSc Data Science & Business Analytics", "MSc Data Science"]),
    fees: "£12,000 total (full program)",
    scholarships: "Need-based bursaries for eligible international students.",
    placements_percent: null,
    avg_package: null,
    top_recruiters: j([]),
    admission_requirements: "High school diploma or equivalent; English proficiency for non-native speakers.",
    acceptance_rate: "Rolling admission, no fixed rate",
    campus_highlights: j(["Fully remote, flexible pacing", "Access to UK university resources online", "Global peer cohort"]),
    rating: 4.1,
    related_career_slugs: j(["data-analyst", "ai-engineer"]),
  },
  {
    slug: "aiims-delhi",
    name: "All India Institute of Medical Sciences, Delhi",
    type: "Government",
    location: "New Delhi",
    country: "India",
    overview: "India's top-ranked medical institute for undergraduate and postgraduate medical education.",
    programs: j(["MBBS", "Nursing", "B.Sc. Allied Health Sciences"]),
    fees: "₹1,600/year (heavily subsidized)",
    scholarships: "Government stipends for eligible students during clinical years.",
    placements_percent: 100,
    avg_package: "Government pay scale (residency)",
    top_recruiters: j(["AIIMS Hospital Network", "Government Health Services"]),
    admission_requirements: "NEET-UG rank within institute cutoff.",
    acceptance_rate: "<1%",
    campus_highlights: j(["Attached to India's largest government hospital", "Extensive clinical exposure from year one"]),
    rating: 4.9,
    related_career_slugs: j(["registered-nurse"]),
  },
];

const insertCollege = db.prepare(`
  INSERT INTO colleges (slug, name, type, location, country, overview, programs, fees, scholarships,
    placements_percent, avg_package, top_recruiters, admission_requirements, acceptance_rate,
    campus_highlights, rating, related_career_slugs)
  VALUES (@slug, @name, @type, @location, @country, @overview, @programs, @fees, @scholarships,
    @placements_percent, @avg_package, @top_recruiters, @admission_requirements, @acceptance_rate,
    @campus_highlights, @rating, @related_career_slugs)
`);
const collegeCount = db.prepare(`SELECT COUNT(*) AS n FROM colleges`).get().n;
if (collegeCount === 0) colleges.forEach((c) => insertCollege.run(c));

const exams = [
  {
    slug: "jee-advanced",
    name: "JEE Advanced",
    overview: "The gateway entrance exam for admission into India's Indian Institutes of Technology (IITs).",
    eligibility: "Must rank in the top ~2.5 lakh in JEE Main; age and attempt limits apply.",
    syllabus: j(["Physics (mechanics, electromagnetism, optics)", "Chemistry (physical, organic, inorganic)", "Mathematics (calculus, algebra, coordinate geometry)"]),
    difficulty: "Very High",
    prep_resources: j([{ name: "NCERT textbooks", type: "Book" }, { name: "HC Verma Physics", type: "Book" }, { name: "Previous year papers", type: "Practice" }]),
    important_dates: "Typically held in May, results in June.",
    past_trends: "Consistently emphasizes conceptual application over rote memorization; increasing weight on multi-correct and numerical-answer questions.",
    recommended_strategy: "Build strong fundamentals in class 11–12 NCERT material first, then layer on advanced problem sets and full-length mocks in the final 6 months.",
    related_career_slugs: j(["ai-engineer", "mechanical-engineer", "cybersecurity-analyst"]),
  },
  {
    slug: "neet-ug",
    name: "NEET-UG",
    overview: "India's single national entrance exam for undergraduate medical (MBBS) and dental admissions.",
    eligibility: "Completed or appearing in class 12 with Physics, Chemistry, and Biology.",
    syllabus: j(["Physics", "Chemistry", "Biology (Botany & Zoology)"]),
    difficulty: "Very High",
    prep_resources: j([{ name: "NCERT Biology", type: "Book" }, { name: "NEET coaching test series", type: "Course" }]),
    important_dates: "Typically held in May, results in June.",
    past_trends: "Heavy weight on NCERT-based biology questions; competition has intensified with rising applicant numbers year over year.",
    recommended_strategy: "Master NCERT Biology cover to cover — it accounts for the majority of scoring questions — then reinforce Physics and Chemistry with timed practice.",
    related_career_slugs: j(["registered-nurse"]),
  },
  {
    slug: "sat",
    name: "SAT",
    overview: "A standardized test widely used for undergraduate admissions in the United States.",
    eligibility: "Open to any high school student; no formal prerequisites.",
    syllabus: j(["Reading & Writing", "Math (algebra, advanced math, problem-solving)"]),
    difficulty: "Moderate",
    prep_resources: j([{ name: "Official SAT practice (Khan Academy)", type: "Course" }, { name: "College Board practice tests", type: "Practice" }]),
    important_dates: "Offered multiple times per year, typically Aug–Jun.",
    past_trends: "Now fully digital and adaptive, with a shorter overall test length than the legacy paper format.",
    recommended_strategy: "Take a diagnostic test early, then focus prep time on your weaker section rather than splitting evenly.",
    related_career_slugs: j(["product-manager", "data-analyst"]),
  },
  {
    slug: "gre",
    name: "GRE General Test",
    overview: "A standardized test commonly required for graduate school admissions, including many master's and PhD programs.",
    eligibility: "Open to anyone; typically taken by those applying to graduate programs.",
    syllabus: j(["Verbal Reasoning", "Quantitative Reasoning", "Analytical Writing"]),
    difficulty: "High",
    prep_resources: j([{ name: "ETS official guide", type: "Book" }, { name: "ETS PowerPrep practice tests", type: "Practice" }]),
    important_dates: "Offered year-round at test centers and online.",
    past_trends: "Quantitative section has trended toward data interpretation and applied reasoning over pure computation.",
    recommended_strategy: "Build a vocabulary habit early for verbal, and drill quant fundamentals before moving to timed full-length practice tests.",
    related_career_slugs: j(["ai-engineer", "data-analyst"]),
  },
];

const insertExam = db.prepare(`
  INSERT INTO entrance_exams (slug, name, overview, eligibility, syllabus, difficulty, prep_resources,
    important_dates, past_trends, recommended_strategy, related_career_slugs)
  VALUES (@slug, @name, @overview, @eligibility, @syllabus, @difficulty, @prep_resources,
    @important_dates, @past_trends, @recommended_strategy, @related_career_slugs)
`);
const examCount = db.prepare(`SELECT COUNT(*) AS n FROM entrance_exams`).get().n;
if (examCount === 0) exams.forEach((e) => insertExam.run(e));

const resources = [
  // AI Engineer
  ["3Blue1Brown", "YouTube Channel", "ai-engineer", "Beginner", "Free", "https://youtube.com/@3blue1brown", "Visual, intuitive explanations of linear algebra, calculus, and neural networks.", 1, 1],
  ["PyTorch Documentation", "Documentation", "ai-engineer", "Intermediate", "Free", "https://pytorch.org/docs", "Official docs and tutorials for the most widely used deep learning framework.", 0, 0],
  ["DeepLearning.AI Specialization", "Course", "ai-engineer", "Beginner", "Paid", "https://deeplearning.ai", "Andrew Ng's foundational deep learning course sequence.", 1, 1],
  ["Kaggle", "Practice Platform", "ai-engineer", "Intermediate", "Free", "https://kaggle.com", "Datasets, competitions, and notebooks to practice end-to-end ML work.", 1, 0],
  ["r/MachineLearning", "Community", "ai-engineer", "Intermediate", "Free", "https://reddit.com/r/MachineLearning", "Active community discussing research papers and industry trends.", 0, 1],
  // UX Designer
  ["Refactoring UI", "Book", "ux-designer", "Beginner", "Paid", null, "A practical, example-driven guide to visual design decisions.", 1, 1],
  ["Figma Community", "Community", "ux-designer", "Beginner", "Free", "https://figma.com/community", "Thousands of free design files, templates, and plugins to learn from.", 1, 0],
  ["Laws of UX", "Blog", "ux-designer", "Beginner", "Free", "https://lawsofux.com", "Short, well-illustrated explanations of core UX psychology principles.", 0, 1],
  ["Google UX Design Certificate", "Course", "ux-designer", "Beginner", "Paid", "https://grow.google/certificates/ux-design", "Entry-level certificate course with a built-in portfolio.", 1, 0],
  // Registered Nurse
  ["NCLEX Mastery", "Practice Platform", "registered-nurse", "Intermediate", "Paid", null, "Practice question banks and rationale explanations for the NCLEX-RN.", 1, 1],
  ["r/StudentNurse", "Community", "registered-nurse", "Beginner", "Free", "https://reddit.com/r/StudentNurse", "A community for nursing students sharing study tips and clinical stories.", 0, 1],
  ["Khan Academy: Health & Medicine", "Course", "registered-nurse", "Beginner", "Free", "https://khanacademy.org", "Free foundational content in anatomy, physiology, and pharmacology basics.", 0, 0],
  // Product Manager
  ["Lenny's Newsletter", "Blog", "product-manager", "Intermediate", "Free", "https://lennysnewsletter.com", "Widely-read essays on product strategy, growth, and career advice.", 1, 1],
  ["Inspired, by Marty Cagan", "Book", "product-manager", "Intermediate", "Paid", null, "A widely recommended book on how strong product teams operate.", 1, 1],
  ["Product School", "Course", "product-manager", "Beginner", "Paid", "https://productschool.com", "Structured PM fundamentals courses and certificates.", 0, 0],
  // Data Analyst
  ["Mode Analytics SQL Tutorial", "Documentation", "data-analyst", "Beginner", "Free", "https://mode.com/sql-tutorial", "A hands-on, in-browser SQL tutorial from basics to advanced queries.", 1, 0],
  ["StrataScratch", "Practice Platform", "data-analyst", "Intermediate", "Paid", "https://stratascratch.com", "Real interview SQL and analytics questions from top companies.", 0, 1],
  ["Storytelling with Data", "Book", "data-analyst", "Intermediate", "Paid", null, "A practical guide to communicating insights clearly through visualization.", 1, 0],
  // Cybersecurity Analyst
  ["picoCTF", "Practice Platform", "cybersecurity-analyst", "Beginner", "Free", "https://picoctf.org", "Beginner-friendly capture-the-flag challenges teaching core security concepts.", 1, 1],
  ["TryHackMe", "Practice Platform", "cybersecurity-analyst", "Beginner", "Paid", "https://tryhackme.com", "Guided, hands-on labs covering security fundamentals to advanced topics.", 1, 0],
  ["r/cybersecurity", "Community", "cybersecurity-analyst", "Intermediate", "Free", "https://reddit.com/r/cybersecurity", "Active discussion on threats, careers, and certifications.", 0, 1],
  // Financial Analyst
  ["Corporate Finance Institute", "Course", "financial-analyst", "Beginner", "Paid", "https://corporatefinanceinstitute.com", "Structured courses on financial modeling and valuation.", 1, 0],
  ["Wall Street Oasis", "Community", "financial-analyst", "Intermediate", "Free", "https://wallstreetoasis.com", "Forums covering finance career paths, interviews, and exit opportunities.", 0, 1],
  // Mechanical Engineer
  ["MIT OpenCourseWare: Mechanical Engineering", "Course", "mechanical-engineer", "Intermediate", "Free", "https://ocw.mit.edu", "Free MIT course materials spanning thermodynamics, statics, and design.", 1, 0],
  ["GrabCAD", "Community", "mechanical-engineer", "Intermediate", "Free", "https://grabcad.com", "A library of CAD models and an active engineering design community.", 0, 1],
];

const insertResource = db.prepare(`
  INSERT INTO resources (title, type, career_slug, level, cost, url, description, is_trending, is_community_favorite)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
const resourceCount = db.prepare(`SELECT COUNT(*) AS n FROM resources`).get().n;
if (resourceCount === 0) resources.forEach((r) => insertResource.run(...r));

// --- Demo users (authors for seeded community posts) -----------------
// These are ordinary rows in the same `users` table — just seeded so the
// Community section has real content on first run rather than being empty.
// Their passwords aren't shared anywhere; nobody is meant to log in as them.
const demoUsers = [
  ["Priya Sharma", "priya.demo@careercraft.local"],
  ["Alex Kim", "alex.demo@careercraft.local"],
  ["Jordan Lee", "jordan.demo@careercraft.local"],
  ["Sam Torres", "sam.demo@careercraft.local"],
];
const demoPasswordHash = bcrypt.hashSync("careercraft-demo-user", 10);
const insertDemoUser = db.prepare(`INSERT OR IGNORE INTO users (name, email, password_hash) VALUES (?, ?, ?)`);
demoUsers.forEach(([name, email]) => insertDemoUser.run(name, email, demoPasswordHash));
const demoUserIds = demoUsers.map(([, email]) => db.prepare(`SELECT id FROM users WHERE email = ?`).get(email).id);

// --- Communities --------------------------------------------------------
const communities = [
  ["ai-engineering", "AI Engineering", "Model training, MLOps, and breaking into applied AI roles.", "technology", 1],
  ["cybersecurity", "Cybersecurity", "Threats, certifications, and career paths in security.", "technology", 2],
  ["medicine", "Medicine", "Nursing, clinical training, and healthcare careers.", "healthcare", 3],
  ["law", "Law", "Legal careers, exams, and law school questions.", "law", 4],
  ["finance", "Finance", "Markets, financial analysis, and finance career paths.", "finance", 5],
  ["design", "Design", "UX, product design, and portfolio feedback.", "creative-arts", 6],
  ["business", "Business", "Product management, strategy, and general business careers.", "business", 7],
  ["research", "Research", "Academic and industry research career paths.", "science", 8],
  ["government-exams", "Government Exams", "Civil services, public sector, and competitive exam prep.", "government", 9],
];
const insertCommunity = db.prepare(
  `INSERT OR IGNORE INTO communities (slug, name, description, category_slug, sort_order) VALUES (?, ?, ?, ?, ?)`
);
communities.forEach((c) => insertCommunity.run(...c));

// --- Seed posts + comments ------------------------------------------------
const posts = [
  ["ai-engineering", 0, "Question", "How much math do I actually need before starting ML?", "I keep seeing conflicting advice — some say you need a full linear algebra course first, others say just start building. What worked for people here?"],
  ["ai-engineering", 1, "Experience", "Landed my first ML internship — AMA", "Six months ago I couldn't explain gradient descent. Just accepted an internship offer. Happy to share what I focused on."],
  ["cybersecurity", 2, "Advice", "picoCTF vs TryHackMe for absolute beginners?", "Starting from zero. Which one actually teaches concepts instead of just giving you flags?"],
  ["medicine", 3, "Question", "NCLEX prep timeline if I'm working full-time?", "Graduating in 3 months and still working 30hrs/week. Realistic study schedule?"],
  ["design", 0, "Review", "Google UX certificate — worth it in 2026?", "Finished it last month. Solid for absolute beginners, but the portfolio projects felt a bit generic. Curious what others think."],
  ["business", 1, "Discuss Roadmaps", "APM programs vs. just applying to regular PM roles", "Torn between grinding for a rotational APM program vs. just applying broadly. What's the actual difference in outcomes?"],
  ["finance", 2, "Question", "Is the CFA worth it if I want to move into fintech PM roles eventually?", "Currently a financial analyst, curious if CFA level 1 is a good signal for a future pivot."],
  ["government-exams", 3, "Advice", "Balancing exam prep with a full-time job", "Anyone successfully cleared a government exam while working full-time? How did you structure your week?"],
];

const insertPost = db.prepare(
  `INSERT INTO posts (community_slug, user_id, post_type, title, body) VALUES (?, ?, ?, ?, ?)`
);
const postCount = db.prepare(`SELECT COUNT(*) AS n FROM posts`).get().n;
let insertedPostIds = [];
if (postCount === 0) {
  insertedPostIds = posts.map((p) => {
    const [communitySlug, userIdx, type, title, body] = p;
    const info = insertPost.run(communitySlug, demoUserIds[userIdx], type, title, body);
    return info.lastInsertRowid;
  });

  const comments = [
    [0, 1, "Honestly, just start building. You'll pick up the math you need as you hit walls — trying to front-load all of linear algebra first is how most people quit."],
    [0, 2, "Disagree a bit — at least understand what a gradient IS before you start, or debugging will feel like magic."],
    [1, 3, "This is really encouraging, thank you for sharing the timeline."],
    [2, 0, "picoCTF for pure fundamentals, TryHackMe once you want guided paths with more hand-holding."],
    [4, 1, "Agreed on the generic portfolio projects — I'd pair it with one fully original project."],
  ];
  comments.forEach(([postIdx, userIdx, body]) => {
    db.prepare(`INSERT INTO comments (post_id, user_id, body) VALUES (?, ?, ?)`).run(
      insertedPostIds[postIdx],
      demoUserIds[userIdx],
      body
    );
  });
}

console.log("Seed complete:", {
  categories: db.prepare("SELECT COUNT(*) AS n FROM categories").get().n,
  careers: db.prepare("SELECT COUNT(*) AS n FROM careers").get().n,
  trustStats: db.prepare("SELECT COUNT(*) AS n FROM trust_stats").get().n,
  successStories: db.prepare("SELECT COUNT(*) AS n FROM success_stories").get().n,
  faqs: db.prepare("SELECT COUNT(*) AS n FROM faqs").get().n,
  opportunities: db.prepare("SELECT COUNT(*) AS n FROM opportunities").get().n,
  colleges: db.prepare("SELECT COUNT(*) AS n FROM colleges").get().n,
  entranceExams: db.prepare("SELECT COUNT(*) AS n FROM entrance_exams").get().n,
  resources: db.prepare("SELECT COUNT(*) AS n FROM resources").get().n,
  communities: db.prepare("SELECT COUNT(*) AS n FROM communities").get().n,
  posts: db.prepare("SELECT COUNT(*) AS n FROM posts").get().n,
});

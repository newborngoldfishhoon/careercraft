const fs = require('fs');

let code = fs.readFileSync('seed.js', 'utf8');

// Replace top import
code = code.replace('const db = require("./db");', 'const { countRows, insertIgnore, insertRow, selectOne } = require("./db");\n\nasync function runSeed() {');

// Replace the various insert statements
code = code.replace(/const insertCategory = db\.prepare\([\s\S]*?\);\ncategories\.forEach\(\(c, i\) => insertCategory\.run\(c\[0\], c\[1\], c\[2\], c\[3\], c\[4\], i \+ 1\)\);/, 
  `for (let i = 0; i < categories.length; i++) {
    const c = categories[i];
    await insertIgnore("categories", { name: c[0], slug: c[1], description: c[2], career_count: c[3], icon: c[4], sort_order: i + 1 });
  }`);

code = code.replace(/const insertDetailedCareer = db\.prepare\([\s\S]*?const insertCountry = db\.prepare\([\s\S]*?\n\s*`\);\n/, '');

code = code.replace(/const careerCount = db\.prepare\(`SELECT COUNT\(\*\) AS n FROM careers`\)\.get\(\)\.n;\nif \(careerCount === 0\) {[\s\S]*?basicCareers\.forEach\(\(c\) => insertBasicCareer\.run\(c\)\);\n}/, 
  `const careerCount = await countRows("careers");
  if (careerCount === 0) {
    for (const c of detailedCareers) {
      const { countries, ...rest } = c;
      const inserted = await insertRow("careers", rest);
      for (const row of countries) {
        await insertRow("career_countries", { career_id: inserted.id, country: row[0], avg_salary: row[1], entry_salary: row[2], senior_salary: row[3], demand_level: row[4], competition_level: row[5], top_cities: row[6], top_employers: row[7], visa_info: row[8] });
      }
    }
    for (const c of basicCareers) {
      await insertRow("careers", c);
    }
  }`);

code = code.replace(/const insertStat = db\.prepare\([\s\S]*?if \(statCount === 0\) trustStats\.forEach\(\(s\) => insertStat\.run\(s\[0\], s\[1\], s\[2\]\)\);/, 
  `const statCount = await countRows("trust_stats");
  if (statCount === 0) {
    for (const s of trustStats) await insertRow("trust_stats", { label: s[0], value: s[1], sort_order: s[2] });
  }`);

code = code.replace(/const insertStory = db\.prepare\([\s\S]*?if \(storyCount === 0\) successStories\.forEach\(\(s\) => insertStory\.run\(\.\.\.s\)\);/, 
  `const storyCount = await countRows("success_stories");
  if (storyCount === 0) {
    for (const s of successStories) await insertRow("success_stories", { headline: s[0], path: s[1], quote: s[2], sort_order: s[3] });
  }`);

code = code.replace(/const insertFaq = db\.prepare\([\s\S]*?if \(faqCount === 0\) faqs\.forEach\(\(f, i\) => insertFaq\.run\(f\[0\], f\[1\], i \+ 1\)\);/, 
  `const faqCount = await countRows("faqs");
  if (faqCount === 0) {
    for (let i = 0; i < faqs.length; i++) await insertRow("faqs", { question: faqs[i][0], answer: faqs[i][1], sort_order: i + 1 });
  }`);

code = code.replace(/const insertOpportunity = db\.prepare\([\s\S]*?if \(opportunityCount === 0\) opportunities\.forEach\(\(o\) => insertOpportunity\.run\(\.\.\.o\)\);/, 
  `const opportunityCount = await countRows("opportunities");
  if (opportunityCount === 0) {
    for (const o of opportunities) await insertRow("opportunities", { title: o[0], type: o[1], career_slug: o[2], organization: o[3], location: o[4], remote: o[5], description: o[6], url: o[7], deadline: o[8], min_readiness: o[9] });
  }`);

code = code.replace(/const insertCollege = db\.prepare\([\s\S]*?if \(collegeCount === 0\) colleges\.forEach\(\(c\) => insertCollege\.run\(c\)\);/, 
  `const collegeCount = await countRows("colleges");
  if (collegeCount === 0) {
    for (const c of colleges) await insertRow("colleges", c);
  }`);

code = code.replace(/const insertExam = db\.prepare\([\s\S]*?if \(examCount === 0\) exams\.forEach\(\(e\) => insertExam\.run\(e\)\);/, 
  `const examCount = await countRows("entrance_exams");
  if (examCount === 0) {
    for (const e of exams) await insertRow("entrance_exams", e);
  }`);

code = code.replace(/const insertResource = db\.prepare\([\s\S]*?if \(resourceCount === 0\) resources\.forEach\(\(r\) => insertResource\.run\(\.\.\.r\)\);/, 
  `const resourceCount = await countRows("resources");
  if (resourceCount === 0) {
    for (const r of resources) await insertRow("resources", { title: r[0], type: r[1], career_slug: r[2], level: r[3], cost: r[4], url: r[5], description: r[6], is_trending: r[7], is_community_favorite: r[8] });
  }`);

code = code.replace(/const insertDemoUser = db\.prepare\([\s\S]*?const demoUserIds = demoUsers\.map\(\(\[, email\]\) => db\.prepare\(`SELECT id FROM users WHERE email = \?`\)\.get\(email\)\.id\);/, 
  `const demoUserIds = [];
  for (const [name, email] of demoUsers) {
    let user = await insertIgnore("users", { name, email, password_hash: demoPasswordHash });
    if (!user) {
      user = await selectOne("users", { filters: { email } });
    }
    demoUserIds.push(user.id);
  }`);

code = code.replace(/const insertCommunity = db\.prepare\([\s\S]*?communities\.forEach\(\(c\) => insertCommunity\.run\(\.\.\.c\)\);/, 
  `for (const c of communities) {
    await insertIgnore("communities", { slug: c[0], name: c[1], description: c[2], category_slug: c[3], sort_order: c[4] });
  }`);

code = code.replace(/const insertPost = db\.prepare\([\s\S]*?console\.log\("Seed complete:", \{[\s\S]*?\}\);/m, 
  `const postCount = await countRows("posts");
  let insertedPostIds = [];
  if (postCount === 0) {
    for (const p of posts) {
      const [communitySlug, userIdx, type, title, body] = p;
      const inserted = await insertRow("posts", { community_slug: communitySlug, user_id: demoUserIds[userIdx], post_type: type, title, body });
      insertedPostIds.push(inserted.id);
    }

    const comments = [
      [0, 1, "Honestly, just start building. You'll pick up the math you need as you hit walls — trying to front-load all of linear algebra first is how most people quit."],
      [0, 2, "Disagree a bit — at least understand what a gradient IS before you start, or debugging will feel like magic."],
      [1, 3, "This is really encouraging, thank you for sharing the timeline."],
      [2, 0, "picoCTF for pure fundamentals, TryHackMe once you want guided paths with more hand-holding."],
      [4, 1, "Agreed on the generic portfolio projects — I'd pair it with one fully original project."],
    ];
    for (const [postIdx, userIdx, body] of comments) {
      await insertRow("comments", { post_id: insertedPostIds[postIdx], user_id: demoUserIds[userIdx], body });
    }
  }

  console.log("Seed complete:", {
    categories: await countRows("categories"),
    careers: await countRows("careers"),
    trustStats: await countRows("trust_stats"),
    successStories: await countRows("success_stories"),
    faqs: await countRows("faqs"),
    opportunities: await countRows("opportunities"),
    colleges: await countRows("colleges"),
    entranceExams: await countRows("entrance_exams"),
    resources: await countRows("resources"),
    communities: await countRows("communities"),
    posts: await countRows("posts"),
  });
}`);

code += '\n\nrunSeed().catch(err => { console.error("Seed error:", err); process.exit(1); });\n';

fs.writeFileSync('seed.js', code);
console.log('Seed migration complete.');

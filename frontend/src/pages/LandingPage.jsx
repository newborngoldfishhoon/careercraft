import { useEffect, useState } from "react";
import Navbar from "../components/Navbar.jsx";
import Hero from "../components/Hero.jsx";
import TrustStats from "../components/TrustStats.jsx";
import FeatureShowcase from "../components/FeatureShowcase.jsx";
import CategoryGrid from "../components/CategoryGrid.jsx";
import SuccessStories from "../components/SuccessStories.jsx";
import FAQ from "../components/FAQ.jsx";
import Footer from "../components/Footer.jsx";
import JourneyRail from "../components/JourneyRail.jsx";

// Fallback content shown if the API isn't reachable yet, so the page never
// looks broken while the backend is being started for the first time.
const FALLBACK = {
  categories: [
    { slug: "technology", name: "Technology", description: "Software, data, cloud, and the systems that run modern life.", career_count: 412, icon: "cpu" },
    { slug: "healthcare", name: "Healthcare", description: "Medicine, nursing, therapy, and the science of caring for people.", career_count: 268, icon: "pulse" },
    { slug: "business", name: "Business", description: "Strategy, operations, and the work of running organizations.", career_count: 331, icon: "briefcase" },
    { slug: "finance", name: "Finance", description: "Markets, investing, banking, and managing money at scale.", career_count: 194, icon: "chart" },
    { slug: "education", name: "Education", description: "Teaching, curriculum design, and shaping how people learn.", career_count: 152, icon: "book" },
    { slug: "law", name: "Law", description: "Courts, contracts, policy, and the rules that govern society.", career_count: 118, icon: "scale" },
  ],
  stats: [
    { label: "Careers Mapped", value: "3,400+" },
    { label: "Career Categories", value: "24" },
    { label: "Learning Resources", value: "58,000+" },
    { label: "Users Who Found Direction", value: "210,000+" },
  ],
  stories: [
    { headline: "From classroom to career", path: "School Student → Dream College", quote: "I had no idea what I wanted until I ran the assessment." },
    { headline: "A second start, on purpose", path: "Career Switcher → New Industry", quote: "Fourteen years in accounting, then six months of focused learning." },
  ],
  faqs: [
    { question: "Which career is best for me?", answer: "There's no single best career — only the one that fits your interests, strengths, and goals. The Career Match Assessment helps you find it." },
  ],
};

export default function LandingPage() {
  const [data, setData] = useState(FALLBACK);

  useEffect(() => {
    async function load() {
      try {
        const [categories, stats, stories, faqs] = await Promise.all([
          fetch("/api/categories").then((r) => r.json()),
          fetch("/api/stats").then((r) => r.json()),
          fetch("/api/success-stories").then((r) => r.json()),
          fetch("/api/faqs").then((r) => r.json()),
        ]);
        setData({ categories, stats, stories, faqs });
      } catch {
        // keep fallback content — backend probably isn't running yet
      }
    }
    load();
  }, []);

  return (
    <div className="has-rail">
      <JourneyRail />
      <Navbar />
      <main>
        <Hero categories={data.categories} />
        <TrustStats stats={data.stats} />
        <FeatureShowcase />
        <CategoryGrid categories={data.categories} />
        <SuccessStories stories={data.stories} />
        <FAQ faqs={data.faqs} />
      </main>
      <Footer />
    </div>
  );
}

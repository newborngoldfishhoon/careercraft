import { useEffect, useState } from "react";

const STAGES = [
  "Discover",
  "Explore",
  "Evaluate",
  "Choose",
  "Commit",
  "Learn",
  "Build",
  "Apply",
  "Achieve",
  "Grow",
];

// The rail is the page's one signature device: CareerCraft frames every
// feature as a step in a ten-stage lifecycle, so the scroll position of the
// page itself is mapped directly onto that lifecycle, stage by stage.
export default function JourneyRail() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - doc.clientHeight;
      const pct = scrollable > 0 ? doc.scrollTop / scrollable : 0;
      setProgress(Math.min(1, Math.max(0, pct)));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const activeIndex = Math.min(STAGES.length - 1, Math.floor(progress * STAGES.length));

  return (
    <nav className="journey-rail" aria-label="Your career journey, mapped to this page">
      <div className="journey-rail__track">
        <div
          className="journey-rail__fill"
          style={{ height: `${progress * 100}%` }}
        />
        {STAGES.map((stage, i) => (
          <div
            className={
              "journey-rail__stop" +
              (i <= activeIndex ? " journey-rail__stop--done" : "") +
              (i === activeIndex ? " journey-rail__stop--active" : "")
            }
            style={{ top: `${(i / (STAGES.length - 1)) * 100}%` }}
            key={stage}
          >
            <span className="journey-rail__dot" />
            <span className="journey-rail__label">{stage}</span>
          </div>
        ))}
      </div>
    </nav>
  );
}

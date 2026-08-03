const paths = {
  cpu: "M9 9h6v6H9zM4 9h2M4 12h2M4 15h2M18 9h2M18 12h2M18 15h2M9 4v2M12 4v2M15 4v2M9 18v2M12 18v2M15 18v2",
  pulse: "M3 12h4l2-7 4 14 2-7h6",
  briefcase: "M4 8h16v11H4zM8 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2",
  chart: "M4 20V10M10 20V4M16 20v-7M22 20H2",
  book: "M4 5a2 2 0 0 1 2-2h6v18H6a2 2 0 0 1-2-2zM20 5a2 2 0 0 0-2-2h-6v18h6a2 2 0 0 0 2-2z",
  scale: "M12 3v18M5 8l-2 6a3 3 0 0 0 6 0zM19 8l-2 6a3 3 0 0 0 6 0zM5 8h14M9 3h6",
  landmark: "M4 21h16M5 21V9M9 21V9M15 21V9M19 21V9M2 9l10-6 10 6",
  palette: "M12 2a10 10 0 1 0 0 20c1.5 0 2-1 2-2s-1-1.2-1-2 .6-1.5 2-1.5h2A4 4 0 0 0 21 12 10 10 0 0 0 12 2z",
  flask: "M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h8.4a2 2 0 0 0 1.8-3l-5-9V3",
  trophy: "M8 21h8M12 17v4M6 4h12v3a6 6 0 0 1-12 0zM6 4H3v1a4 4 0 0 0 4 4M18 4h3v1a4 4 0 0 1-4 4",
  rocket: "M12 2c3 2 5 6 5 10-2 1-3 2-5 2s-3-1-5-2c0-4 2-8 5-10zM8 15l-3 6 6-3M16 15l3 6-6-3",
};

export default function Icon({ name, size = 22 }) {
  const d = paths[name] || paths.rocket;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d={d} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function StatsStrip({ listed, negotiable, dealsToday }) {
  const stats = [
    { label: "Listed", value: listed },
    { label: "Negotiable", value: negotiable },
    { label: "Deals Today", value: dealsToday },
  ];

  return (
    <div className="relative z-10 px-5 mb-4 flex-shrink-0">
      <div
        className="flex items-center gap-4"
      >
        {stats.map((s, i) => (
          <div
            key={i}
            className="flex-1 flex items-center gap-3"
          >
            {/* Number Badge */}
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl font-bold text-xl"
              style={{
                background: "#B9A7E8",
                color: "#2A1744",
              }}
            >
              {s.value}
            </div>

            {/* Label */}
            <p
              className="text-sm font-semibold leading-tight"
              style={{ color: "var(--text-primary)" }}
            >
              {s.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
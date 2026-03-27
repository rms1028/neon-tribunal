export default function DonutChart({ segments }: { segments: { color: string; percent: number; label: string }[] }) {
  const R = 40;
  const C = 2 * Math.PI * R;
  let offset = 0;

  return (
    <svg viewBox="0 0 100 100" style={{ width: "100%", height: "100%" }}>
      <circle cx="50" cy="50" r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="14" />
      {segments.map((seg, i) => {
        const dash = (seg.percent / 100) * C;
        const gap = C - dash;
        const currentOffset = offset;
        offset += dash;
        return (
          <circle
            key={i}
            cx="50" cy="50" r={R}
            fill="none" stroke={seg.color} strokeWidth="14"
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={-currentOffset}
            strokeLinecap="butt"
            className="donut-segment"
            style={{
              ["--circumference" as string]: `${C}`,
              transformOrigin: "50% 50%",
              transform: "rotate(-90deg)",
              filter: `drop-shadow(0 0 6px ${seg.color}80)`,
            }}
          />
        );
      })}
    </svg>
  );
}

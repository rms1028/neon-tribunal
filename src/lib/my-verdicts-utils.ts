/** my-verdicts 전용 유틸리티 */

const SPICE_MAP: Record<string, number> = {
  "justice-zero": 65,
  "heart-beat": 30,
  "cyber-rekka": 95,
  "detective-neon": 80,
};

export { SPICE_MAP };

export function getSpiceBadge(judgeId: string): { label: string; icon: string; color: string } {
  const spice = SPICE_MAP[judgeId] ?? 50;
  if (spice >= 90) return { label: "매운맛", icon: "\uD83D\uDD25", color: "#ef4444" };
  if (spice >= 70) return { label: "중간맛", icon: "\u26A1", color: "#f97316" };
  if (spice >= 50) return { label: "순한맛", icon: "\uD83D\uDCA5", color: "#eab308" };
  return { label: "마일드", icon: "\uD83D\uDEE1\uFE0F", color: "#22d3ee" };
}

export function getUserRank(count: number) {
  if (count >= 30) return { label: "Lv.5 마스터", color: "#ffaa00", icon: "\uD83D\uDC51" };
  if (count >= 20) return { label: "Lv.4 베테랑", color: "#ff2d95", icon: "\u2B50" };
  if (count >= 10) return { label: "Lv.3 단골", color: "#b44aff", icon: "\u26A1" };
  if (count >= 5) return { label: "Lv.2 일반", color: "#00f0ff", icon: "\u2696\uFE0F" };
  return { label: "Lv.1 입문", color: "#39ff14", icon: "\uD83D\uDD30" };
}

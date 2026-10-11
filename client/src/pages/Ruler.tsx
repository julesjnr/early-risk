import { LEVELS, type Risk } from "../api";

// The signature element: a three-zone ruler with a marker at the person's score.
export default function Ruler({ risk }: { risk: Pick<Risk, "score" | "max" | "bands" | "level" | "condition"> }) {
  const { score, max, bands } = risk;
  const w = [bands[0], bands[1] - bands[0], max - bands[1]].map((x) => (x / max) * 100);
  return (
    <div className="ruler" role="img" aria-label={`${risk.condition}: ${LEVELS[risk.level]} risk, score ${score} of ${max}`}>
      {w.map((x, i) => <i key={i} style={{ width: `${x}%` }} />)}
      <span className="mark" style={{ left: `${Math.min((score / max) * 100, 99)}%` }} />
    </div>
  );
}

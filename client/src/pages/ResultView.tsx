import { LEVELS, type Results } from "../api";
import Ruler from "./Ruler";

export default function ResultView({ results }: { results: Results }) {
  return (
    <div className="card">
      <h2>Your results</h2>
      {results.risks.map((r) => (
        <div className="risk" key={r.condition}>
          <div className="row"><h3>{r.condition}</h3><strong className={`l${r.level}`}>{LEVELS[r.level]} risk</strong></div>
          <Ruler risk={r} />
          <p className="mute small">{r.factors.length ? "Driven by " + r.factors.map((f) => f.label).join(", ") : "No risk factors found"}</p>
        </div>
      ))}
      <p className="mute small">Body mass index (BMI): {results.bmi}</p>
      {results.tips.length > 0 ? (
        <><h3>What would help most</h3><ul>{results.tips.map((t) => <li key={t}>{t}</li>)}</ul></>
      ) : (
        <p>Your answers show few risk factors. Keep your habits and get routine checkups.</p>
      )}
      {results.seeClinician && <p className="alert"><strong>Book a checkup.</strong> At least one result is in the higher range. A clinic can confirm with tests.</p>}
      <button className="ghost" onClick={() => window.print()}>Print report</button>
    </div>
  );
}

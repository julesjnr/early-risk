import { useEffect, useState } from "react";
import { api, LEVELS, type Assessment } from "../api";
import ResultView from "./ResultView";

export default function History() {
  const [rows, setRows] = useState<Assessment[] | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  useEffect(() => { api<Assessment[]>("/assessments").then(setRows); }, []);
  if (!rows) return <p>Loading…</p>;
  if (!rows.length) return <p>No assessments yet. Run your first one from “New assessment”.</p>;
  return (
    <div>
      <h2>My history</h2>
      {rows.map((r) => (
        <div key={r.id}>
          <button className="ghost row-btn" onClick={() => setOpen(open === r.id ? null : r.id)}>
            {new Date(r.createdAt).toLocaleDateString()}: {r.results.risks.map((x) => `${x.condition} ${LEVELS[x.level].toLowerCase()}`).join(", ")}
          </button>
          {open === r.id && <ResultView results={r.results} />}
        </div>
      ))}
    </div>
  );
}

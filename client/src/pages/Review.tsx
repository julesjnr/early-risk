import { useEffect, useState } from "react";
import { api, LEVELS, type Results } from "../api";

type Row = { id: string; createdAt: string; patient: string; email: string; results: Results };

export default function Review() {
  const [rows, setRows] = useState<Row[] | null>(null);
  useEffect(() => { api<Row[]>("/assessments/review").then(setRows); }, []);
  if (!rows) return <p>Loading…</p>;
  return (
    <div className="card">
      <h2>Recent assessments</h2>
      <div className="table-scroll">
      <table>
        <thead><tr><th>Date</th><th>Patient</th><th>Diabetes</th><th>Heart</th><th>Blood pressure</th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td data-label="Date">{new Date(r.createdAt).toLocaleDateString()}</td>
              <td data-label="Patient">{r.patient}<br /><span className="mute small">{r.email}</span></td>
              {r.results.risks.map((x) => <td key={x.condition} data-label={x.condition} className={`l${x.level}`}>{LEVELS[x.level]}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}

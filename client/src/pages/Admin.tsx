import { useEffect, useState } from "react";
import { api, type User } from "../api";

type Row = User & { email: string };

export default function Admin() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { api<Row[]>("/admin/users").then(setRows); }, []);

  async function setRole(id: string, role: string) {
    setError("");
    try {
      await api(`/admin/users/${id}/role`, "PATCH", { role });
      setRows((rs) => rs!.map((r) => (r.id === id ? { ...r, role: role as Row["role"] } : r)));
    } catch (e) { setError((e as Error).message); }
  }

  if (!rows) return <p>Loading…</p>;
  return (
    <div className="card">
      <h2>Users</h2>
      {error && <p role="alert" className="err">{error}</p>}
      <div className="table-scroll">
      <table>
        <thead><tr><th>Name</th><th>Email</th><th>Role</th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td data-label="Name">{r.name}</td><td data-label="Email">{r.email}</td>
              <td data-label="Role">
                <select value={r.role} onChange={(e) => setRole(r.id, e.target.value)} aria-label={`Role for ${r.name}`}>
                  <option value="patient">Patient</option><option value="clinician">Clinician</option><option value="admin">Admin</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}

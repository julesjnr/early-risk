// Browser-only stand-in for the Express API so the frontend runs with no backend.
// Data lives in localStorage. Passwords are stored in plain text HERE ONLY because this is a mock.
import { assess, type Input } from "./mockScoring";

type U = { id: string; name: string; email: string; password: string; role: "patient" | "clinician" | "admin" };
type A = { id: string; userId: string; createdAt: string; input: Input; results: ReturnType<typeof assess> };

const load = <T,>(k: string, d: T): T => { try { return JSON.parse(localStorage.getItem(k) ?? "") as T; } catch { return d; } };
const save = (k: string, v: unknown) => localStorage.setItem(k, JSON.stringify(v));
const id = () => crypto.randomUUID();

const seed: U[] = [
  { id: "u-admin", name: "Demo Admin", email: "admin@demo.test", password: "password123", role: "admin" },
  { id: "u-clin", name: "Demo Clinician", email: "clinician@demo.test", password: "password123", role: "clinician" },
];
const users = () => load<U[]>("erc_users", seed);
const items = () => load<A[]>("erc_assessments", []);
const me = () => users().find((u) => u.id === localStorage.getItem("erc_session"));
const pub = (u: U) => ({ id: u.id, name: u.name, role: u.role });
const fail = (m: string): never => { throw new Error(m); };

export async function mockApi(path: string, method: string, body: any): Promise<any> {
  await new Promise((r) => setTimeout(r, 150));
  const u = me();
  if (path === "/auth/register") {
    if (users().some((x) => x.email === body.email.toLowerCase())) fail("That email is already registered");
    const n: U = { id: id(), name: body.name, email: body.email.toLowerCase(), password: body.password, role: "patient" };
    save("erc_users", [...users(), n]); localStorage.setItem("erc_session", n.id); return pub(n);
  }
  if (path === "/auth/login") {
    const f = users().find((x) => x.email === body.email.toLowerCase() && x.password === body.password);
    if (!f) fail("Email or password is incorrect");
    localStorage.setItem("erc_session", f!.id); return pub(f!);
  }
  if (path === "/auth/logout") { localStorage.removeItem("erc_session"); return { ok: true }; }
  if (!u) fail("Please sign in");
  if (path === "/auth/me") return pub(u!);
  if (path === "/assessments" && method === "POST") {
    const a: A = { id: id(), userId: u!.id, createdAt: new Date().toISOString(), input: body, results: assess(body) };
    save("erc_assessments", [a, ...items()]); return a;
  }
  if (path === "/assessments") return items().filter((a) => a.userId === u!.id);
  if (path === "/assessments/review") {
    if (u!.role === "patient") fail("Not allowed");
    return items().map((a) => { const p = users().find((x) => x.id === a.userId); return { ...a, patient: p?.name ?? "Unknown", email: p?.email ?? "" }; });
  }
  if (path === "/admin/users") { if (u!.role !== "admin") fail("Not allowed"); return users().map((x) => ({ ...pub(x), email: x.email })); }
  const m = path.match(/^\/admin\/users\/(.+)\/role$/);
  if (m) {
    if (u!.role !== "admin") fail("Not allowed");
    if (m[1] === u!.id) fail("You can't change your own role");
    save("erc_users", users().map((x) => (x.id === m[1] ? { ...x, role: body.role } : x))); return { id: m[1], role: body.role };
  }
  return fail("Not found");
}

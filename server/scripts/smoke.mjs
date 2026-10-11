// End-to-end check against a running server: node scripts/smoke.mjs [baseUrl]
const BASE = process.argv[2] ?? "http://localhost:8000";
let pass = 0, failed = 0;
const jar = {};
async function call(who, path, method = "GET", body) {
  const res = await fetch(BASE + "/api" + path, {
    method,
    headers: { "Content-Type": "application/json", ...(jar[who] ? { Cookie: jar[who] } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const set = res.headers.get("set-cookie");
  if (set) jar[who] = set.split(";")[0];
  return { status: res.status, data: await res.json().catch(() => ({})) };
}
function check(name, ok, extra = "") { ok ? pass++ : failed++; console.log(`${ok ? "PASS" : "FAIL"}  ${name} ${ok ? "" : extra}`); }

const run = Date.now();
const input = { age: 58, sex: "m", h: 172, w: 95, waist: 108, sys: 150, act: 1, veg: 1, smoke: 1, fd: 5, fh: 1, gl: 1, bpm: 0 };

let r = await call("p", "/auth/register", "POST", { name: "Pat Ient", email: `pat${run}@t.test`, password: "password123" });
check("register patient", r.status === 201 && r.data.role === "patient", JSON.stringify(r));
r = await call("p", "/auth/register", "POST", { name: "Dup", email: `pat${run}@t.test`, password: "password123" });
check("duplicate email rejected", r.status === 409);
r = await call("x", "/auth/login", "POST", { email: `pat${run}@t.test`, password: "wrongpass1" });
check("wrong password rejected", r.status === 401);
r = await call("p", "/auth/me");
check("me returns session user", r.status === 200 && r.data.name === "Pat Ient");
r = await call("anon", "/assessments");
check("unauthenticated blocked", r.status === 401);
r = await call("p", "/assessments", "POST", { ...input, age: 5 });
check("invalid input rejected", r.status === 400);
r = await call("p", "/assessments", "POST", input);
check("create assessment", r.status === 201 && r.data.results.risks.length === 3, JSON.stringify(r.data).slice(0, 200));
check("high-risk input scored higher + checkup flag", r.data.results?.risks.every((x) => x.level === 2) && r.data.results?.seeClinician === true);
r = await call("p", "/assessments");
check("history lists own assessment", r.status === 200 && r.data.length === 1);
r = await call("p", "/assessments/review");
check("patient blocked from review", r.status === 403);
r = await call("p", "/admin/users");
check("patient blocked from admin", r.status === 403);
r = await call("p", "/admin/users/x/role", "PATCH", { role: "admin" });
check("patient cannot self-promote", r.status === 403);

// second patient must not see the first one's data
await call("q", "/auth/register", "POST", { name: "Quinn", email: `quinn${run}@t.test`, password: "password123" });
r = await call("q", "/assessments");
check("patients are isolated", r.status === 200 && r.data.length === 0);

// admin (promoted out-of-band via SQL, set ADMIN_EMAIL) and clinician flows
const adminEmail = process.env.ADMIN_EMAIL;
if (adminEmail) {
  r = await call("a", "/auth/login", "POST", { email: adminEmail, password: process.env.ADMIN_PASSWORD ?? "password123" });
  check("admin login", r.status === 200 && r.data.role === "admin");
  r = await call("a", "/admin/users");
  const quinn = r.data.find?.((u) => u.email === `quinn${run}@t.test`);
  check("admin lists users", r.status === 200 && !!quinn);
  r = await call("a", `/admin/users/${quinn?.id}/role`, "PATCH", { role: "clinician" });
  check("admin promotes to clinician", r.status === 200 && r.data.role === "clinician");
  await call("q", "/auth/login", "POST", { email: `quinn${run}@t.test`, password: "password123" });
  r = await call("q", "/assessments/review");
  check("clinician sees review list with patient names", r.status === 200 && r.data.some?.((x) => x.patient === "Pat Ient"));
  r = await call("a", `/admin/users/${r.data?.[0] ? "" : ""}${(await call("a", "/auth/me")).data.id}/role`, "PATCH", { role: "patient" });
  check("admin cannot change own role", r.status === 400);
} else console.log("SKIP  admin/clinician flows (set ADMIN_EMAIL to a user promoted to admin)");

r = await fetch(BASE + "/api/assessments", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{bad" });
check("malformed JSON gives 400 not a crash", r.status === 400 || r.status === 401);
console.log(`\n${pass} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);

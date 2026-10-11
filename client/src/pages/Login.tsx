import { useState, type FormEvent } from "react";
import { api, MOCK, type User } from "../api";
import Ruler from "./Ruler";

const sample = { condition: "Sample", score: 11, max: 26, bands: [9, 15] as [number, number], level: 1 as const };

export default function Login({ onAuth }: { onAuth: (u: User) => void }) {
  const [mode, setMode] = useState<"login" | "register">("register");
  const [f, setF] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    try { onAuth(await api<User>(`/auth/${mode}`, "POST", f)); } catch (err) { setError((err as Error).message); }
  }
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  return (
    <main className="wrap landing">
      <section>
        <h1>Know your risk before symptoms start</h1>
        <p className="lead">Answer a few questions about your body and habits. See your risk of type 2 diabetes, heart disease and high blood pressure, and the changes that help most.</p>
        <div className="card sample" aria-hidden="true">
          <div className="row"><strong>Type 2 diabetes</strong><strong className="l1">Moderate risk</strong></div>
          <Ruler risk={sample} />
          <p className="mute small">Example result. Yours appears after three short steps.</p>
        </div>
      </section>
      <form onSubmit={submit} className="card">
        <h2>{mode === "login" ? "Sign in" : "Create your account"}</h2>
        {mode === "register" && <label>Name<input value={f.name} onChange={set("name")} autoComplete="name" required /></label>}
        <label>Email<input type="email" value={f.email} onChange={set("email")} autoComplete="email" required /></label>
        <label>Password <span className="mute">(8+ characters)</span><input type="password" minLength={8} value={f.password} onChange={set("password")} autoComplete={mode === "login" ? "current-password" : "new-password"} required /></label>
        {error && <p role="alert" className="err">{error}</p>}
        <button>{mode === "login" ? "Sign in" : "Create account"}</button>
        <button type="button" className="ghost" onClick={() => { setError(""); setMode(mode === "login" ? "register" : "login"); }}>
          {mode === "login" ? "Create an account" : "I already have an account"}
        </button>
        {MOCK && <p className="mute small">Demo mode, no server needed. Try admin@demo.test or clinician@demo.test with password123.</p>}
        <p className="mute small">Your answers are stored to show your history. This is a screening aid, not a diagnosis.</p>
      </form>
    </main>
  );
}

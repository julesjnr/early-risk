import { useState, type FormEvent } from "react";
import { api, type Assessment } from "../api";
import ResultView from "./ResultView";

const init = { age: "", sex: "", h: "", w: "", waist: "", sys: "", act: "1", veg: "1", smoke: "0", fd: "0", fh: "0", gl: "0", bpm: "0" };
const STEPS = ["About you", "Habits", "Health history"];

export default function Assess() {
  const [f, setF] = useState(init);
  const [step, setStep] = useState(0);
  const [res, setRes] = useState<Assessment | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof init) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (step < STEPS.length - 1) { setStep(step + 1); return; }
    setError(""); setBusy(true);
    const n = Number;
    try {
      setRes(await api<Assessment>("/assessments", "POST", {
        age: n(f.age), sex: f.sex, h: n(f.h), w: n(f.w), waist: n(f.waist), sys: f.sys ? n(f.sys) : undefined,
        act: n(f.act), veg: n(f.veg), smoke: n(f.smoke), fd: n(f.fd), fh: n(f.fh), gl: n(f.gl), bpm: n(f.bpm),
      }));
      window.scrollTo({ top: 0 });
    } catch (err) { setError((err as Error).message); } finally { setBusy(false); }
  }

  if (res) return (<><ResultView results={res.results} /><button onClick={() => { setRes(null); setF(init); setStep(0); }}>Start another assessment</button></>);

  return (
    <form onSubmit={submit} className="card">
      <p className="mute small" aria-live="polite">Step {step + 1} of {STEPS.length}</p>
      <progress value={step + 1} max={STEPS.length} aria-hidden="true" />
      <h2>{STEPS[step]}</h2>
      {step === 0 && (
        <div className="grid">
          <label>Age<input type="number" min={18} max={100} value={f.age} onChange={set("age")} required /></label>
          <label>Sex<select value={f.sex} onChange={set("sex")} required><option value="">Select</option><option value="f">Female</option><option value="m">Male</option></select></label>
          <label>Height (cm)<input type="number" min={120} max={230} value={f.h} onChange={set("h")} required /></label>
          <label>Weight (kg)<input type="number" min={30} max={250} step="0.1" value={f.w} onChange={set("w")} required /></label>
          <label>Waist at navel (cm)<input type="number" min={50} max={200} value={f.waist} onChange={set("waist")} required /></label>
          <label>Top blood pressure number <span className="mute">(optional)</span><input type="number" min={80} max={240} value={f.sys} onChange={set("sys")} /></label>
        </div>
      )}
      {step === 1 && (
        <div className="grid">
          <label>Physical activity<select value={f.act} onChange={set("act")}><option value="1">Under 150 min a week</option><option value="0">150 min a week or more</option></select></label>
          <label>Fruit and vegetables<select value={f.veg} onChange={set("veg")}><option value="1">Not every day</option><option value="0">Every day</option></select></label>
          <label>Do you smoke?<select value={f.smoke} onChange={set("smoke")}><option value="0">No</option><option value="1">Yes</option></select></label>
        </div>
      )}
      {step === 2 && (
        <div className="grid">
          <label>Diabetes in family<select value={f.fd} onChange={set("fd")}><option value="0">None</option><option value="3">Grandparent, aunt, uncle or cousin</option><option value="5">Parent, brother or sister</option></select></label>
          <label>Heart disease in family<select value={f.fh} onChange={set("fh")}><option value="0">No</option><option value="1">Yes, a parent or sibling</option></select></label>
          <label>Ever told your blood sugar was high?<select value={f.gl} onChange={set("gl")}><option value="0">No</option><option value="1">Yes</option></select></label>
          <label>Taking blood pressure medicine?<select value={f.bpm} onChange={set("bpm")}><option value="0">No</option><option value="1">Yes</option></select></label>
        </div>
      )}
      {error && <p role="alert" className="err">{error}</p>}
      <div className="step-actions">
        {step > 0 && <button type="button" className="ghost" onClick={() => setStep(step - 1)}>Back</button>}
        <button disabled={busy}>{step < STEPS.length - 1 ? "Next" : busy ? "Working…" : "See my results"}</button>
      </div>
    </form>
  );
}

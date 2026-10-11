// Offline copy of server/src/scoring.ts, used only by the mock API. Keep in sync.
export type Input = {
  age: number; sex: "m" | "f"; h: number; w: number; waist: number; sys?: number;
  act: 0 | 1; veg: 0 | 1; smoke: 0 | 1; fd: 0 | 3 | 5; fh: 0 | 1; gl: 0 | 1; bpm: 0 | 1;
};
export type Factor = { label: string; points: number; tip?: string };
export type Risk = {
  condition: string;
  score: number;
  max: number;
  level: 0 | 1 | 2; // lower, moderate, higher
  bands: [number, number]; // score where moderate and higher start
  factors: Factor[];
};
export type Results = { bmi: number; risks: Risk[]; seeClinician: boolean; tips: string[] };

const TIPS: Record<string, string> = {
  weight: "Aim to lose 5 to 7% of your body weight over several months.",
  waist: "Reduce your waist size through walking and less refined carbs and fried food.",
  act: "Build up to 150 minutes of brisk activity each week.",
  veg: "Add a serving of vegetables or fruit to each meal.",
  smoke: "Stopping smoking is the biggest single step for your heart.",
  bp: "Check your blood pressure regularly and cut back on salt and processed foods.",
  glu: "Ask for a fasting blood sugar or HbA1c test and repeat it yearly.",
  fam: "Screen earlier and more often: blood sugar, blood pressure and cholesterol.",
};

const bracket = (v: number, b: [number, number][]) =>
  b.reduce((p, [t, x]) => (v >= t ? x : p), 0);

function build(condition: string, max: number, bands: [number, number], items: [string, number, string?][]): Risk {
  const factors = items
    .filter(([, p]) => p > 0)
    .map(([label, points, tip]) => ({ label, points, tip }))
    .sort((a, b) => b.points - a.points);
  const score = factors.reduce((a, f) => a + f.points, 0);
  const level = score < bands[0] ? 0 : score < bands[1] ? 1 : 2;
  return { condition, score, max, level, bands, factors };
}

export function assess(i: Input): Results {
  const bmi = i.w / (i.h / 100) ** 2;
  const bmiL = bmi >= 30 ? 2 : bmi >= 25 ? 1 : 0;
  const wl = i.sex === "m" ? (i.waist > 102 ? 2 : i.waist >= 94 ? 1 : 0) : i.waist > 88 ? 2 : i.waist >= 80 ? 1 : 0;
  const sys = i.sys ?? 0;

  const diabetes = build("Type 2 diabetes", 26, [9, 15], [
    ["age", bracket(i.age, [[0, 0], [45, 2], [55, 3], [65, 4]])],
    ["weight", [0, 1, 3][bmiL], "weight"],
    ["waist size", [0, 3, 4][wl], "waist"],
    ["low activity", i.act * 2, "act"],
    ["few fruit and vegetables", i.veg, "veg"],
    ["blood pressure medicine", i.bpm * 2, "bp"],
    ["past high blood sugar", i.gl * 5, "glu"],
    ["family history", i.fd, "fam"],
  ]);
  const heart = build("Heart disease", 16, [5, 10], [
    ["age", bracket(i.age, [[0, 0], [40, 1], [55, 2], [65, 3]])],
    ["male sex", i.sex === "m" ? 1 : 0],
    ["smoking", i.smoke * 3, "smoke"],
    ["weight", bmiL === 2 ? 1 : 0, "weight"],
    ["blood pressure", sys ? bracket(sys, [[0, 0], [120, 1], [140, 2], [160, 3]]) : 0, "bp"],
    ["low activity", i.act, "act"],
    ["family history", i.fh * 2, "fam"],
    ["high blood sugar", i.gl * 2, "glu"],
  ]);
  const pressure = build("High blood pressure", 12, [3, 7], [
    ["age", bracket(i.age, [[0, 0], [40, 1], [55, 2], [65, 3]])],
    ["weight", [0, 1, 2][bmiL], "weight"],
    ["waist size", wl === 2 ? 1 : 0, "waist"],
    ["low activity", i.act, "act"],
    ["smoking", i.smoke, "smoke"],
    ["blood pressure reading", sys ? bracket(sys, [[0, 0], [120, 1], [130, 2], [140, 4]]) : 0, "bp"],
  ]);

  const risks = [diabetes, heart, pressure];
  const tipKeys = new Set(risks.flatMap((r) => r.factors.map((f) => f.tip).filter(Boolean) as string[]));
  return {
    bmi: Math.round(bmi * 10) / 10,
    risks,
    seeClinician: risks.some((r) => r.level === 2) || sys >= 160,
    tips: [...tipKeys].map((k) => TIPS[k]),
  };
}

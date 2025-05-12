

const { getRelationship } = require("./src/relationship-utils"); 
const crypto = require("crypto");

const rnd = (n) => crypto.randomInt(0, n);
const genders = ["male", "female", "other"];

function genSyntheticTree(N) {
  const g = {};
  const pairs = [];

  // root
  g["P0"] = { id: "P0", gender: genders[rnd(3)], parents: [], spouses: [] };

  for (let i = 1; i < N; ++i) {
    const id = "P" + i;
    const gender = genders[rnd(3)];

    // randomly pick two parents among existing adults
    const adults = Object.keys(g).filter((k) => g[k].parents.length === 0);
    const mom = adults[rnd(adults.length)];
    let dad = adults[rnd(adults.length)];
    while (dad === mom && adults.length > 1) dad = adults[rnd(adults.length)];

    g[id] = { id, gender, parents: [mom, dad], spouses: [] };

    // mark parents married
    if (!g[mom].spouses.includes(dad)) {
      g[mom].spouses.push(dad);
      g[dad].spouses.push(mom);
    }

    // ground-truth pair for accuracy
    const label =
      gender === "male" ? "son" : gender === "female" ? "daughter" : "child";
    pairs.push({ a: mom, b: id, label });
    pairs.push({ a: dad, b: id, label });
  }
  return { graph: g, pairsToCheck: pairs };
}

function benchmark(graph, nQueries) {
  const ids = Object.keys(graph);
  let total = 0n;
  const samples = [];

  for (let i = 0; i < nQueries; ++i) {
    const a = ids[rnd(ids.length)];
    let b = ids[rnd(ids.length)];
    while (b === a) b = ids[rnd(ids.length)];

    const t0 = process.hrtime.bigint();
    getRelationship(a, b, graph);
    const dt = process.hrtime.bigint() - t0;
    total += dt;
    samples.push(Number(dt));
  }
  samples.sort((x, y) => x - y);
  return {
    mean: Number(total / BigInt(nQueries)) / 1e6,          // ms
    p95: samples[Math.floor(0.95 * samples.length)] / 1e6  // ms
  };
}

function accuracy(pairs, graph) {
  let correct = 0;
  for (const { a, b, label } of pairs) {
    const ans = getRelationship(a, b, graph).toLowerCase();
    if (ans.includes(label)) correct++;
  }
  return (100 * correct) / pairs.length;
}

// ───── experiment plan ─────────────────────────────────────────────
const EXPERIMENTS = [
  { size: 3, queries: 1000, checkAcc: true },
  { size: 20, queries: 1500, checkAcc: true },
  { size: 50, queries: 2000, checkAcc: true },
  { size: 100, queries: 2500, checkAcc: true },
  { size: 200, queries: 2500, checkAcc: true },
  { size: 300, queries: 2500, checkAcc: true },
  { size: 400, queries: 2500, checkAcc: true },
  { size: 500, queries: 3000, checkAcc: false },
  { size: 1000, queries: 4000, checkAcc: false },
  { size: 2000, queries: 5000, checkAcc: false }
];

// ───── run all experiments ─────────────────────────────────────────
(async () => {
  console.log("\n╔════════ Evaluation ═════════════════════════════════╗");
  console.log("║ Tree Size │   Qry Mean (ms) │  p95 (ms) │ Accuracy ║");
  console.log("╠═══════════╪═════════════════╪═══════════╪══════════╣");

  for (const exp of EXPERIMENTS) {
    // build synthetic tree
    const tree = exp.size === 2
      ? {
          graph: {
            A: { id: "A", gender: "male", parents: [], spouses: [] },
            B: { id: "B", gender: "female", parents: ["A"], spouses: [] }
          },
          pairsToCheck: [{ a: "A", b: "B", label: "child" }]
        }
      : genSyntheticTree(exp.size);

    const t = benchmark(tree.graph, exp.queries);
    const acc = exp.checkAcc
      ? accuracy(tree.pairsToCheck, tree.graph).toFixed(0) + "%"
      : "   —   ";

    console.log(
      `║ ${exp.size.toString().padStart(6)}    │ ${t.mean
        .toFixed(3)
        .padStart(9)}      │ ${t.p95.toFixed(3).padStart(7)}   │ ${acc.padEnd(
        7
      )} ║`
    );
  }
  console.log("╚═════════════════════════════════════════════════════╝\n");
})();

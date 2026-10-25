// Financial impact. Ported from the original financialCalculations.js, which
// had the right rules: client figures first, labelled benchmarks second, and
// never an invented exit probability.
// Replacement benchmarks by role for Hancock Health (recruiting, onboarding,
// orientation and ramp-up to full productivity). Physician and nurse practitioner
// figures are labelled estimates (physician replacement is commonly put at
// $500,000 to $1 million). The staff RN figure is the
// national average cost of losing one staff RN from the 2025 NSI National
// Health Care Retention & RN Staffing Report ($61,110). The other roles are
// labelled estimates. A job class takes the FIRST role it matches, so specific
// patterns come before general ones (Nutrition Tech and Lab Tech before "tech").
// Every figure is editable on the Financial impact tab and always labelled as a
// benchmark, never as a client figure.
export const DEFAULT_FINANCIAL = {
  benchmarkReplacementMin: 8000,
  benchmarkReplacementMax: 15000,
  benchmarkLabel: 'Industry benchmark',
  productivityPercentOfSalary: 18,
  roleBenchmarks: [
    { key: 'app', label: 'Nurse Practitioner (estimate)', pattern: 'practitioner|physician assistant|\\bnp\\b', cost: 85000 },
    { key: 'physician', label: 'Physician (estimate)', pattern: 'physician|hospitalist|\\bmd\\b', cost: 500000 },
    { key: 'rn', label: 'Staff RN (NSI 2025)', pattern: 'nurse rn|\\brn\\b|registered nurse', cost: 61110 },
    { key: 'lpn', label: 'LPN', pattern: '\\blpn\\b', cost: 25000 },
    { key: 'rt', label: 'Respiratory Therapist', pattern: 'resp', cost: 30000 },
    { key: 'imaging', label: 'Imaging Technologist', pattern: 'ct tech|rad tech|radiolog|ultrasound|sonograph|imaging|mri', cost: 25000 },
    { key: 'surgery', label: 'Surgical Technologist', pattern: 'surg', cost: 20000 },
    { key: 'pharmacy', label: 'Pharmacy Technician', pattern: 'pharm', cost: 12000 },
    { key: 'lab', label: 'Lab Technician', pattern: 'lab', cost: 10000 },
    { key: 'ma', label: 'Medical Assistant', pattern: 'medical asst|medical assistant', cost: 10000 },
    { key: 'nutrition', label: 'Nutrition Technician', pattern: 'nutr|dietary|food', cost: 6000 },
    { key: 'pct', label: 'Patient Care / ER Tech', pattern: 'tech|cna|nursing assistant', cost: 9000 },
    { key: 'evs', label: 'Housekeeping (EVS)', pattern: 'housekeep|environmental', cost: 6000 },
    { key: 'access', label: 'Patient Access', pattern: 'access|registration', cost: 8000 },
    { key: 'reception', label: 'Reception', pattern: 'recept', cost: 7000 },
    { key: 'chaplain', label: 'Chaplain Assistant', pattern: 'chaplain', cost: 8000 },
    { key: 'safety', label: 'Public Safety', pattern: 'sfty|safety|security', cost: 8000 },
    { key: 'fitness', label: 'Wellness / Fitness', pattern: 'instr|trainer|training|fitness', cost: 5000 },
  ],
};

export function roleBenchmark(jobClass, cfg) {
  const jc = String(jobClass || '');
  return (cfg.roleBenchmarks || []).find((b) => b.cost > 0 && new RegExp(b.pattern, 'i').test(jc)) || null;
}

const has = (v) => typeof v === 'number' && Number.isFinite(v) && v > 0;

export function potentialLoss(emp, cfg) {
  const f = emp.financials || {};
  const replacement = has(f.replacementCost)
    ? { value: f.replacementCost, source: 'client', label: 'Client role cost' }
    : (() => {
      const role = roleBenchmark(emp.jobClass, cfg);
      return role
        ? { value: role.cost, source: 'benchmark', label: `${cfg.benchmarkLabel}: ${role.label}` }
        : { value: (cfg.benchmarkReplacementMin + cfg.benchmarkReplacementMax) / 2, source: 'benchmark', label: cfg.benchmarkLabel };
    })();
  const vacancy = has(f.vacancyDays) && has(f.dailyLoadedLaborCost)
    ? { value: f.vacancyDays * f.dailyLoadedLaborCost, source: 'client', label: `${f.vacancyDays} days x $${f.dailyLoadedLaborCost}/day` }
    : { value: 0, source: 'unavailable', label: 'Not supplied' };
  const overtime = has(f.overtimeOrContractCost)
    ? { value: f.overtimeOrContractCost, source: 'client', label: 'Client overtime/contract cost' }
    : { value: 0, source: 'unavailable', label: 'Not supplied' };
  const productivity = has(f.productivityDisruptionCost)
    ? { value: f.productivityDisruptionCost, source: 'client', label: 'Client productivity cost' }
    : has(f.annualSalary)
      ? { value: f.annualSalary * (cfg.productivityPercentOfSalary / 100), source: 'benchmark', label: `${cfg.productivityPercentOfSalary}% of salary (benchmark)` }
      : { value: 0, source: 'unavailable', label: 'Not supplied' };
  const parts = { replacement, vacancy, overtime, productivity };
  const total = Object.values(parts).reduce((a, p) => a + p.value, 0);
  return { total, parts, usesBenchmark: Object.values(parts).some((p) => p.source === 'benchmark') };
}

export function aggregate(rows, cfg) {
  const scored = rows.filter((r) => r.status === 'done');
  const enriched = scored.map((r) => ({ row: r, loss: potentialLoss(r, cfg) }));
  const atRisk = enriched.filter((e) => e.row.band === 'At risk');
  const watch = enriched.filter((e) => e.row.band === 'Watch');
  const sum = (arr) => arr.reduce((a, e) => a + e.loss.total, 0);
  const group = (keyFn) => {
    const g = {};
    enriched.forEach((e) => {
      const k = keyFn(e.row) || 'Unspecified';
      g[k] = g[k] || { key: k, count: 0, atRisk: 0, exposure: 0 };
      g[k].count++;
      if (e.row.band === 'At risk') { g[k].atRisk++; g[k].exposure += e.loss.total; }
    });
    return Object.values(g).sort((a, b) => b.exposure - a.exposure || b.atRisk - a.atRisk);
  };
  return {
    scored: scored.length,
    atRiskCount: atRisk.length,
    watchCount: watch.length,
    atRiskExposure: sum(atRisk),
    watchExposure: sum(watch),
    avgLoss: enriched.length ? sum(enriched) / enriched.length : 0,
    usesBenchmark: enriched.some((e) => e.loss.usesBenchmark),
    byDepartment: group((r) => r.department),
    byJobClass: group((r) => r.jobClass),
    atRisk,
  };
}

export const shortMoney = (v) => (v >= 1e6 ? `$${(v / 1e6).toFixed(1)}M` : v >= 1e3 ? `$${Math.round(v / 1e3)}K` : `$${Math.round(v)}`);

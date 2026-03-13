"use client";
import { useState, useEffect, useCallback, useRef } from "react";

const defaultInputs = {
  purchasePrice: 250000,
  downPaymentPct: 20,
  closingCostPct: 3,
  mortgageRate: 4.5,
  amortYears: 25,
  egressWindows: 8000,
  partitionWalls: 3000,
  basementCosmetic: 1500,
  permits: 500,
  contingencyPct: 15,
  numRooms: 5,
  rentPerRoom: 600,
  vacancyPct: 5,
  propertyTaxAnnual: 2965,
  insurance: 150,
  utilities: 700,
  maintenance: 200,
  pmPct: 10,
};

function fmt(n) {
  if (n === undefined || n === null || isNaN(n)) return "$0";
  return (
    (n < 0 ? "\u2212" : "") +
    "$" +
    Math.abs(Math.round(n))
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  );
}

function pct(n) {
  if (n === undefined || n === null || isNaN(n)) return "0.0%";
  return (n * 100).toFixed(1) + "%";
}

function pmt(rate, nper, pv) {
  if (rate === 0) return pv / nper;
  return (pv * rate * Math.pow(1 + rate, nper)) / (Math.pow(1 + rate, nper) - 1);
}

function calc(i) {
  const downPayment = i.purchasePrice * (i.downPaymentPct / 100);
  const mortgage = i.purchasePrice - downPayment;
  const closingCosts = i.purchasePrice * (i.closingCostPct / 100);
  const renoSubtotal =
    i.egressWindows + i.partitionWalls + i.basementCosmetic + i.permits;
  const contingency = renoSubtotal * (i.contingencyPct / 100);
  const totalReno = renoSubtotal + contingency;
  const totalCashIn = downPayment + closingCosts + totalReno;
  const monthlyRate = i.mortgageRate / 100 / 12;
  const nPayments = i.amortYears * 12;
  const monthlyMortgage = pmt(monthlyRate, nPayments, mortgage);
  const grossRent = i.numRooms * i.rentPerRoom;
  const egi = grossRent * (1 - i.vacancyPct / 100);
  const propTaxMo = i.propertyTaxAnnual / 12;
  const pmFee = grossRent * (i.pmPct / 100);
  const totalExpenses =
    monthlyMortgage + propTaxMo + i.insurance + i.utilities + i.maintenance + pmFee;
  const monthlyCF = egi - totalExpenses;
  const annualCF = monthlyCF * 12;
  const noi =
    (egi - propTaxMo - i.insurance - i.utilities - i.maintenance - pmFee) * 12;
  const capRate = noi / (i.purchasePrice + totalReno);
  const coc = annualCF / totalCashIn;
  const dscr = noi / 12 / monthlyMortgage;
  const breakeven = totalExpenses / grossRent;
  const cfPerDoor = monthlyCF / i.numRooms;
  const grm = (i.purchasePrice + totalReno) / (grossRent * 12);

  return {
    downPayment, mortgage, closingCosts, totalReno, contingency,
    totalCashIn, monthlyMortgage, grossRent, egi, propTaxMo, pmFee,
    totalExpenses, monthlyCF, annualCF, noi, capRate, coc, dscr,
    breakeven, cfPerDoor, grm,
  };
}

/* -- Components ------------------------------------------------ */

function InputRow({ label, field, inputs, onChange, prefix = "$", suffix = "", step = 1, note }) {
  return (
    <div className="input-row">
      <div className="input-label-wrap">
        <div className="input-label">{label}</div>
        {note && <div className="input-note">{note}</div>}
      </div>
      <div className="input-field">
        {prefix && <span className="input-affix">{prefix}</span>}
        <input
          type="number"
          value={inputs[field]}
          onChange={(e) => onChange(field, parseFloat(e.target.value) || 0)}
          step={step}
        />
        {suffix && <span className="input-affix">{suffix}</span>}
      </div>
    </div>
  );
}

function ResultRow({ label, value, highlight, note }) {
  const colorClass = highlight
    ? typeof value === "string" && value.startsWith("\u2212") ? "c-red" : "c-green"
    : "c-default";
  return (
    <div className="result-row">
      <div className="input-label-wrap">
        <div className="result-label">{label}</div>
        {note && <div className="result-note">{note}</div>}
      </div>
      <span className={`result-value ${colorClass}`}>{value}</span>
    </div>
  );
}

function MetricCard({ label, value, color, sub }) {
  return (
    <div className="metric-card">
      <div className="metric-label">{label}</div>
      <div className="metric-value" style={{ color }}>{value}</div>
      {sub && <div className="metric-sub">{sub}</div>}
    </div>
  );
}

function Section({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="section">
      <div className="section-header" onClick={() => setOpen(!open)}>
        <span className="section-title">{title}</span>
        <span className="section-toggle">{open ? "\u2212" : "+"}</span>
      </div>
      {open && <div className="section-body">{children}</div>}
    </div>
  );
}

function SensitivityTable({ inputs }) {
  const rents = [500, 550, 600, 650, 700, 750];
  return (
    <div style={{ overflowX: "auto" }}>
      <table className="sens-table">
        <thead>
          <tr>
            <th>Rent / Room</th>
            <th>Monthly CF</th>
            <th>Annual CF</th>
            <th>CoC Return</th>
          </tr>
        </thead>
        <tbody>
          {rents.map((rent) => {
            const modified = { ...inputs, rentPerRoom: rent };
            const r = calc(modified);
            const isActive = rent === inputs.rentPerRoom;
            return (
              <tr key={rent} className={isActive ? "active-row" : ""}>
                <td style={{ color: isActive ? undefined : "var(--text-secondary)" }}>{fmt(rent)}</td>
                <td style={{ color: isActive ? undefined : r.monthlyCF >= 0 ? "var(--green)" : "var(--red)" }}>
                  {fmt(r.monthlyCF)}
                </td>
                <td style={{ color: isActive ? undefined : r.annualCF >= 0 ? "var(--green)" : "var(--red)" }}>
                  {fmt(r.annualCF)}
                </td>
                <td style={{ color: isActive ? undefined : "var(--text-secondary)" }}>
                  {pct(r.coc)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* -- Main ------------------------------------------------------- */

const POLL_INTERVAL = 3000;

export default function Calculator() {
  const [inputs, setInputs] = useState(defaultInputs);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [lastSavedBy, setLastSavedBy] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [syncStatus, setSyncStatus] = useState("connecting");
  const lastSaveTimestamp = useRef(null);
  const isSaving = useRef(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/data");
        if (res.ok) {
          const data = await res.json();
          if (data.inputs) {
            setInputs((prev) => ({ ...prev, ...data.inputs }));
            setLastSaved(data.savedAt);
            setLastSavedBy(data.savedBy);
            lastSaveTimestamp.current = data.savedAt;
          }
          setSyncStatus("connected");
        }
      } catch {
        setSyncStatus("offline");
      }
      setLoaded(true);
    }
    load();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const interval = setInterval(async () => {
      if (isSaving.current) return;
      try {
        const res = await fetch("/api/data");
        if (res.ok) {
          const data = await res.json();
          if (data.savedAt && data.savedAt !== lastSaveTimestamp.current) {
            if (data.inputs) {
              setInputs((prev) => ({ ...prev, ...data.inputs }));
              setLastSaved(data.savedAt);
              setLastSavedBy(data.savedBy);
              lastSaveTimestamp.current = data.savedAt;
            }
          }
          setSyncStatus("connected");
        }
      } catch {
        setSyncStatus("offline");
      }
    }, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [loaded]);

  const save = useCallback(async (newInputs) => {
    setSaving(true);
    isSaving.current = true;
    try {
      const res = await fetch("/api/data", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inputs: newInputs, savedBy: "web" }),
      });
      if (res.ok) {
        const data = await res.json();
        setLastSaved(data.savedAt);
        setLastSavedBy(data.savedBy);
        lastSaveTimestamp.current = data.savedAt;
        setSyncStatus("connected");
      }
    } catch {
      setSyncStatus("offline");
    }
    isSaving.current = false;
    setSaving(false);
  }, []);

  const onChange = useCallback(
    (field, value) => {
      const newInputs = { ...inputs, [field]: value };
      setInputs(newInputs);
      save(newInputs);
    },
    [inputs, save]
  );

  if (!loaded) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "var(--text-muted)", fontSize: 14 }}>Loading...</div>
      </div>
    );
  }

  const r = calc(inputs);

  const syncColors = { connected: "var(--green)", offline: "var(--red)", connecting: "var(--yellow)" };
  const syncLabels = { connected: "Synced", offline: "Offline", connecting: "Connecting..." };

  return (
    <div className="app-container">
      <div className="header">
        <div className="header-label">Investment Analysis</div>
        <h1 className="header-title">23 Hamel St, St. John&apos;s, NL</h1>
        <div className="header-sub">5-Bed Conversion &middot; Single Dwelling &middot; 1,716 sqft &middot; Built 1949 &middot; Rabbittown near MUN</div>
        <div className="header-sub">3 bedrooms upstairs (existing windows) + 2 bedrooms in basement (egress windows needed)</div>
        <a className="header-link" href="https://www.redfin.ca/nl/st-john-s/23-Hamel-St-A1C-5A3/home/158595475" target="_blank" rel="noopener noreferrer">View Listing on Redfin &rarr;</a>
        <div className="header-sync">
          <span className="sync-dot" style={{ background: syncColors[syncStatus] }} />
          <span>
            {syncLabels[syncStatus]}
            {saving && " \u2014 saving..."}
            {lastSaved && !saving && ` \u00b7 Last edit ${new Date(lastSaved).toLocaleString()}`}
          </span>
        </div>
      </div>

      <div className="photo-gallery">
        <img src="/photos/photo1.png" alt="23 Hamel St - Front" />
        <img src="/photos/photo2.png" alt="23 Hamel St - Interior" />
        <img src="/photos/photo3.png" alt="23 Hamel St - Detail" />
      </div>

      <div className="metrics-grid">
        <MetricCard label="Monthly CF" value={fmt(r.monthlyCF)} color={r.monthlyCF >= 0 ? "var(--green)" : "var(--red)"} sub="After all expenses" />
        <MetricCard label="Annual CF" value={fmt(r.annualCF)} color={r.annualCF >= 0 ? "var(--green)" : "var(--red)"} sub="12-month total" />
        <MetricCard label="Cash-on-Cash" value={pct(r.coc)} color={r.coc >= 0.05 ? "var(--green)" : r.coc >= 0 ? "var(--yellow)" : "var(--red)"} sub="Annual CF / Cash In" />
        <MetricCard label="Total Cash In" value={fmt(r.totalCashIn)} color="var(--accent)" sub="Down + closing + reno" />
      </div>

      <div className="two-col">
        <div>
          <Section title="Purchase Assumptions">
            <InputRow label="Purchase Price" field="purchasePrice" inputs={inputs} onChange={onChange} step={5000} />
            <InputRow label="Down Payment %" field="downPaymentPct" inputs={inputs} onChange={onChange} prefix="" suffix="%" step={5} />
            <ResultRow label="Down Payment $" value={fmt(r.downPayment)} />
            <InputRow label="Closing Costs (est. 3%)" field="closingCostPct" inputs={inputs} onChange={onChange} prefix="" suffix="%" step={0.5} note="Legal, inspection, land transfer" />
            <InputRow label="Mortgage Rate (5yr fixed)" field="mortgageRate" inputs={inputs} onChange={onChange} prefix="" suffix="%" step={0.1} />
            <InputRow label="Amortization (years)" field="amortYears" inputs={inputs} onChange={onChange} prefix="" suffix="yr" step={5} />
            <ResultRow label="Monthly Mortgage Payment (P&I)" value={fmt(r.monthlyMortgage)} />
            <ResultRow label="Mortgage Amount" value={fmt(r.mortgage)} />
          </Section>

          <Section title="Renovation Budget" defaultOpen={false}>
            <InputRow label="2 Egress Windows (cut concrete + install)" field="egressWindows" inputs={inputs} onChange={onChange} step={500} note="~$3K–$5K each, 2 basement bedrooms" />
            <InputRow label="Partition Walls (close off BR3 from kitchen + living)" field="partitionWalls" inputs={inputs} onChange={onChange} step={500} note="Two walls to enclose bedroom from open-concept area" />
            <InputRow label="Basement Cosmetic (paint, minor flooring)" field="basementCosmetic" inputs={inputs} onChange={onChange} step={500} note="Rooms already walled off" />
            <InputRow label="Permits" field="permits" inputs={inputs} onChange={onChange} step={100} />
            <InputRow label="Contingency" field="contingencyPct" inputs={inputs} onChange={onChange} prefix="" suffix="%" step={5} />
            <ResultRow label="Total Renovation" value={fmt(r.totalReno)} />
          </Section>

          <Section title="Total Cash Required" defaultOpen={false}>
            <ResultRow label="Down Payment" value={fmt(r.downPayment)} />
            <ResultRow label="Closing Costs" value={fmt(r.closingCosts)} />
            <ResultRow label="Renovation" value={fmt(r.totalReno)} />
            <ResultRow label="Total Cash In" value={fmt(r.totalCashIn)} />
          </Section>

          <Section title="Monthly Income">
            <InputRow label="Number of Rooms" field="numRooms" inputs={inputs} onChange={onChange} prefix="" suffix="rooms" step={1} />
            <InputRow label="Rent per Room (utilities included)" field="rentPerRoom" inputs={inputs} onChange={onChange} step={25} />
            <InputRow label="Vacancy Rate" field="vacancyPct" inputs={inputs} onChange={onChange} prefix="" suffix="%" step={1} note="Near MUN – strong tenant demand" />
            <ResultRow label="Gross Monthly Rent" value={fmt(r.grossRent)} />
            <ResultRow label="Effective Gross Income (EGI)" value={fmt(r.egi)} />
          </Section>

          <Section title="Monthly Operating Expenses">
            <ResultRow label="Mortgage (P&I)" value={fmt(r.monthlyMortgage)} />
            <InputRow label="Property Tax (annual)" field="propertyTaxAnnual" inputs={inputs} onChange={onChange} step={100} note="About $247/mo – city tax + water" />
            <InputRow label="Insurance" field="insurance" inputs={inputs} onChange={onChange} step={10} />
            <InputRow label="Utilities (heat/electric) – included in rent" field="utilities" inputs={inputs} onChange={onChange} step={25} note="Baseboard electric; you absorb this" />
            <InputRow label="Maintenance & CapEx Reserve" field="maintenance" inputs={inputs} onChange={onChange} step={25} note="1949 build – budget conservatively" />
            <InputRow label="Property Management (10% of gross per room)" field="pmPct" inputs={inputs} onChange={onChange} prefix="" suffix="%" step={1} note="Your existing PM arrangement" />
            <ResultRow label="Total Monthly Expenses" value={fmt(r.totalExpenses)} />
          </Section>
        </div>

        <div>
          <Section title="Cash Flow">
            <ResultRow label="Monthly Cash Flow" value={fmt(r.monthlyCF)} highlight />
            <ResultRow label="Annual Cash Flow" value={fmt(r.annualCF)} highlight />
          </Section>

          <Section title="Key Metrics">
            <ResultRow label="Cap Rate" value={pct(r.capRate)} note="NOI / Total Cost (purchase + reno)" />
            <ResultRow label="Cash-on-Cash Return" value={pct(r.coc)} note="Annual CF / Total Cash In" />
            <ResultRow label="DSCR (Debt Service Coverage)" value={r.dscr.toFixed(2) + "x"} note="NOI / Debt Service; >1.2x = healthy" />
            <ResultRow label="Gross Rent Multiplier" value={r.grm.toFixed(1) + "x"} />
            <ResultRow label="Break-even Occupancy" value={pct(r.breakeven)} note="Expenses / Gross Rent" />
            <ResultRow label="Monthly CF per Door" value={fmt(r.cfPerDoor)} />
          </Section>

          <Section title="Sensitivity – What If Rent Per Room Changes?">
            <SensitivityTable inputs={inputs} />
          </Section>
        </div>
      </div>
    </div>
  );
}

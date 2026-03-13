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
    (n < 0 ? "-" : "") +
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

/* ── UI Components ─────────────────────────────────────────── */

function InputRow({ label, field, inputs, onChange, prefix = "$", suffix = "", step = 1, note }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2, padding: "8px 0", borderBottom: "1px solid #1a1a2e" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 13, color: "#8892a4", flex: 1 }}>{label}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 2, background: "#12121f", borderRadius: 6, padding: "4px 8px", border: "1px solid #2a2a4a" }}>
          {prefix && <span style={{ fontSize: 13, color: "#4a6fa5" }}>{prefix}</span>}
          <input
            type="number"
            value={inputs[field]}
            onChange={(e) => onChange(field, parseFloat(e.target.value) || 0)}
            step={step}
            style={{
              background: "transparent", border: "none", color: "#6cb4ee",
              fontSize: 14, width: 80, textAlign: "right", outline: "none",
              fontFamily: "'JetBrains Mono', 'SF Mono', monospace", fontWeight: 600,
            }}
          />
          {suffix && <span style={{ fontSize: 13, color: "#4a6fa5" }}>{suffix}</span>}
        </div>
      </div>
      {note && <span style={{ fontSize: 11, color: "#444a5a", marginTop: 1 }}>{note}</span>}
    </div>
  );
}

function MetricCard({ label, value, color = "#6cb4ee", sub }) {
  return (
    <div style={{
      background: "#12121f", borderRadius: 8, padding: "10px 12px",
      border: "1px solid #1a1a2e", flex: "1 1 45%", minWidth: 130,
    }}>
      <div style={{ fontSize: 11, color: "#555d70", textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, color, fontFamily: "'JetBrains Mono', monospace", marginTop: 2 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "#444a5a", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function Section({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: 12 }}>
      <div
        onClick={() => setOpen(!open)}
        style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "10px 14px", background: "#161628", borderRadius: open ? "8px 8px 0 0" : 8,
          cursor: "pointer", userSelect: "none", borderBottom: open ? "1px solid #2a2a4a" : "none",
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 700, color: "#8892a4", textTransform: "uppercase", letterSpacing: 1 }}>{title}</span>
        <span style={{ color: "#4a6fa5", fontSize: 14 }}>{open ? "−" : "+"}</span>
      </div>
      {open && (
        <div style={{ background: "#0d0d1a", padding: "4px 14px 10px", borderRadius: "0 0 8px 8px" }}>
          {children}
        </div>
      )}
    </div>
  );
}

function SensitivityTable({ inputs }) {
  const rents = [500, 550, 600, 650, 700, 750];
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #2a2a4a" }}>
            <th style={{ padding: "8px 6px", textAlign: "left", color: "#555d70", fontWeight: 600, fontSize: 11 }}>RENT/ROOM</th>
            <th style={{ padding: "8px 6px", textAlign: "right", color: "#555d70", fontWeight: 600, fontSize: 11 }}>MO CF</th>
            <th style={{ padding: "8px 6px", textAlign: "right", color: "#555d70", fontWeight: 600, fontSize: 11 }}>YR CF</th>
          </tr>
        </thead>
        <tbody>
          {rents.map((rent) => {
            const modified = { ...inputs, rentPerRoom: rent };
            const r = calc(modified);
            const isActive = rent === inputs.rentPerRoom;
            return (
              <tr key={rent} style={{ borderBottom: "1px solid #111122", background: isActive ? "#1a1a3a" : "transparent" }}>
                <td style={{ padding: "7px 6px", color: isActive ? "#6cb4ee" : "#8892a4", fontFamily: "monospace", fontWeight: isActive ? 700 : 400 }}>{fmt(rent)}</td>
                <td style={{ padding: "7px 6px", textAlign: "right", fontFamily: "monospace", fontWeight: isActive ? 700 : 400, color: r.monthlyCF >= 0 ? "#4ade80" : "#f87171" }}>{fmt(r.monthlyCF)}</td>
                <td style={{ padding: "7px 6px", textAlign: "right", fontFamily: "monospace", fontWeight: isActive ? 700 : 400, color: r.annualCF >= 0 ? "#4ade80" : "#f87171" }}>{fmt(r.annualCF)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ResultRow({ label, value, highlight, note }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: "1px solid #111122" }}>
      <div style={{ flex: 1 }}>
        <span style={{ fontSize: 13, color: "#8892a4" }}>{label}</span>
        {note && <span style={{ fontSize: 11, color: "#444a5a", display: "block" }}>{note}</span>}
      </div>
      <span style={{
        fontSize: 14, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace",
        color: highlight ? (typeof value === "string" && value.startsWith("-") ? "#f87171" : "#4ade80") : "#c8d0e0",
      }}>{value}</span>
    </div>
  );
}

/* ── Main App ──────────────────────────────────────────────── */

const POLL_INTERVAL = 3000; // sync every 3 seconds

export default function Calculator() {
  const [inputs, setInputs] = useState(defaultInputs);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [lastSavedBy, setLastSavedBy] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [syncStatus, setSyncStatus] = useState("connecting");
  const lastSaveTimestamp = useRef(null);
  const isSaving = useRef(false);

  // Load data from API on mount
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

  // Poll for changes from other users
  useEffect(() => {
    if (!loaded) return;

    const interval = setInterval(async () => {
      if (isSaving.current) return; // don't poll while saving
      try {
        const res = await fetch("/api/data");
        if (res.ok) {
          const data = await res.json();
          if (data.savedAt && data.savedAt !== lastSaveTimestamp.current) {
            // Someone else saved - update our state
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

  // Save to API
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
      <div style={{ minHeight: "100vh", background: "#0a0a14", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#4a6fa5", fontSize: 14 }}>Loading...</div>
      </div>
    );
  }

  const r = calc(inputs);

  const syncDot = {
    connected: "#4ade80",
    offline: "#f87171",
    connecting: "#fbbf24",
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#0a0a14", color: "#c8d0e0",
      fontFamily: "'Inter', -apple-system, sans-serif", maxWidth: 480,
      margin: "0 auto", padding: "0 0 40px",
    }}>
      {/* Header */}
      <div style={{ padding: "20px 16px 12px", borderBottom: "1px solid #1a1a2e" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#4a6fa5", textTransform: "uppercase", letterSpacing: 1.5 }}>Investment Analysis</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: "#e2e8f0", marginTop: 4 }}>23 Hamel St, St. John&apos;s</div>
        <div style={{ fontSize: 12, color: "#555d70", marginTop: 2 }}>5-bed single dwelling &mdash; 3 up / 2 down &mdash; near MUN</div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
          <span style={{
            width: 8, height: 8, borderRadius: "50%",
            background: syncDot[syncStatus] || "#fbbf24",
            display: "inline-block",
          }} />
          <span style={{ fontSize: 11, color: "#555d70" }}>
            {syncStatus === "connected" && "Synced"}
            {syncStatus === "offline" && "Offline — changes saved locally"}
            {syncStatus === "connecting" && "Connecting..."}
            {saving && " — Saving..."}
          </span>
        </div>
        <div style={{ fontSize: 11, color: "#333a4a", marginTop: 4 }}>
          {lastSaved
            ? `Last updated ${new Date(lastSaved).toLocaleString()}${lastSavedBy ? ` by ${lastSavedBy}` : ""}`
            : "No saved data yet"}
          {" "}<span style={{ color: "#4a6fa5" }}>— changes sync automatically</span>
        </div>
      </div>

      {/* Key Metrics */}
      <div style={{ padding: "14px 16px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <MetricCard label="Monthly CF" value={fmt(r.monthlyCF)} color={r.monthlyCF >= 0 ? "#4ade80" : "#f87171"} sub="After all expenses" />
          <MetricCard label="Annual CF" value={fmt(r.annualCF)} color={r.annualCF >= 0 ? "#4ade80" : "#f87171"} sub="12-month total" />
          <MetricCard label="Cash-on-Cash" value={pct(r.coc)} color={r.coc >= 0.05 ? "#4ade80" : r.coc >= 0 ? "#fbbf24" : "#f87171"} sub="Annual CF / Cash In" />
          <MetricCard label="Total Cash In" value={fmt(r.totalCashIn)} color="#6cb4ee" sub="Down + close + reno" />
        </div>
      </div>

      {/* Sections */}
      <div style={{ padding: "0 16px" }}>

        <Section title="Purchase">
          <InputRow label="Purchase Price" field="purchasePrice" inputs={inputs} onChange={onChange} step={5000} />
          <InputRow label="Down Payment" field="downPaymentPct" inputs={inputs} onChange={onChange} prefix="" suffix="%" step={5} />
          <InputRow label="Closing Costs" field="closingCostPct" inputs={inputs} onChange={onChange} prefix="" suffix="%" step={0.5} />
          <InputRow label="Mortgage Rate" field="mortgageRate" inputs={inputs} onChange={onChange} prefix="" suffix="%" step={0.1} />
          <InputRow label="Amortization" field="amortYears" inputs={inputs} onChange={onChange} prefix="" suffix="yr" step={5} />
          <ResultRow label="Monthly Mortgage" value={fmt(r.monthlyMortgage)} />
          <ResultRow label="Mortgage Amount" value={fmt(r.mortgage)} />
        </Section>

        <Section title="Renovation" defaultOpen={false}>
          <InputRow label="2 Egress Windows" field="egressWindows" inputs={inputs} onChange={onChange} step={500} note="Cut concrete + install for basement BRs" />
          <InputRow label="Partition Walls" field="partitionWalls" inputs={inputs} onChange={onChange} step={500} note="Close off BR3 from kitchen + living" />
          <InputRow label="Basement Cosmetic" field="basementCosmetic" inputs={inputs} onChange={onChange} step={500} />
          <InputRow label="Permits" field="permits" inputs={inputs} onChange={onChange} step={100} />
          <InputRow label="Contingency" field="contingencyPct" inputs={inputs} onChange={onChange} prefix="" suffix="%" step={5} />
          <ResultRow label="Total Renovation" value={fmt(r.totalReno)} />
        </Section>

        <Section title="Income">
          <InputRow label="Number of Rooms" field="numRooms" inputs={inputs} onChange={onChange} prefix="" suffix="rooms" step={1} />
          <InputRow label="Rent per Room" field="rentPerRoom" inputs={inputs} onChange={onChange} step={25} note="Utilities included in rent" />
          <InputRow label="Vacancy" field="vacancyPct" inputs={inputs} onChange={onChange} prefix="" suffix="%" step={1} />
          <ResultRow label="Gross Monthly Rent" value={fmt(r.grossRent)} />
          <ResultRow label="Effective Income" value={fmt(r.egi)} note="After vacancy" />
        </Section>

        <Section title="Expenses">
          <ResultRow label="Mortgage (P&I)" value={fmt(r.monthlyMortgage)} />
          <InputRow label="Property Tax (annual)" field="propertyTaxAnnual" inputs={inputs} onChange={onChange} step={100} note="City tax + water" />
          <InputRow label="Insurance" field="insurance" inputs={inputs} onChange={onChange} step={10} />
          <InputRow label="Utilities (heat/electric)" field="utilities" inputs={inputs} onChange={onChange} step={25} note="You absorb this — baseboard electric" />
          <InputRow label="Maintenance / CapEx" field="maintenance" inputs={inputs} onChange={onChange} step={25} note="1949 build" />
          <InputRow label="PM Fee" field="pmPct" inputs={inputs} onChange={onChange} prefix="" suffix="%" step={1} note="10% of gross per room" />
          <ResultRow label="Total Monthly Expenses" value={fmt(r.totalExpenses)} />
        </Section>

        <Section title="Key Metrics" defaultOpen={true}>
          <ResultRow label="Monthly Cash Flow" value={fmt(r.monthlyCF)} highlight />
          <ResultRow label="Annual Cash Flow" value={fmt(r.annualCF)} highlight />
          <ResultRow label="Cap Rate" value={pct(r.capRate)} note="NOI / Total Cost" />
          <ResultRow label="Cash-on-Cash Return" value={pct(r.coc)} note="Annual CF / Cash In" />
          <ResultRow label="DSCR" value={r.dscr.toFixed(2) + "x"} note="> 1.2x is healthy" />
          <ResultRow label="Gross Rent Multiplier" value={r.grm.toFixed(1) + "x"} />
          <ResultRow label="Break-even Occupancy" value={pct(r.breakeven)} note="% occupancy to cover expenses" />
          <ResultRow label="CF per Door" value={fmt(r.cfPerDoor)} note="Monthly CF / rooms" />
        </Section>

        <Section title="Sensitivity — Rent per Room">
          <SensitivityTable inputs={inputs} />
        </Section>

      </div>
    </div>
  );
}

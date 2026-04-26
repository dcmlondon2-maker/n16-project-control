import React, { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { supabase } from "./supabaseClient";

const currency = (n) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(Number(n || 0));

const today = new Date().toISOString().split("T")[0];

const cashflowData = [
  { week: 1, balance: 10000 },
  { week: 5, balance: -5000 },
  { week: 10, balance: 15000 },
  { week: 15, balance: 20000 },
];

export default function App() {
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [connection, setConnection] = useState("Checking database...");

  const [projects, setProjects] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [labour, setLabour] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [profitData, setProfitData] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [variations, setVariations] = useState([]);
  const [subcontractors, setSubcontractors] = useState([]);
  const [diaryEntries, setDiaryEntries] = useState([]);
  const [notes, setNotes] = useState([]);

  const [diaryForm, setDiaryForm] = useState({
    diary_date: today,
    weather: "",
    labour_on_site: "",
    work_completed: "",
    issues: "",
    voice_note: "",
  });

  const [noteForm, setNoteForm] = useState({
    note_date: today,
    title: "",
    note: "",
    voice_note: "",
  });

  async function loadData() {
    const { data: projectData } = await supabase.from("projects").select("*").order("id");
    const { data: budgetData } = await supabase.from("budgets").select("*").order("id");
    const { data: labourData } = await supabase.from("labour").select("*").order("id");
    const { data: poData } = await supabase.from("purchase_orders").select("*").order("po_date", { ascending: false });
    const { data: profitRows } = await supabase.from("profit_tracker").select("*").order("id");
    const { data: invoiceRows } = await supabase.from("invoice_tracker").select("*").order("invoice_date", { ascending: false });
    const { data: variationRows } = await supabase.from("variation_tracker").select("*").order("submitted_date", { ascending: false });
    const { data: subRows } = await supabase.from("subcontractor_payments").select("*").order("invoice_date", { ascending: false });
    const { data: diaryRows } = await supabase.from("site_diary").select("*").order("diary_date", { ascending: false });
    const { data: noteRows } = await supabase.from("project_notes").select("*").order("note_date", { ascending: false });

    setProjects(projectData || []);
    setBudgets(budgetData || []);
    setLabour(labourData || []);
    setPurchaseOrders(poData || []);
    setProfitData(profitRows || []);
    setInvoices(invoiceRows || []);
    setVariations(variationRows || []);
    setSubcontractors(subRows || []);
    setDiaryEntries(diaryRows || []);
    setNotes(noteRows || []);
    setConnection("Supabase connected successfully.");
  }

  useEffect(() => {
    loadData();
  }, []);

  function startVoice(target, field) {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Voice entry is not supported in this browser. Try Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-GB";
    recognition.interimResults = false;
    recognition.start();

    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;

      if (target === "diary") {
        setDiaryForm((prev) => ({
          ...prev,
          [field]: prev[field] ? prev[field] + " " + text : text,
        }));
      }

      if (target === "note") {
        setNoteForm((prev) => ({
          ...prev,
          [field]: prev[field] ? prev[field] + " " + text : text,
        }));
      }
    };
  }

  async function saveDiary() {
    await supabase.from("site_diary").insert([diaryForm]);
    setDiaryForm({
      diary_date: today,
      weather: "",
      labour_on_site: "",
      work_completed: "",
      issues: "",
      voice_note: "",
    });
    loadData();
  }

  async function saveNote() {
    await supabase.from("project_notes").insert([noteForm]);
    setNoteForm({
      note_date: today,
      title: "",
      note: "",
      voice_note: "",
    });
    loadData();
  }

  const totalBudget = budgets.reduce((s, b) => s + Number(b.budget || 0), 0);
  const totalSpent = budgets.reduce((s, b) => s + Number(b.spent || 0), 0);
  const totalRemaining = budgets.reduce((s, b) => s + Number(b.remaining || 0), 0);
  const totalLabour = labour.reduce((s, l) => s + Number(l.total_cost || 0), 0);
  const totalPOs = purchaseOrders.reduce((s, p) => s + Number(p.gross_amount || 0), 0);

  const totalInvoiced = invoices.reduce((s, i) => s + Number(i.gross_amount || 0), 0);
  const totalPaid = invoices.reduce((s, i) => s + Number(i.paid_amount || 0), 0);
  const totalOutstanding = totalInvoiced - totalPaid;

  const totalVariations = variations.reduce((s, v) => s + Number(v.gross_amount || 0), 0);
  const approvedVariations = variations
    .filter((v) => v.status === "Approved")
    .reduce((s, v) => s + Number(v.gross_amount || 0), 0);

  const totalSubbies = subcontractors.reduce((s, x) => s + Number(x.gross_amount || 0), 0);
  const totalSubbiesPaid = subcontractors.reduce((s, x) => s + Number(x.paid_amount || 0), 0);
  const totalSubbiesOutstanding = totalSubbies - totalSubbiesPaid;

  const latestProfit = profitData[0] || {};
  const contractWithVariations = Number(latestProfit.contract_value || 0) + approvedVariations;

  const liveProfit =
    contractWithVariations -
    Number(latestProfit.budget_cost || 0) -
    totalLabour -
    totalPOs -
    totalSubbies -
    Number(latestProfit.other_cost || 0);

  const margin =
    contractWithVariations > 0
      ? ((liveProfit / contractWithVariations) * 100).toFixed(1)
      : 0;

  const tabs = [
    "Dashboard",
    "Budget",
    "Labour",
    "POs",
    "Invoices",
    "Variations",
    "Subbies",
    "Profit",
    "Site Diary",
    "Notes",
    "Projects",
  ];

  return (
    <div style={{ padding: 30, fontFamily: "Arial", background: "#f7f7f7", minHeight: "100vh" }}>
      <Header />

      <div style={tabsStyle}>
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={activeTab === tab ? activeTabButton : tabButton}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Dashboard" && (
        <>
          <div style={grid4}>
            <Card title="Contract + Variations" value={currency(contractWithVariations)} />
            <Card title="Invoiced" value={currency(totalInvoiced)} />
            <Card title="Outstanding" value={currency(totalOutstanding)} />
            <Card title="Database" value={connection} small />
          </div>

          <Section title="Cashflow Forecast">
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={cashflowData}>
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="balance" stroke="#ff6600" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Section>
        </>
      )}

      {activeTab === "Budget" && (
        <Section title="Budget by Trade">
          <div style={grid3}>
            <Card title="Budget" value={currency(totalBudget)} />
            <Card title="Spent" value={currency(totalSpent)} />
            <Card title="Remaining" value={currency(totalRemaining)} />
          </div>
          <Table headers={["Trade", "Budget", "Spent", "Remaining"]}>
            {budgets.map((b) => (
              <tr key={b.id}>
                <td style={td}>{b.trade}</td>
                <td style={td}>{currency(b.budget)}</td>
                <td style={td}>{currency(b.spent)}</td>
                <td style={td}>{currency(b.remaining)}</td>
              </tr>
            ))}
          </Table>
        </Section>
      )}

      {activeTab === "Labour" && (
        <Section title="Labour Tracker">
          <div style={grid3}>
            <Card title="Labour" value={currency(totalLabour)} />
            <Card title="Entries" value={labour.length} />
            <Card title="Avg" value={currency(labour.length ? totalLabour / labour.length : 0)} />
          </div>
          <Table headers={["Employee", "Days", "Day Rate", "Total"]}>
            {labour.map((l) => (
              <tr key={l.id}>
                <td style={td}>{l.employee || l.worker || "Labour"}</td>
                <td style={td}>{l.days_worked}</td>
                <td style={td}>{currency(l.day_rate)}</td>
                <td style={td}>{currency(l.total_cost)}</td>
              </tr>
            ))}
          </Table>
        </Section>
      )}

      {activeTab === "POs" && (
        <Section title="PO Tracker">
          <div style={grid3}>
            <Card title="PO Value" value={currency(totalPOs)} />
            <Card title="PO Count" value={purchaseOrders.length} />
            <Card title="Latest" value={purchaseOrders[0]?.po_number || "None"} />
          </div>
          <Table headers={["PO No", "Supplier", "Trade", "Status", "Gross"]}>
            {purchaseOrders.map((po) => (
              <tr key={po.id}>
                <td style={td}>{po.po_number}</td>
                <td style={td}>{po.supplier}</td>
                <td style={td}>{po.trade}</td>
                <td style={td}>{po.status}</td>
                <td style={td}>{currency(po.gross_amount)}</td>
              </tr>
            ))}
          </Table>
        </Section>
      )}

      {activeTab === "Invoices" && (
        <Section title="Invoice Tracker">
          <div style={grid3}>
            <Card title="Invoiced" value={currency(totalInvoiced)} />
            <Card title="Paid" value={currency(totalPaid)} />
            <Card title="Outstanding" value={currency(totalOutstanding)} />
          </div>
          <Table headers={["Invoice", "Client", "Status", "Gross", "Paid"]}>
            {invoices.map((i) => (
              <tr key={i.id}>
                <td style={td}>{i.invoice_number}</td>
                <td style={td}>{i.client}</td>
                <td style={td}>{i.status}</td>
                <td style={td}>{currency(i.gross_amount)}</td>
                <td style={td}>{currency(i.paid_amount)}</td>
              </tr>
            ))}
          </Table>
        </Section>
      )}

      {activeTab === "Variations" && (
        <Section title="Variation Tracker">
          <div style={grid3}>
            <Card title="Variations" value={currency(totalVariations)} />
            <Card title="Approved" value={currency(approvedVariations)} />
            <Card title="Count" value={variations.length} />
          </div>
          <Table headers={["Variation", "Description", "Status", "Gross"]}>
            {variations.map((v) => (
              <tr key={v.id}>
                <td style={td}>{v.variation_number}</td>
                <td style={td}>{v.description}</td>
                <td style={td}>{v.status}</td>
                <td style={td}>{currency(v.gross_amount)}</td>
              </tr>
            ))}
          </Table>
        </Section>
      )}

      {activeTab === "Subbies" && (
        <Section title="Subcontractor Payment Tracker">
          <div style={grid3}>
            <Card title="Subbies Due" value={currency(totalSubbies)} />
            <Card title="Subbies Paid" value={currency(totalSubbiesPaid)} />
            <Card title="Outstanding" value={currency(totalSubbiesOutstanding)} />
          </div>
          <Table headers={["Subcontractor", "Trade", "Ref", "Status", "Gross", "Paid"]}>
            {subcontractors.map((s) => (
              <tr key={s.id}>
                <td style={td}>{s.subcontractor}</td>
                <td style={td}>{s.trade}</td>
                <td style={td}>{s.payment_reference}</td>
                <td style={td}>{s.status}</td>
                <td style={td}>{currency(s.gross_amount)}</td>
                <td style={td}>{currency(s.paid_amount)}</td>
              </tr>
            ))}
          </Table>
        </Section>
      )}

      {activeTab === "Profit" && (
        <Section title="Profit Tracker">
          <div style={grid3}>
            <Card title="Profit" value={currency(liveProfit)} />
            <Card title="Margin %" value={`${margin}%`} />
            <Card title="Contract" value={currency(contractWithVariations)} />
          </div>
        </Section>
      )}

      {activeTab === "Site Diary" && (
        <Section title="Site Diary">
          <FormInput label="Date" type="date" value={diaryForm.diary_date} onChange={(v) => setDiaryForm({ ...diaryForm, diary_date: v })} />
          <FormInput label="Weather" value={diaryForm.weather} onChange={(v) => setDiaryForm({ ...diaryForm, weather: v })} />
          <FormInput label="Labour on Site" value={diaryForm.labour_on_site} onChange={(v) => setDiaryForm({ ...diaryForm, labour_on_site: v })} />
          <FormArea label="Work Completed" value={diaryForm.work_completed} onChange={(v) => setDiaryForm({ ...diaryForm, work_completed: v })} />
          <FormArea label="Issues" value={diaryForm.issues} onChange={(v) => setDiaryForm({ ...diaryForm, issues: v })} />
          <FormArea label="Voice Note" value={diaryForm.voice_note} onChange={(v) => setDiaryForm({ ...diaryForm, voice_note: v })} />

          <button style={button} onClick={() => startVoice("diary", "voice_note")}>🎤 Voice Entry</button>
          <button style={buttonDark} onClick={saveDiary}>Save Diary</button>

          <Table headers={["Date", "Weather", "Labour", "Work", "Issues", "Voice Note"]}>
            {diaryEntries.map((d) => (
              <tr key={d.id}>
                <td style={td}>{d.diary_date}</td>
                <td style={td}>{d.weather}</td>
                <td style={td}>{d.labour_on_site}</td>
                <td style={td}>{d.work_completed}</td>
                <td style={td}>{d.issues}</td>
                <td style={td}>{d.voice_note}</td>
              </tr>
            ))}
          </Table>
        </Section>
      )}

      {activeTab === "Notes" && (
        <Section title="Project Notes">
          <FormInput label="Date" type="date" value={noteForm.note_date} onChange={(v) => setNoteForm({ ...noteForm, note_date: v })} />
          <FormInput label="Title" value={noteForm.title} onChange={(v) => setNoteForm({ ...noteForm, title: v })} />
          <FormArea label="Note" value={noteForm.note} onChange={(v) => setNoteForm({ ...noteForm, note: v })} />
          <FormArea label="Voice Note" value={noteForm.voice_note} onChange={(v) => setNoteForm({ ...noteForm, voice_note: v })} />

          <button style={button} onClick={() => startVoice("note", "voice_note")}>🎤 Voice Entry</button>
          <button style={buttonDark} onClick={saveNote}>Save Note</button>

          <Table headers={["Date", "Title", "Note", "Voice Note"]}>
            {notes.map((n) => (
              <tr key={n.id}>
                <td style={td}>{n.note_date}</td>
                <td style={td}>{n.title}</td>
                <td style={td}>{n.note}</td>
                <td style={td}>{n.voice_note}</td>
              </tr>
            ))}
          </Table>
        </Section>
      )}

      {activeTab === "Projects" && (
        <Section title="Projects from Supabase">
          <ul>
            {projects.map((p) => (
              <li key={p.id}>
                {p.name} — {currency(p.contract_value)} — {p.status}
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}

function Header() {
  return (
    <div style={{ background: "#111827", color: "white", padding: 24, borderRadius: 16 }}>
      <h1 style={{ margin: 0 }}>N16 Project Control Dashboard</h1>
      <p style={{ marginBottom: 0 }}>Budget, cashflow, labour, POs, invoices, variations, diary and notes.</p>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginTop: 24, background: "white", padding: 24, borderRadius: 16 }}>
      <h2>{title}</h2>
      {children}
    </div>
  );
}

function Card({ title, value, small }) {
  return (
    <div style={{ background: "white", padding: 20, borderRadius: 16, border: "1px solid #ddd" }}>
      <div style={{ color: "#666", fontSize: 14 }}>{title}</div>
      <div style={{ fontSize: small ? 14 : 24, fontWeight: 700, marginTop: 8 }}>{value}</div>
    </div>
  );
}

function Table({ headers, children }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 16 }}>
        <thead>
          <tr style={{ background: "#111827", color: "white" }}>
            {headers.map((h) => (
              <th key={h} style={th}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function FormInput({ label, value, onChange, type = "text" }) {
  return (
    <label style={labelStyle}>
      {label}
      <input style={inputStyle} type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function FormArea({ label, value, onChange }) {
  return (
    <label style={labelStyle}>
      {label}
      <textarea style={areaStyle} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

const grid4 = { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginTop: 24 };
const grid3 = { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 20 };
const th = { padding: 12, border: "1px solid #ddd", textAlign: "left" };
const td = { padding: 12, border: "1px solid #ddd" };

const tabsStyle = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
  marginTop: 20,
};

const tabButton = {
  padding: "10px 14px",
  borderRadius: 10,
  border: "1px solid #ddd",
  background: "white",
  cursor: "pointer",
};

const activeTabButton = {
  ...tabButton,
  background: "#111827",
  color: "white",
};

const labelStyle = {
  display: "block",
  marginBottom: 12,
  fontWeight: 700,
};

const inputStyle = {
  display: "block",
  width: "100%",
  padding: 10,
  marginTop: 6,
  borderRadius: 8,
  border: "1px solid #ccc",
};

const areaStyle = {
  ...inputStyle,
  minHeight: 80,
};

const button = {
  padding: "10px 14px",
  marginRight: 10,
  borderRadius: 8,
  border: "1px solid #ccc",
  background: "white",
  cursor: "pointer",
};

const buttonDark = {
  ...button,
  background: "#111827",
  color: "white",
};

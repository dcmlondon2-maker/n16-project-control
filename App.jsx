import React, { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { supabase } from "./supabaseClient";

const currency = (n) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(Number(n || 0));

const cashflowData = [
  { week: 1, balance: 10000 },
  { week: 5, balance: -5000 },
  { week: 10, balance: 15000 },
  { week: 15, balance: 20000 },
];

export default function App() {
  const [connection, setConnection] = useState("Checking database...");
  const [projects, setProjects] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [labour, setLabour] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [profitData, setProfitData] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [variations, setVariations] = useState([]);
  const [subcontractors, setSubcontractors] = useState([]);

  useEffect(() => {
    async function loadData() {
      const { data: projectData } = await supabase.from("projects").select("*").order("id");
      const { data: budgetData } = await supabase.from("budgets").select("*").order("id");
      const { data: labourData } = await supabase.from("labour").select("*").order("id");
      const { data: poData } = await supabase.from("purchase_orders").select("*").order("po_date", { ascending: false });
      const { data: profitRows } = await supabase.from("profit_tracker").select("*").order("id");
      const { data: invoiceRows } = await supabase.from("invoice_tracker").select("*").order("invoice_date", { ascending: false });
      const { data: variationRows } = await supabase.from("variation_tracker").select("*").order("submitted_date", { ascending: false });
      const { data: subRows } = await supabase.from("subcontractor_payments").select("*").order("invoice_date", { ascending: false });

      setProjects(projectData || []);
      setBudgets(budgetData || []);
      setLabour(labourData || []);
      setPurchaseOrders(poData || []);
      setProfitData(profitRows || []);
      setInvoices(invoiceRows || []);
      setVariations(variationRows || []);
      setSubcontractors(subRows || []);
      setConnection("Supabase connected successfully.");
    }

    loadData();
  }, []);

  const totalBudget = budgets.reduce((s, b) => s + Number(b.budget || 0), 0);
  const totalSpent = budgets.reduce((s, b) => s + Number(b.spent || 0), 0);
  const totalRemaining = budgets.reduce((s, b) => s + Number(b.remaining || 0), 0);
  const totalLabour = labour.reduce((s, l) => s + Number(l.total_cost || 0), 0);
  const totalPOs = purchaseOrders.reduce((s, p) => s + Number(p.gross_amount || 0), 0);

  const totalInvoiced = invoices.reduce((s, i) => s + Number(i.gross_amount || 0), 0);
  const totalPaid = invoices.reduce((s, i) => s + Number(i.paid_amount || 0), 0);
  const totalOutstanding = totalInvoiced - totalPaid;

  const totalVariations = variations.reduce((s, v) => s + Number(v.gross_amount || 0), 0);
  const approvedVariations = variations.filter((v) => v.status === "Approved").reduce((s, v) => s + Number(v.gross_amount || 0), 0);

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

  const margin = contractWithVariations > 0
    ? ((liveProfit / contractWithVariations) * 100).toFixed(1)
    : 0;

  return (
    <div style={{ padding: 40, fontFamily: "Arial", background: "#f7f7f7" }}>
      <Header />

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

      <Section title="Budget by Trade">
        <div style={grid3}>
          <Card title="Budget" value={currency(totalBudget)} />
          <Card title="Spent" value={currency(totalSpent)} />
          <Card title="Remaining" value={currency(totalRemaining)} />
        </div>
      </Section>

      <Section title="Labour Tracker">
        <div style={grid3}>
          <Card title="Labour" value={currency(totalLabour)} />
          <Card title="Entries" value={labour.length} />
          <Card title="Avg" value={currency(labour.length ? totalLabour / labour.length : 0)} />
        </div>
      </Section>

      <Section title="PO Tracker">
        <div style={grid3}>
          <Card title="PO Value" value={currency(totalPOs)} />
          <Card title="PO Count" value={purchaseOrders.length} />
          <Card title="Latest" value={purchaseOrders[0]?.po_number || "None"} />
        </div>
      </Section>

      <Section title="Invoice Tracker">
        <div style={grid3}>
          <Card title="Invoiced" value={currency(totalInvoiced)} />
          <Card title="Paid" value={currency(totalPaid)} />
          <Card title="Outstanding" value={currency(totalOutstanding)} />
        </div>
      </Section>

      <Section title="Variation Tracker">
        <div style={grid3}>
          <Card title="Variations" value={currency(totalVariations)} />
          <Card title="Approved" value={currency(approvedVariations)} />
          <Card title="Count" value={variations.length} />
        </div>
      </Section>

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

      <Section title="Profit Tracker">
        <div style={grid3}>
          <Card title="Profit" value={currency(liveProfit)} />
          <Card title="Margin %" value={`${margin}%`} />
          <Card title="Contract" value={currency(contractWithVariations)} />
        </div>
      </Section>

      <Section title="Projects from Supabase">
        <ul>
          {projects.map((p) => (
            <li key={p.id}>
              {p.name} — {currency(p.contract_value)} — {p.status}
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}

function Header() {
  return (
    <div style={{ background: "#111827", color: "white", padding: 24, borderRadius: 16 }}>
      <h1>N16 Project Control Dashboard</h1>
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
    <div style={{ background: "white", padding: 20, borderRadius: 16 }}>
      <div>{title}</div>
      <div style={{ fontSize: small ? 14 : 24, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

function Table({ headers, children }) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 16 }}>
      <thead>
        <tr>
          {headers.map((h) => (
            <th key={h} style={th}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  );
}

const grid4 = { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginTop: 24 };
const grid3 = { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 };
const th = { padding: 12, border: "1px solid #ddd", textAlign: "left" };
const td = { padding: 12, border: "1px solid #ddd" };

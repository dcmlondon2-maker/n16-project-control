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

  useEffect(() => {
    async function loadData() {
      const { data: projectData, error: projectError } = await supabase.from("projects").select("*").order("id");
      const { data: budgetData } = await supabase.from("budgets").select("*").order("id");
      const { data: labourData } = await supabase.from("labour").select("*").order("id");
      const { data: poData } = await supabase.from("purchase_orders").select("*").order("po_date", { ascending: false });
      const { data: profitRows } = await supabase.from("profit_tracker").select("*").order("id");
      const { data: invoiceRows } = await supabase.from("invoice_tracker").select("*").order("invoice_date", { ascending: false });
      const { data: variationRows } = await supabase.from("variation_tracker").select("*").order("submitted_date", { ascending: false });

      if (projectError) {
        setConnection("Database error");
        console.error(projectError);
        return;
      }

      setProjects(projectData || []);
      setBudgets(budgetData || []);
      setLabour(labourData || []);
      setPurchaseOrders(poData || []);
      setProfitData(profitRows || []);
      setInvoices(invoiceRows || []);
      setVariations(variationRows || []);
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
  const approvedVariations = variations
    .filter((v) => v.status === "Approved")
    .reduce((s, v) => s + Number(v.gross_amount || 0), 0);
  const pendingVariations = totalVariations - approvedVariations;

  const latestProfit = profitData[0] || {};
  const contractWithVariations = Number(latestProfit.contract_value || 0) + approvedVariations;

  const liveProfit =
    contractWithVariations -
    Number(latestProfit.budget_cost || 0) -
    Number(totalLabour || 0) -
    Number(totalPOs || 0) -
    Number(latestProfit.other_cost || 0);

  const margin =
    contractWithVariations > 0
      ? ((liveProfit / contractWithVariations) * 100).toFixed(1)
      : 0;

  return (
    <div style={{ padding: 40, fontFamily: "Arial", background: "#f7f7f7" }}>
      <Header />

      <div style={grid4}>
        <Card title="Contract + Approved Variations" value={currency(contractWithVariations)} />
        <Card title="Total Invoiced" value={currency(totalInvoiced)} />
        <Card title="Outstanding" value={currency(totalOutstanding)} />
        <Card title="Database Status" value={connection} small />
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
          <Card title="Total Budget" value={currency(totalBudget)} />
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

      <Section title="Labour Tracker">
        <div style={grid3}>
          <Card title="Total Labour" value={currency(totalLabour)} />
          <Card title="Entries" value={labour.length} />
          <Card title="Average Payment" value={currency(labour.length ? totalLabour / labour.length : 0)} />
        </div>

        <Table headers={["Employee", "Days", "Day Rate", "Total Cost"]}>
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

      <Section title="PO Tracker">
        <div style={grid3}>
          <Card title="Total PO Value" value={currency(totalPOs)} />
          <Card title="PO Count" value={purchaseOrders.length} />
          <Card title="Latest PO" value={purchaseOrders[0]?.po_number || "None"} />
        </div>

        <Table headers={["PO No", "Supplier", "Trade", "Description", "Status", "PO Date", "Delivery", "Net", "VAT", "Gross"]}>
          {purchaseOrders.map((po) => (
            <tr key={po.id}>
              <td style={td}>{po.po_number}</td>
              <td style={td}>{po.supplier}</td>
              <td style={td}>{po.trade}</td>
              <td style={td}>{po.description}</td>
              <td style={td}>{po.status}</td>
              <td style={td}>{po.po_date}</td>
              <td style={td}>{po.expected_delivery}</td>
              <td style={td}>{currency(po.net_amount)}</td>
              <td style={td}>{currency(po.vat_amount)}</td>
              <td style={td}>{currency(po.gross_amount)}</td>
            </tr>
          ))}
        </Table>
      </Section>

      <Section title="Invoice Tracker">
        <div style={grid3}>
          <Card title="Total Invoiced" value={currency(totalInvoiced)} />
          <Card title="Paid" value={currency(totalPaid)} />
          <Card title="Outstanding" value={currency(totalOutstanding)} />
        </div>

        <Table headers={["Invoice No", "Client", "Description", "Status", "Invoice Date", "Due Date", "Net", "VAT", "Gross", "Paid"]}>
          {invoices.map((inv) => (
            <tr key={inv.id}>
              <td style={td}>{inv.invoice_number}</td>
              <td style={td}>{inv.client}</td>
              <td style={td}>{inv.description}</td>
              <td style={td}>{inv.status}</td>
              <td style={td}>{inv.invoice_date}</td>
              <td style={td}>{inv.due_date}</td>
              <td style={td}>{currency(inv.net_amount)}</td>
              <td style={td}>{currency(inv.vat_amount)}</td>
              <td style={td}>{currency(inv.gross_amount)}</td>
              <td style={td}>{currency(inv.paid_amount)}</td>
            </tr>
          ))}
        </Table>
      </Section>

      <Section title="Variation Tracker">
        <div style={grid3}>
          <Card title="Total Variations" value={currency(totalVariations)} />
          <Card title="Approved Variations" value={currency(approvedVariations)} />
          <Card title="Pending / Draft" value={currency(pendingVariations)} />
        </div>

        <Table headers={["Variation No", "Client", "Description", "Status", "Submitted", "Approved", "Net", "VAT", "Gross"]}>
          {variations.map((v) => (
            <tr key={v.id}>
              <td style={td}>{v.variation_number}</td>
              <td style={td}>{v.client}</td>
              <td style={td}>{v.description}</td>
              <td style={td}>{v.status}</td>
              <td style={td}>{v.submitted_date}</td>
              <td style={td}>{v.approved_date || "-"}</td>
              <td style={td}>{currency(v.net_amount)}</td>
              <td style={td}>{currency(v.vat_amount)}</td>
              <td style={td}>{currency(v.gross_amount)}</td>
            </tr>
          ))}
        </Table>
      </Section>

      <Section title="Profit Tracker">
        <div style={grid3}>
          <Card title="Contract + Approved Variations" value={currency(contractWithVariations)} />
          <Card title="Live Profit" value={currency(liveProfit)} />
          <Card title="Margin %" value={`${margin}%`} />
        </div>

        <Table headers={["Contract + Vars", "Budget", "Labour", "PO Cost", "Other", "Profit"]}>
          <tr>
            <td style={td}>{currency(contractWithVariations)}</td>
            <td style={td}>{currency(latestProfit.budget_cost)}</td>
            <td style={td}>{currency(totalLabour)}</td>
            <td style={td}>{currency(totalPOs)}</td>
            <td style={td}>{currency(latestProfit.other_cost)}</td>
            <td style={td}>{currency(liveProfit)}</td>
          </tr>
        </Table>
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
      <h1 style={{ margin: 0 }}>N16 Project Control Dashboard</h1>
      <p>Construction SaaS for budget, cashflow, labour, POs, invoices, variations and profit control.</p>
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
    <div style={{ background: "white", padding: 20, borderRadius: 16, border: "1px solid #eee" }}>
      <div style={{ color: "#666", fontSize: 14 }}>{title}</div>
      <div style={{ fontSize: small ? 14 : 24, fontWeight: 700, marginTop: 8 }}>{value}</div>
    </div>
  );
}

function Table({ headers, children }) {
  return (
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
  );
}

const grid4 = {
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  gap: 16,
  marginTop: 24,
};

const grid3 = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: 16,
  marginBottom: 20,
};

const th = {
  padding: 12,
  textAlign: "left",
  border: "1px solid #ddd",
};

const td = {
  padding: 12,
  border: "1px solid #ddd",
};

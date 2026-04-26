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

  useEffect(() => {
    async function loadData() {
      const { data: projectData, error: projectError } = await supabase
        .from("projects")
        .select("*")
        .order("id");

      const { data: budgetData } = await supabase
        .from("budgets")
        .select("*")
        .order("id");

      const { data: labourData } = await supabase
        .from("labour")
        .select("*")
        .order("id");

      if (projectError) {
        setConnection("Database error");
        return;
      }

      setProjects(projectData || []);
      setBudgets(budgetData || []);
      setLabour(labourData || []);
      setConnection("Supabase connected successfully.");
    }

    loadData();
  }, []);

  const totalBudget = budgets.reduce((s, b) => s + Number(b.budget || 0), 0);
  const totalSpent = budgets.reduce((s, b) => s + Number(b.spent || 0), 0);
  const totalRemaining = budgets.reduce((s, b) => s + Number(b.remaining || 0), 0);
  const totalLabour = labour.reduce((s, l) => s + Number(l.total_cost || 0), 0);

  return (
    <div style={{ padding: 40, fontFamily: "Arial", background: "#f7f7f7" }}>
      <Header />

      <div style={grid4}>
        <Card title="N16 Contract inc VAT" value={currency(161479.71)} />
        <Card title="Total Max Budget" value={currency(221500)} />
        <Card title="Labour Paid" value={currency(totalLabour)} />
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
          <Card
            title="Average Payment"
            value={currency(labour.length ? totalLabour / labour.length : 0)}
          />
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
      <p>Construction SaaS for budget, cashflow, labour, POs and profit control.</p>
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
};const { data, error } = await supabase
  .from("purchase_orders")
  .select("*")
  .order("po_date", { ascending: false });

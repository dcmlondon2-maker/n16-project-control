import React, { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { supabase } from "./supabaseClient";

const currency = (n) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(Number(n || 0));

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

  useEffect(() => {
    async function loadData() {
      try {
        const { data: projectData, error: projectError } = await supabase
          .from("projects")
          .select("*")
          .order("id", { ascending: true });

        if (projectError) {
          setConnection("Supabase connected, but projects table cannot be read yet.");
          return;
        }

        const { data: budgetData, error: budgetError } = await supabase
          .from("budgets")
          .select("*")
          .order("id", { ascending: true });

        if (budgetError) {
          setConnection("Projects working. Budgets table cannot be read yet.");
          setProjects(projectData || []);
          return;
        }

        setProjects(projectData || []);
        setBudgets(budgetData || []);
        setConnection("Supabase connected successfully.");
      } catch (err) {
        setConnection("Supabase connection not working yet.");
      }
    }

    loadData();
  }, []);

  const totalBudget = budgets.reduce((sum, b) => sum + Number(b.budget || 0), 0);
  const totalSpent = budgets.reduce((sum, b) => sum + Number(b.spent || 0), 0);
  const totalRemaining = budgets.reduce((sum, b) => sum + Number(b.remaining || 0), 0);

  return (
    <div style={{ padding: 40, fontFamily: "Arial", background: "#f7f7f7", minHeight: "100vh" }}>
      <div style={{ background: "#111827", color: "white", padding: 24, borderRadius: 16 }}>
        <h1 style={{ margin: 0 }}>N16 Project Control Dashboard</h1>
        <p style={{ marginBottom: 0 }}>Construction SaaS for budget, cashflow, labour, POs and profit control.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginTop: 24 }}>
        <Card title="N16 Contract inc VAT" value={currency(161479.71)} />
        <Card title="Client Direct Contractor" value={currency(60000)} />
        <Card title="Total Max Budget" value={currency(221500)} />
        <Card title="Database Status" value={connection} small />
      </div>

      <div style={{ marginTop: 24, background: "white", padding: 24, borderRadius: 16 }}>
        <h2>Cashflow Forecast</h2>
        <div style={{ height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={cashflowData}>
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="balance" stroke="#ff6600" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ marginTop: 24, background: "white", padding: 24, borderRadius: 16 }}>
        <h2>Budget by Trade</h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 20 }}>
          <Card title="Total Budget" value={currency(totalBudget)} />
          <Card title="Spent to Date" value={currency(totalSpent)} />
          <Card title="Remaining" value={currency(totalRemaining)} />
        </div>

        {budgets.length === 0 ? (
          <p>No budget lines loaded yet.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", background: "white" }}>
            <thead>
              <tr style={{ background: "#111827", color: "white" }}>
                <th style={th}>Trade</th>
                <th style={th}>Budget</th>
                <th style={th}>Spent</th>
                <th style={th}>Remaining</th>
              </tr>
            </thead>
            <tbody>
              {budgets.map((b) => (
                <tr key={b.id}>
                  <td style={td}>{b.trade}</td>
                  <td style={td}>{currency(b.budget)}</td>
                  <td style={td}>{currency(b.spent)}</td>
                  <td style={td}>{currency(b.remaining)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={{ marginTop: 24, background: "white", padding: 24, borderRadius: 16 }}>
        <h2>Modules</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {["Cashflow Forecast", "Labour Tracker", "PO Tracker", "Variations", "P&L Dashboard", "Invoices"].map((m) => (
            <div key={m} style={{ border: "1px solid #ddd", padding: 16, borderRadius: 12 }}>
              <strong>{m}</strong>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 24, background: "white", padding: 24, borderRadius: 16 }}>
        <h2>Projects from Supabase</h2>
        {projects.length === 0 ? (
          <p>No projects loaded yet.</p>
        ) : (
          <ul>{projects.map((p) => <li key={p.id}>{p.name} — {currency(p.contract_value)} — {p.status}</li>)}</ul>
        )}
      </div>
    </div>
  );
}

const th = { padding: 12, textAlign: "left", border: "1px solid #ddd" };
const td = { padding: 12, border: "1px solid #ddd" };

function Card({ title, value, small }) {
  return (
    <div style={{ background: "white", padding: 20, borderRadius: 16, border: "1px solid #eee" }}>
      <div style={{ color: "#666", fontSize: 14 }}>{title}</div>
      <div style={{ fontSize: small ? 14 : 24, fontWeight: 700, marginTop: 8 }}>{value}</div>
    </div>
  );
}

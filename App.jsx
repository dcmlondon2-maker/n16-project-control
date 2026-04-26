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

  useEffect(() => {
    async function checkConnection() {
      try {
        const { data, error } = await supabase.from("projects").select("*").limit(10);

        if (error) {
          setConnection("Supabase connected, but database tables are not created yet.");
          return;
        }

        setProjects(data || []);
        setConnection("Supabase connected successfully.");
      } catch (err) {
        setConnection("Supabase connection not working yet.");
      }
    }

    checkConnection();
  }, []);

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
        <h2>Modules</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {["Budget by Trade", "Cashflow Forecast", "Labour Tracker", "PO Tracker", "Variations", "P&L Dashboard"].map((m) => (
            <div key={m} style={{ border: "1px solid #ddd", padding: 16, borderRadius: 12 }}>
              <strong>{m}</strong>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 24, background: "white", padding: 24, borderRadius: 16 }}>
        <h2>Projects from Supabase</h2>
        {projects.length === 0 ? (
          <p>No projects loaded yet. Next step: create your database tables and seed the first N16 project.</p>
        ) : (
          <ul>{projects.map((p) => <li key={p.id}>{p.name}</li>)}</ul>
        )}
      </div>
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

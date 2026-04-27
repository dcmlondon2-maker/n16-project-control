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
  const [activeProjectId, setActiveProjectId] = useState("");

  const [projects, setProjects] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [labour, setLabour] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [invoices, setInvoices] = useState([]);

  const [projectForm, setProjectForm] = useState({
    name: "",
    client_name: "",
    site_address: "",
    contract_value: "",
    status: "Live",
    start_date: today,
    target_completion_date: "",
    notes: "",
  });

  const [editingProjectId, setEditingProjectId] = useState(null);

  async function loadData() {
    const { data: projectData } = await supabase.from("projects").select("*").order("id");
    const { data: budgetData } = await supabase.from("budgets").select("*").order("id");
    const { data: labourData } = await supabase.from("labour").select("*").order("id");
    const { data: poData } = await supabase.from("purchase_orders").select("*").order("po_date", { ascending: false });
    const { data: invoiceRows } = await supabase.from("invoice_tracker").select("*").order("invoice_date", { ascending: false });

    setProjects(projectData || []);
    setBudgets(budgetData || []);
    setLabour(labourData || []);
    setPurchaseOrders(poData || []);
    setInvoices(invoiceRows || []);
    setConnection("Supabase connected successfully.");
  }

  useEffect(() => {
    loadData();
  }, []);

  const activeProject = projects.find((p) => String(p.id) === String(activeProjectId));

  function byProject(rows) {
    if (!activeProjectId) return rows;
    return rows.filter((row) => String(row.project_id) === String(activeProjectId));
  }

  const projectBudgets = byProject(budgets);
  const projectLabour = byProject(labour);
  const projectPOs = byProject(purchaseOrders);
  const projectInvoices = byProject(invoices);

  const totalBudget = projectBudgets.reduce((s, b) => s + Number(b.budget || 0), 0);
  const totalLabour = projectLabour.reduce((s, l) => s + Number(l.total_cost || 0), 0);
  const totalPOs = projectPOs.reduce((s, p) => s + Number(p.gross_amount || 0), 0);
  const totalInvoiced = projectInvoices.reduce((s, i) => s + Number(i.gross_amount || 0), 0);

  async function saveProject() {
    const payload = {
      name: projectForm.name,
      client_name: projectForm.client_name,
      site_address: projectForm.site_address,
      contract_value: Number(projectForm.contract_value || 0),
      status: projectForm.status,
      start_date: projectForm.start_date,
      target_completion_date: projectForm.target_completion_date,
      notes: projectForm.notes,
    };

    if (editingProjectId) {
      await supabase.from("projects").update(payload).eq("id", editingProjectId);
    } else {
      const { data } = await supabase.from("projects").insert([payload]).select().single();
      if (data?.id) setActiveProjectId(String(data.id));
    }

    setProjectForm({
      name: "",
      client_name: "",
      site_address: "",
      contract_value: "",
      status: "Live",
      start_date: today,
      target_completion_date: "",
      notes: "",
    });

    setEditingProjectId(null);
    loadData();
  }

  function editProject(project) {
    setProjectForm(project);
    setEditingProjectId(project.id);
  }

  async function deleteProject(id) {
    await supabase.from("projects").delete().eq("id", id);
    loadData();
  }

  const tabs = ["Dashboard", "Budget", "Labour", "POs", "Invoices", "Projects"];

  return (
    <div style={{ padding: 30, fontFamily: "Arial", background: "#f7f7f7", minHeight: "100vh" }}>
      <Header />

      <div style={tabsStyle}>
        {tabs.map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={activeTab === tab ? activeTabButton : tabButton}>
            {tab}
          </button>
        ))}
           <div style={formBox}>
        <strong>Active Project:</strong>
        <select
          style={inputStyle}
          value={activeProjectId}
          onChange={(e) => setActiveProjectId(e.target.value)}
        >
          <option value="">All Projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {activeTab === "Dashboard" && (
        <>
          <div style={grid4}>
            <Card title="Contract Value" value={currency(activeProject?.contract_value || 0)} />
            <Card title="Invoiced" value={currency(totalInvoiced)} />
            <Card title="Labour" value={currency(totalLabour)} />
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

      {activeTab === "Projects" && (
        <Section title="Projects">
          <div style={formBox}>
            <FormInput label="Project Name" value={projectForm.name || ""} onChange={(v) => setProjectForm({ ...projectForm, name: v })} />
            <FormInput label="Client Name" value={projectForm.client_name || ""} onChange={(v) => setProjectForm({ ...projectForm, client_name: v })} />
            <FormInput label="Site Address" value={projectForm.site_address || ""} onChange={(v) => setProjectForm({ ...projectForm, site_address: v })} />
            <FormInput label="Contract Value" type="number" value={projectForm.contract_value || ""} onChange={(v) => setProjectForm({ ...projectForm, contract_value: v })} />

            <button style={buttonDark} onClick={saveProject}>
              {editingProjectId ? "Save Changes" : "Add Project"}
            </button>
          </div>

          <Table headers={["Project", "Client", "Address", "Value", "Actions"]}>
            {projects.map((p) => (
              <tr key={p.id}>
                <td style={td}>{p.name}</td>
                <td style={td}>{p.client_name}</td>
                <td style={td}>{p.site_address}</td>
                <td style={td}>{currency(p.contract_value)}</td>
                <td style={td}>
                  <button style={smallButton} onClick={() => setActiveProjectId(String(p.id))}>Open</button>
                  <button style={smallButton} onClick={() => editProject(p)}>Edit</button>
                  <button style={smallDangerButton} onClick={() => deleteProject(p.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </Table>
        </Section>
           )}
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
      <div style={{ fontSize: small ? 14 : 24 }}>{value}</div>
    </div>
  );
}

function Table({ headers, children }) {
  return (
    <table style={{ width: "100%", marginTop: 16 }}>
      <thead>
        <tr>
          {headers.map((h) => (
            <th key={h}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
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

const grid4 = { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 };
const th = { padding: 12 };
const td = { padding: 12 };
const tabsStyle = { display: "flex", gap: 8, marginTop: 20, flexWrap: "wrap" };
const tabButton = { padding: "10px 14px" };
const activeTabButton = { ...tabButton, background: "#111827", color: "white" };
const labelStyle = { display: "block", marginBottom: 12 };
const inputStyle = { display: "block", width: "100%", padding: 10 };
const buttonDark = { padding: "10px 14px", background: "#111827", color: "white", marginTop: 8 };
const smallButton = { padding: "6px 10px", marginRight: 8 };
const smallDangerButton = { ...smallButton, background: "#fee2e2" };
const formBox = { padding: 20, background: "#f9fafb", marginTop: 20 };

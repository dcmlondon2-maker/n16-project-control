import React, { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { supabase } from "./supabaseClient";

const currency = (n) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(Number(n || 0));

const today = new Date().toISOString().split("T")[0];



export default function App() {
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [connection, setConnection] = useState("Checking database...");
  const [activeProjectId, setActiveProjectId] = useState(localStorage.getItem("activeProjectId") || "");

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
  const [expenses, setExpenses] = useState([]);
  const [snags, setSnags] = useState([]);
  const [siteReport, setSiteReport] = useState("");
  const [openingBalance, setOpeningBalance] = useState(10000);  const [aiPrompt, setAiPrompt] = useState("");
  const [aiReply, setAiReply] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  
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

  const [expenseForm, setExpenseForm] = useState({
    expense_date: today,
    supplier: "",
    category: "",
    description: "",
    status: "Unpaid",
    net_amount: "",
    vat_amount: "",
    notes: "",
  });

  const [snagForm, setSnagForm] = useState({
    snag_date: today,
    location: "",
    description: "",
    priority: "Medium",
    status: "Open",
    assigned_to: "",
    notes: "",
  });

  const [receiptFile, setReceiptFile] = useState(null);
  const [snagPhoto, setSnagPhoto] = useState(null);

  async function loadData() {
    try {
      const { data: projectData, error: projectError } = await supabase.from("projects").select("*").order("id");
      if (projectError) throw projectError;

      const { data: budgetData } = await supabase.from("budgets").select("*").order("id");
      const { data: labourData } = await supabase.from("labour").select("*").order("id");
      const { data: poData } = await supabase.from("purchase_orders").select("*").order("po_date", { ascending: false });
      const { data: profitRows } = await supabase.from("profit_tracker").select("*").order("id");
      const { data: invoiceRows } = await supabase.from("invoice_tracker").select("*").order("invoice_date", { ascending: false });
      const { data: variationRows } = await supabase.from("variation_tracker").select("*").order("submitted_date", { ascending: false });
      const { data: subRows } = await supabase.from("subcontractor_payments").select("*").order("invoice_date", { ascending: false });
      const { data: diaryRows } = await supabase.from("site_diary").select("*").order("diary_date", { ascending: false });
      const { data: noteRows } = await supabase.from("project_notes").select("*").order("note_date", { ascending: false });
      const { data: expenseRows } = await supabase.from("expenses_tracker").select("*").order("expense_date", { ascending: false });
      const { data: snagRows } = await supabase.from("snagging_tracker").select("*").order("snag_date", { ascending: false });

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
      setExpenses(expenseRows || []);
      setSnags(snagRows || []);
      setConnection("Supabase connected successfully.");
    } catch (error) {
      console.error(error);
      setConnection("Database error. Check Supabase tables/columns.");
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (activeProjectId) {
      localStorage.setItem("activeProjectId", activeProjectId);
    } else {
      localStorage.removeItem("activeProjectId");
    }
  }, [activeProjectId]);

  const activeProject = projects.find((p) => String(p.id) === String(activeProjectId));

  function byProject(rows) {
    if (!activeProjectId) return rows;
    return rows.filter((row) => String(row.project_id || "") === String(activeProjectId));
  }

  function requireProject() {
    if (!activeProjectId) {
      alert("Please create or select a project first.");
      setActiveTab("Projects");
      return false;
    }
    return true;
  }

  const projectBudgets = byProject(budgets);
  const projectLabour = byProject(labour);
  const projectPOs = byProject(purchaseOrders);
  const projectProfitData = byProject(profitData);
  const projectInvoices = byProject(invoices);
  const projectVariations = byProject(variations);
  const projectSubcontractors = byProject(subcontractors);
  const projectDiaryEntries = byProject(diaryEntries);
  const projectNotes = byProject(notes);
  const projectExpenses = byProject(expenses);
  const projectSnags = byProject(snags);

  async function saveProject() {
    if (!projectForm.name) {
      alert("Project name is required.");
      return;
    }

    const payload = {
      name: projectForm.name,
      client_name: projectForm.client_name,
      site_address: projectForm.site_address,
      contract_value: Number(projectForm.contract_value || 0),
      status: projectForm.status,
      start_date: projectForm.start_date || null,
      target_completion_date: projectForm.target_completion_date || null,
      notes: projectForm.notes,
    };

    if (editingProjectId) {
      const { error } = await supabase.from("projects").update(payload).eq("id", editingProjectId);
      if (error) {
        alert("Project update failed. Check Supabase columns.");
        console.error(error);
        return;
      }
    } else {
      const { data, error } = await supabase.from("projects").insert([payload]).select().single();
      if (error) {
        alert("Project save failed. Check Supabase columns.");
        console.error(error);
        return;
      }
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
    setProjectForm({
      name: project.name || "",
      client_name: project.client_name || "",
      site_address: project.site_address || "",
      contract_value: project.contract_value || "",
      status: project.status || "Live",
      start_date: project.start_date || today,
      target_completion_date: project.target_completion_date || "",
      notes: project.notes || "",
    });
    setEditingProjectId(project.id);
  }

  async function deleteProject(id) {
    const confirmDelete = window.confirm("Delete this project? This will not delete old records, but they may lose their project link.");
    if (!confirmDelete) return;

    await supabase.from("projects").delete().eq("id", id);
    if (String(activeProjectId) === String(id)) setActiveProjectId("");
    loadData();
  }

  function cancelProjectEdit() {
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
  }

  async function saveExpense() {
    if (!requireProject()) return;
    if (!expenseForm.supplier) {
      alert("Supplier is required.");
      return;
    }

    let receiptUrl = "";
    if (receiptFile) {
      const fileName = `${Date.now()}-${receiptFile.name}`;
      const { error: uploadError } = await supabase.storage.from("receipts").upload(fileName, receiptFile);
      if (uploadError) {
        alert("Receipt upload failed. Check the Supabase receipts bucket is public.");
        console.error(uploadError);
        return;
      }
      const { data } = supabase.storage.from("receipts").getPublicUrl(fileName);
      receiptUrl = data.publicUrl;
    }

    const net = Number(expenseForm.net_amount || 0);
    const vat = Number(expenseForm.vat_amount || 0);

    await supabase.from("expenses_tracker").insert([
      {
        project_id: Number(activeProjectId),
        expense_date: expenseForm.expense_date,
        supplier: expenseForm.supplier,
        category: expenseForm.category,
        description: expenseForm.description,
        status: expenseForm.status,
        net_amount: net,
        vat_amount: vat,
        gross_amount: net + vat,
        receipt_url: receiptUrl,
        notes: expenseForm.notes,
      },
    ]);

    setExpenseForm({ expense_date: today, supplier: "", category: "", description: "", status: "Unpaid", net_amount: "", vat_amount: "", notes: "" });
    setReceiptFile(null);
    loadData();
  }

  async function deleteExpense(id) {
    const confirmDelete = window.confirm("Delete this expense?");
    if (!confirmDelete) return;
    await supabase.from("expenses_tracker").delete().eq("id", id);
    loadData();
  }

  async function saveSnag() {
    if (!requireProject()) return;
    if (!snagForm.description) {
      alert("Snag description is required.");
      return;
    }

    let photoUrl = "";
    if (snagPhoto) {
      const fileName = `${Date.now()}-${snagPhoto.name}`;
      const { error: uploadError } = await supabase.storage.from("snag-photos").upload(fileName, snagPhoto);
      if (uploadError) {
        alert("Photo upload failed. Check the Supabase snag-photos bucket is public.");
        console.error(uploadError);
        return;
      }
      const { data } = supabase.storage.from("snag-photos").getPublicUrl(fileName);
      photoUrl = data.publicUrl;
    }

    await supabase.from("snagging_tracker").insert([
      {
        project_id: Number(activeProjectId),
        snag_date: snagForm.snag_date,
        location: snagForm.location,
        description: snagForm.description,
        priority: snagForm.priority,
        status: snagForm.status,
        assigned_to: snagForm.assigned_to,
        photo_url: photoUrl,
        notes: snagForm.notes,
      },
    ]);

    setSnagForm({ snag_date: today, location: "", description: "", priority: "Medium", status: "Open", assigned_to: "", notes: "" });
    setSnagPhoto(null);
    loadData();
  }

  async function deleteSnag(id) {
    const confirmDelete = window.confirm("Delete this snag?");
    if (!confirmDelete) return;
    await supabase.from("snagging_tracker").delete().eq("id", id);
    loadData();
  }

  async function saveDiary() {
    if (!requireProject()) return;
    await supabase.from("site_diary").insert([{ ...diaryForm, project_id: Number(activeProjectId) }]);
    setDiaryForm({ diary_date: today, weather: "", labour_on_site: "", work_completed: "", issues: "", voice_note: "" });
    loadData();
  }

  async function saveNote() {
    if (!requireProject()) return;
    await supabase.from("project_notes").insert([{ ...noteForm, project_id: Number(activeProjectId) }]);
    setNoteForm({ note_date: today, title: "", note: "", voice_note: "" });
    loadData();
  }

  function startVoice(target, field) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
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
      if (target === "diary") setDiaryForm((prev) => ({ ...prev, [field]: prev[field] ? prev[field] + " " + text : text }));
      if (target === "note") setNoteForm((prev) => ({ ...prev, [field]: prev[field] ? prev[field] + " " + text : text }));
      if (target === "snag") setSnagForm((prev) => ({ ...prev, [field]: prev[field] ? prev[field] + " " + text : text }));
    };
  }

  function generateSiteReport() {
    const latest = projectDiaryEntries[0];
    if (!latest) {
      setSiteReport("No site diary entries found for this project yet.");
      return;
    }

    const report = `
Site Report — ${latest.diary_date}
Project: ${activeProject?.name || "All Projects"}

Weather: ${latest.weather || "Not recorded"}.
Labour on site: ${latest.labour_on_site || "Not recorded"}.
Works completed: ${latest.work_completed || "No works recorded"}.
Issues / delays: ${latest.issues || "No issues recorded"}.
Voice note: ${latest.voice_note || "No voice note recorded"}.

Summary: Works progressed on site. Labour attendance, weather conditions and site issues have been recorded for project control and future reference.
    `;
    setSiteReport(report.trim());
  }
async function askAI() {
  if (!aiPrompt.trim()) return;

  setAiLoading(true);

  try {
    const response = await fetch("/api/ai", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
  prompt: aiPrompt,
  context: {
    projectName: activeProject?.name || "All Projects",
    sellValue: contractWithVariations,
    labour: totalLabour,
    purchaseOrders: totalPOs,
    subbies: totalSubbies,
    expenses: totalExpenseGross,
    otherCosts: Number(latestProfit.other_cost || 0),
    invoices: totalInvoiced,
    paid: totalPaid,
    outstanding: totalOutstanding,
    openSnags,
    highPrioritySnags
  }
}),
    });

    const data = await response.json();
    setAiReply(data.reply || "No reply.");
  } catch (error) {
    setAiReply("AI failed.");
  }

  setAiLoading(false);
}  function readAloud() {
    if (!siteReport) {
      alert("Generate a site report first.");
      return;
    }
    const utterance = new SpeechSynthesisUtterance(siteReport);
    utterance.lang = "en-GB";
    utterance.rate = 0.95;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }

  function exportSiteReportPdf() {
    if (!siteReport) {
      alert("Generate a site report first.");
      return;
    }
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Popup blocked. Please allow popups for this site.");
      return;
    }
    printWindow.document.write(`
      <html><head><title>N16 Site Report</title><style>
      body{font-family:Arial,sans-serif;padding:40px;line-height:1.6;color:#111827} h1{margin-bottom:6px}.meta{color:#666;margin-bottom:24px} pre{white-space:pre-wrap;font-family:Arial,sans-serif;font-size:14px}
      </style></head><body><h1>N16 Site Report</h1><div class="meta">Generated from Project Control Dashboard</div><pre>${siteReport}</pre></body></html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  const totalBudget = projectBudgets.reduce((s, b) => s + Number(b.budget || 0), 0);
  const totalSpent = projectBudgets.reduce((s, b) => s + Number(b.spent || 0), 0);
  const totalRemaining = projectBudgets.reduce((s, b) => s + Number(b.remaining || 0), 0);
  const totalLabour = projectLabour.reduce((s, l) => s + Number(l.total_cost || 0), 0);
  const totalPOs = projectPOs.reduce((s, p) => s + Number(p.gross_amount || 0), 0);

  const totalInvoiced = projectInvoices.reduce((s, i) => s + Number(i.gross_amount || 0), 0);
  const totalPaid = projectInvoices.reduce((s, i) => s + Number(i.paid_amount || 0), 0);
  const totalOutstanding = totalInvoiced - totalPaid;

  const totalVariations = projectVariations.reduce((s, v) => s + Number(v.gross_amount || 0), 0);
  const approvedVariations = projectVariations.filter((v) => v.status === "Approved").reduce((s, v) => s + Number(v.gross_amount || 0), 0);

  const totalSubbies = projectSubcontractors.reduce((s, x) => s + Number(x.gross_amount || 0), 0);
  const totalSubbiesPaid = projectSubcontractors.reduce((s, x) => s + Number(x.paid_amount || 0), 0);
  const totalSubbiesOutstanding = totalSubbies - totalSubbiesPaid;

  const totalExpenseNet = projectExpenses.reduce((s, e) => s + Number(e.net_amount || 0), 0);
  const totalExpenseVat = projectExpenses.reduce((s, e) => s + Number(e.vat_amount || 0), 0);
  const totalExpenseGross = projectExpenses.reduce((s, e) => s + Number(e.gross_amount || 0), 0);
function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function weekLabel(date) {
  return `W/C ${date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  })}`;
}

const cashflowData = Array.from({ length: 12 }, (_, index) => {
  const weekStart = addDays(new Date(), index * 7);
  const weekEnd = addDays(weekStart, 6);

  const cashIn = projectInvoices
    .filter((i) => {
      const d = new Date(i.due_date || i.invoice_date);
      return d >= weekStart && d <= weekEnd;
    })
    .reduce((s, i) => {
      const outstanding = Number(i.gross_amount || 0) - Number(i.paid_amount || 0);
      return s + Math.max(outstanding, 0);
    }, 0);

  const labourOut = projectLabour
    .filter((l) => {
      const d = new Date(l.week_ending || l.labour_date || l.date || today);
      return d >= weekStart && d <= weekEnd;
    })
    .reduce((s, l) => s + Number(l.total_cost || 0), 0);

  const expenseOut = projectExpenses
    .filter((e) => {
      const d = new Date(e.expense_date || today);
      return d >= weekStart && d <= weekEnd && e.status !== "Paid";
    })
    .reduce((s, e) => s + Number(e.gross_amount || 0), 0);

  const subbieOut = projectSubcontractors
    .filter((x) => {
      const d = new Date(x.due_date || x.invoice_date || today);
      return d >= weekStart && d <= weekEnd;
    })
    .reduce((s, x) => {
      const outstanding = Number(x.gross_amount || 0) - Number(x.paid_amount || 0);
      return s + Math.max(outstanding, 0);
    }, 0);

  const poOut = projectPOs
    .filter((p) => {
      const d = new Date(p.delivery_date || p.po_date || today);
      return d >= weekStart && d <= weekEnd;
    })
    .reduce((s, p) => s + Number(p.gross_amount || 0), 0);

  return {
    week: weekLabel(weekStart),
    cashIn,
    cashOut: labourOut + expenseOut + subbieOut + poOut,
  };
}).reduce((rows, row, index) => {
  const previousBalance = index === 0 ? Number(openingBalance || 0) : rows[index - 1].balance;
  rows.push({
    ...row,
    balance: previousBalance + row.cashIn - row.cashOut,
  });
  return rows;
}, []);

const lowestCashWeek = cashflowData.reduce(
  (lowest, row) => (row.balance < lowest.balance ? row : lowest),
  cashflowData[0]
);  const openSnags = projectSnags.filter((s) => s.status !== "Closed").length;
  const closedSnags = projectSnags.filter((s) => s.status === "Closed").length;
  const highPrioritySnags = projectSnags.filter((s) => s.priority === "High").length;

  const latestProfit = projectProfitData[0] || {};
  const contractWithVariations = Number(activeProject?.contract_value || latestProfit.contract_value || 0) + approvedVariations;
const vatRate = 20;
const contractVat = contractWithVariations * (vatRate / 100);
const contractIncVat = contractWithVariations + contractVat;

const totalProjectCosts =
  Number(latestProfit.budget_cost || 0) +
  totalLabour +
  totalPOs +
  totalSubbies +
  totalExpenseGross +
  Number(latestProfit.other_cost || 0);

const expectedProfit = contractWithVariations - totalProjectCosts;
const expectedMargin =
  contractWithVariations > 0
    ? ((expectedProfit / contractWithVariations) * 100).toFixed(1)
    : 0;  const liveProfit =
    contractWithVariations -
    Number(latestProfit.budget_cost || 0) -
    totalLabour -
    totalPOs -
    totalSubbies -
    totalExpenseGross -
    Number(latestProfit.other_cost || 0);

  const margin = contractWithVariations > 0 ? ((liveProfit / contractWithVariations) * 100).toFixed(1) : 0;

  const tabs = ["Dashboard", "AI Assistant", "Budget", "Labour", "POs", "Invoices", "Variations", "Subbies", "Expenses", "Snagging", "Profit", "Site Diary", "Notes", "Projects"];

  return (
    <div style={{ padding: 30, fontFamily: "Arial", background: "#f7f7f7", minHeight: "100vh" }}>
      <Header activeProject={activeProject} />

      <div style={tabsStyle}>
        {tabs.map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={activeTab === tab ? activeTabButton : tabButton}>
            {tab}
          </button>
        ))}
      </div>

      <ProjectSelector projects={projects} activeProjectId={activeProjectId} setActiveProjectId={setActiveProjectId} activeProject={activeProject} setActiveTab={setActiveTab} />
{activeTab === "AI Assistant" && (
  <Section title="AI Assistant">
    <FormArea
      label="Ask AI"
      value={aiPrompt}
      onChange={setAiPrompt}
    />
    <button style={buttonDark} onClick={askAI}>
      {aiLoading ? "Thinking..." : "Ask AI"}
    </button>

    <div style={reportBox}>
      <pre style={{ whiteSpace: "pre-wrap" }}>
        {aiReply}
      </pre>
    </div>
  </Section>
)}      {activeTab === "Dashboard" && (
        <>
          <div style={grid4}>
            <Card title="Contract + Variations" value={currency(contractWithVariations)} />
            <Card title="Invoiced" value={currency(totalInvoiced)} />
            <Card title="Outstanding" value={currency(totalOutstanding)} />
            <Card title="Database" value={connection} small />
          </div>

          <Section title="Cashflow Forecast">
  <div style={formBox}>
    <FormInput
      label="Opening Bank Balance"
      type="number"
      value={openingBalance}
      onChange={setOpeningBalance}
    />
  </div>

  <div style={grid3}>
    <Card title="Lowest Forecast Balance" value={currency(lowestCashWeek?.balance || 0)} />
    <Card title="Lowest Week" value={lowestCashWeek?.week || "-"} />
    <Card
      title="Cashflow Status"
      value={(lowestCashWeek?.balance || 0) < 0 ? "Warning: Goes Negative" : "Healthy"}
    />
  </div>

  <div style={{ height: 300 }}>
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={cashflowData}>
        <XAxis dataKey="week" />
        <YAxis />
        <Tooltip formatter={(value) => currency(value)} />
        <Line type="monotone" dataKey="balance" stroke="#ff6600" strokeWidth={3} />
      </LineChart>
    </ResponsiveContainer>
  </div>

      <Table headers={["Week", "Cash In", "Cash Out", "Balance"]}>
    {cashflowData.map((row) => (
      <tr key={row.week}>
        <td style={td}>{row.week}</td>
        <td style={td}>{currency(row.cashIn)}</td>
        <td style={td}>{currency(row.cashOut)}</td>
        <td style={td}>{currency(row.balance)}</td>
      </tr>
    ))}
  </Table>
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
        </Section>
      )}

      {activeTab === "Labour" && (
        <Section title="Labour Tracker">
          <div style={grid3}>
            <Card title="Labour" value={currency(totalLabour)} />
            <Card title="Entries" value={projectLabour.length} />
            <Card title="Avg" value={currency(projectLabour.length ? totalLabour / projectLabour.length : 0)} />
          </div>
        </Section>
      )}

      {activeTab === "POs" && (
        <Section title="PO Tracker">
          <div style={grid3}>
            <Card title="PO Value" value={currency(totalPOs)} />
            <Card title="PO Count" value={projectPOs.length} />
            <Card title="Latest" value={projectPOs[0]?.po_number || "None"} />
          </div>
        </Section>
      )}

      {activeTab === "Invoices" && (
        <Section title="Invoice Tracker">
          <div style={grid3}>
            <Card title="Invoiced" value={currency(totalInvoiced)} />
            <Card title="Paid" value={currency(totalPaid)} />
            <Card title="Outstanding" value={currency(totalOutstanding)} />
          </div>
        </Section>
      )}

      {activeTab === "Variations" && (
        <Section title="Variation Tracker">
          <div style={grid3}>
            <Card title="Variations" value={currency(totalVariations)} />
            <Card title="Approved" value={currency(approvedVariations)} />
            <Card title="Count" value={projectVariations.length} />
          </div>
        </Section>
      )}

      {activeTab === "Subbies" && (
        <Section title="Subcontractor Payment Tracker">
          <div style={grid3}>
            <Card title="Subbies Due" value={currency(totalSubbies)} />
            <Card title="Subbies Paid" value={currency(totalSubbiesPaid)} />
            <Card title="Outstanding" value={currency(totalSubbiesOutstanding)} />
          </div>
        </Section>
      )}

      {activeTab === "Expenses" && (
        <Section title="Expenses / Receipts Tracker">
          <div style={grid3}>
            <Card title="Expenses Net" value={currency(totalExpenseNet)} />
            <Card title="VAT" value={currency(totalExpenseVat)} />
            <Card title="Gross" value={currency(totalExpenseGross)} />
          </div>

          <div style={formBox}>
            <h3>Add Expense / Receipt</h3>
            <ProjectWarning activeProject={activeProject} />
            <FormInput label="Date" type="date" value={expenseForm.expense_date} onChange={(v) => setExpenseForm({ ...expenseForm, expense_date: v })} />
            <FormInput label="Supplier" value={expenseForm.supplier} onChange={(v) => setExpenseForm({ ...expenseForm, supplier: v })} />
            <FormInput label="Category" value={expenseForm.category} onChange={(v) => setExpenseForm({ ...expenseForm, category: v })} />
            <FormInput label="Description" value={expenseForm.description} onChange={(v) => setExpenseForm({ ...expenseForm, description: v })} />
            <FormInput label="Status" value={expenseForm.status} onChange={(v) => setExpenseForm({ ...expenseForm, status: v })} />
            <FormInput label="Net Amount" type="number" value={expenseForm.net_amount} onChange={(v) => setExpenseForm({ ...expenseForm, net_amount: v })} />
            <FormInput label="VAT Amount" type="number" value={expenseForm.vat_amount} onChange={(v) => setExpenseForm({ ...expenseForm, vat_amount: v })} />
            <FormArea label="Notes" value={expenseForm.notes} onChange={(v) => setExpenseForm({ ...expenseForm, notes: v })} />
            <label style={labelStyle}>Receipt Photo / File<input style={inputStyle} type="file" accept="image/*,.pdf" onChange={(e) => setReceiptFile(e.target.files[0])} /></label>
            <button style={buttonDark} onClick={saveExpense}>Save Expense</button>
          </div>

          <Table headers={["Date", "Supplier", "Category", "Status", "Net", "VAT", "Gross", "Receipt", "Actions"]}>
            {projectExpenses.map((e) => (
              <tr key={e.id}>
                <td style={td}>{e.expense_date}</td><td style={td}>{e.supplier}</td><td style={td}>{e.category}</td><td style={td}>{e.status}</td><td style={td}>{currency(e.net_amount)}</td><td style={td}>{currency(e.vat_amount)}</td><td style={td}>{currency(e.gross_amount)}</td><td style={td}>{e.receipt_url ? <a href={e.receipt_url} target="_blank" rel="noreferrer">View</a> : "-"}</td><td style={td}><button style={smallDangerButton} onClick={() => deleteExpense(e.id)}>Delete</button></td>
              </tr>
            ))}
          </Table>
        </Section>
      )}

      {activeTab === "Snagging" && (
        <Section title="Snagging / Defect Photos">
          <div style={grid3}>
            <Card title="Open Snags" value={openSnags} />
            <Card title="Closed Snags" value={closedSnags} />
            <Card title="High Priority" value={highPrioritySnags} />
          </div>
          <div style={formBox}>
            <h3>Add Snag / Defect</h3>
            <ProjectWarning activeProject={activeProject} />
            <FormInput label="Date" type="date" value={snagForm.snag_date} onChange={(v) => setSnagForm({ ...snagForm, snag_date: v })} />
            <FormInput label="Location" value={snagForm.location} onChange={(v) => setSnagForm({ ...snagForm, location: v })} />
            <FormArea label="Description" value={snagForm.description} onChange={(v) => setSnagForm({ ...snagForm, description: v })} />
            <FormInput label="Priority" value={snagForm.priority} onChange={(v) => setSnagForm({ ...snagForm, priority: v })} />
            <FormInput label="Status" value={snagForm.status} onChange={(v) => setSnagForm({ ...snagForm, status: v })} />
            <FormInput label="Assigned To" value={snagForm.assigned_to} onChange={(v) => setSnagForm({ ...snagForm, assigned_to: v })} />
            <FormArea label="Notes" value={snagForm.notes} onChange={(v) => setSnagForm({ ...snagForm, notes: v })} />
            <label style={labelStyle}>Defect Photo<input style={inputStyle} type="file" accept="image/*" onChange={(e) => setSnagPhoto(e.target.files[0])} /></label>
            <button style={button} onClick={() => startVoice("snag", "description")}>🎤 Voice Description</button>
            <button style={buttonDark} onClick={saveSnag}>Save Snag</button>
          </div>
          <Table headers={["Date", "Location", "Description", "Priority", "Status", "Assigned", "Photo", "Actions"]}>
            {projectSnags.map((s) => (
              <tr key={s.id}>
                <td style={td}>{s.snag_date}</td><td style={td}>{s.location}</td><td style={td}>{s.description}</td><td style={td}>{s.priority}</td><td style={td}>{s.status}</td><td style={td}>{s.assigned_to}</td><td style={td}>{s.photo_url ? <a href={s.photo_url} target="_blank" rel="noreferrer">View</a> : "-"}</td><td style={td}><button style={smallDangerButton} onClick={() => deleteSnag(s.id)}>Delete</button></td>
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
          <ProjectWarning activeProject={activeProject} />
          <FormInput label="Date" type="date" value={diaryForm.diary_date} onChange={(v) => setDiaryForm({ ...diaryForm, diary_date: v })} />
          <FormInput label="Weather" value={diaryForm.weather} onChange={(v) => setDiaryForm({ ...diaryForm, weather: v })} />
          <FormInput label="Labour on Site" value={diaryForm.labour_on_site} onChange={(v) => setDiaryForm({ ...diaryForm, labour_on_site: v })} />
          <FormArea label="Work Completed" value={diaryForm.work_completed} onChange={(v) => setDiaryForm({ ...diaryForm, work_completed: v })} />
          <FormArea label="Issues" value={diaryForm.issues} onChange={(v) => setDiaryForm({ ...diaryForm, issues: v })} />
          <FormArea label="Voice Note" value={diaryForm.voice_note} onChange={(v) => setDiaryForm({ ...diaryForm, voice_note: v })} />
          <button style={button} onClick={() => startVoice("diary", "voice_note")}>🎤 Voice Entry</button>
          <button style={buttonDark} onClick={saveDiary}>Save Diary</button>
          <button style={buttonDark} onClick={generateSiteReport}>Generate Site Report</button>
          <button style={button} onClick={readAloud}>🔊 Read Aloud</button>
          <button style={buttonDark} onClick={exportSiteReportPdf}>📄 Export PDF</button>

          {siteReport && <div style={reportBox}><h3>AI Site Report Summary</h3><pre style={{ whiteSpace: "pre-wrap", fontFamily: "Arial" }}>{siteReport}</pre></div>}

          <Table headers={["Date", "Weather", "Labour", "Work", "Issues", "Voice Note"]}>
            {projectDiaryEntries.map((d) => (
              <tr key={d.id}>
                <td style={td}>{d.diary_date}</td><td style={td}>{d.weather}</td><td style={td}>{d.labour_on_site}</td><td style={td}>{d.work_completed}</td><td style={td}>{d.issues}</td><td style={td}>{d.voice_note}</td>
              </tr>
            ))}
          </Table>
        </Section>
      )}

      {activeTab === "Notes" && (
        <Section title="Project Notes">
          <ProjectWarning activeProject={activeProject} />
          <FormInput label="Date" type="date" value={noteForm.note_date} onChange={(v) => setNoteForm({ ...noteForm, note_date: v })} />
          <FormInput label="Title" value={noteForm.title} onChange={(v) => setNoteForm({ ...noteForm, title: v })} />
          <FormArea label="Note" value={noteForm.note} onChange={(v) => setNoteForm({ ...noteForm, note: v })} />
          <FormArea label="Voice Note" value={noteForm.voice_note} onChange={(v) => setNoteForm({ ...noteForm, voice_note: v })} />
          <button style={button} onClick={() => startVoice("note", "voice_note")}>🎤 Voice Entry</button>
          <button style={buttonDark} onClick={saveNote}>Save Note</button>

          <Table headers={["Date", "Title", "Note", "Voice Note"]}>
            {projectNotes.map((n) => (
              <tr key={n.id}>
                <td style={td}>{n.note_date}</td><td style={td}>{n.title}</td><td style={td}>{n.note}</td><td style={td}>{n.voice_note}</td>
              </tr>
            ))}
          </Table>
        </Section>
      )}

      {activeTab === "Projects" && (
        <Section title="Projects">
          <div style={formBox}>
            <h3>{editingProjectId ? "Edit Project" : "Add Project"}</h3>
            <FormInput label="Project Name" value={projectForm.name} onChange={(v) => setProjectForm({ ...projectForm, name: v })} />
            <FormInput label="Client Name" value={projectForm.client_name} onChange={(v) => setProjectForm({ ...projectForm, client_name: v })} />
            <FormInput label="Site Address" value={projectForm.site_address} onChange={(v) => setProjectForm({ ...projectForm, site_address: v })} />
            <FormInput label="Contract Value" type="number" value={projectForm.contract_value} onChange={(v) => setProjectForm({ ...projectForm, contract_value: v })} />
            <FormInput label="Status" value={projectForm.status} onChange={(v) => setProjectForm({ ...projectForm, status: v })} />
            <FormInput label="Start Date" type="date" value={projectForm.start_date} onChange={(v) => setProjectForm({ ...projectForm, start_date: v })} />
            <FormInput label="Target Completion Date" type="date" value={projectForm.target_completion_date} onChange={(v) => setProjectForm({ ...projectForm, target_completion_date: v })} />
            <FormArea label="Notes" value={projectForm.notes} onChange={(v) => setProjectForm({ ...projectForm, notes: v })} />
            <button style={buttonDark} onClick={saveProject}>{editingProjectId ? "Save Changes" : "Add Project"}</button>
            {editingProjectId && <button style={button} onClick={cancelProjectEdit}>Cancel Edit</button>}
          </div>

          <Table headers={["Project", "Client", "Address", "Contract Value", "Status", "Actions"]}>
            {projects.map((p) => (
              <tr key={p.id}>
                <td style={td}>{p.name}</td><td style={td}>{p.client_name}</td><td style={td}>{p.site_address}</td><td style={td}>{currency(p.contract_value)}</td><td style={td}>{p.status}</td>
                <td style={td}>
                  <button style={smallButton} onClick={() => { setActiveProjectId(String(p.id)); setActiveTab("Dashboard"); }}>Open</button>
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

function Header({ activeProject }) {
  return (
    <div style={{ background: "#111827", color: "white", padding: 24, borderRadius: 16 }}>
      <h1 style={{ margin: 0 }}>N16 Project Control Dashboard</h1>
      <p style={{ marginBottom: 0 }}>Budget, cashflow, labour, POs, invoices, variations, expenses, snagging, diary and notes.</p>
      <p style={{ marginBottom: 0, marginTop: 10 }}><strong>Active Project:</strong> {activeProject?.name || "All Projects"}</p>
    </div>
  );
}

function ProjectSelector({ projects, activeProjectId, setActiveProjectId, activeProject, setActiveTab }) {
  return (
    <div style={projectSelectorBox}>
      <strong>Project Control: </strong>
      <select style={{ ...inputStyle, maxWidth: 420, display: "inline-block", marginLeft: 12 }} value={activeProjectId} onChange={(e) => setActiveProjectId(e.target.value)}>
        <option value="">All Projects</option>
        {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
      <button style={buttonDark} onClick={() => setActiveTab("Projects")}>Add / Edit Project</button>
      {activeProject ? <p style={{ marginBottom: 0 }}>Viewing: <strong>{activeProject.name}</strong> — {activeProject.client_name || "No client"}</p> : <p style={{ marginBottom: 0 }}>No single project selected. Totals show all projects.</p>}
    </div>
  );
}

function ProjectWarning({ activeProject }) {
  if (activeProject) return <p style={successBox}>Saving to project: <strong>{activeProject.name}</strong></p>;
  return <p style={warningBox}>Select or create a project before saving this item.</p>;
}

function Section({ title, children }) {
  return <div style={{ marginTop: 24, background: "white", padding: 24, borderRadius: 16 }}><h2>{title}</h2>{children}</div>;
}

function Card({ title, value, small }) {
  return <div style={{ background: "white", padding: 20, borderRadius: 16, border: "1px solid #ddd" }}><div style={{ color: "#666", fontSize: 14 }}>{title}</div><div style={{ fontSize: small ? 14 : 24, fontWeight: 700, marginTop: 8 }}>{value}</div></div>;
}

function Table({ headers, children }) {
  return <div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse", marginTop: 16 }}><thead><tr style={{ background: "#111827", color: "white" }}>{headers.map((h) => <th key={h} style={th}>{h}</th>)}</tr></thead><tbody>{children}</tbody></table></div>;
}

function FormInput({ label, value, onChange, type = "text" }) {
  return <label style={labelStyle}>{label}<input style={inputStyle} type={type} value={value} onChange={(e) => onChange(e.target.value)} /></label>;
}

function FormArea({ label, value, onChange }) {
  return <label style={labelStyle}>{label}<textarea style={areaStyle} value={value} onChange={(e) => onChange(e.target.value)} /></label>;
}

const grid4 = { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginTop: 24 };
const grid3 = { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 20 };
const th = { padding: 12, border: "1px solid #ddd", textAlign: "left" };
const td = { padding: 12, border: "1px solid #ddd" };

const tabsStyle = { display: "flex", gap: 8, flexWrap: "wrap", marginTop: 20 };
const tabButton = { padding: "10px 14px", borderRadius: 10, border: "1px solid #ddd", background: "white", cursor: "pointer" };
const activeTabButton = { ...tabButton, background: "#111827", color: "white" };

const labelStyle = { display: "block", marginBottom: 12, fontWeight: 700 };
const inputStyle = { display: "block", width: "100%", padding: 10, marginTop: 6, borderRadius: 8, border: "1px solid #ccc", boxSizing: "border-box" };
const areaStyle = { ...inputStyle, minHeight: 80 };

const button = { padding: "10px 14px", marginRight: 10, marginTop: 8, borderRadius: 8, border: "1px solid #ccc", background: "white", cursor: "pointer" };
const buttonDark = { ...button, background: "#111827", color: "white" };
const smallButton = { padding: "6px 10px", marginRight: 8, borderRadius: 6, border: "1px solid #ccc", background: "white", cursor: "pointer" };
const smallDangerButton = { ...smallButton, background: "#fee2e2", border: "1px solid #fecaca" };

const reportBox = {
  marginTop: 20,
  padding: 20,
  background: "#f3f4f6",
  borderRadius: 12,
  border: "1px solid #ddd"
};

const formBox = {
  padding: 20,
  background: "#f9fafb",
  borderRadius: 12,
  border: "1px solid #ddd",
  marginBottom: 20
};

const projectSelectorBox = {
  ...formBox,
  marginTop: 20
};

const warningBox = {
  padding: 12,
  background: "#fff7ed",
  border: "1px solid #fed7aa",
  borderRadius: 8
};

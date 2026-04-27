import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

const currency = (n) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(Number(n || 0));

export default function App() {
  const [projects, setProjects] = useState([]);
  const [activeProjectId, setActiveProjectId] = useState("");
  const [projectForm, setProjectForm] = useState({
    name: "",
    client_name: "",
    contract_value: "",
  });

  async function loadProjects() {
    const { data } = await supabase.from("projects").select("*").order("id");
    setProjects(data || []);
  }

  useEffect(() => {
    loadProjects();
  }, []);

  async function saveProject() {
    await supabase.from("projects").insert([
      {
        name: projectForm.name,
        client_name: projectForm.client_name,
        contract_value: Number(projectForm.contract_value || 0),
      },
    ]);

    setProjectForm({
      name: "",
      client_name: "",
      contract_value: "",
    });

    loadProjects();
  }

  async function deleteProject(id) {
    await supabase.from("projects").delete().eq("id", id);
    loadProjects();
  }

  const activeProject = projects.find(
    (p) => String(p.id) === String(activeProjectId)
  );

  return (
    <div style={{ padding: 30, fontFamily: "Arial", background: "#f7f7f7", minHeight: "100vh" }}>
      <div style={{ background: "#111827", color: "white", padding: 24, borderRadius: 12 }}>
        <h1>N16 Project Control Dashboard</h1>
      </div>

      <div style={{ marginTop: 20, background: "white", padding: 20, borderRadius: 12 }}>
        <h2>Add Project</h2>

        <input
          placeholder="Project Name"
          value={projectForm.name}
          onChange={(e) =>
            setProjectForm({ ...projectForm, name: e.target.value })
          }
          style={inputStyle}
        />

        <input
          placeholder="Client Name"
          value={projectForm.client_name}
          onChange={(e) =>
            setProjectForm({ ...projectForm, client_name: e.target.value })
          }
          style={inputStyle}
        />

        <input
          placeholder="Contract Value"
          type="number"
          value={projectForm.contract_value}
          onChange={(e) =>
            setProjectForm({ ...projectForm, contract_value: e.target.value })
          }
          style={inputStyle}
        />

        <button onClick={saveProject} style={buttonDark}>
          Save Project
        </button>
      </div>

      <div style={{ marginTop: 20, background: "white", padding: 20, borderRadius: 12 }}>
        <h2>Select Project</h2>

        <select
          value={activeProjectId}
          onChange={(e) => setActiveProjectId(e.target.value)}
          style={inputStyle}
        >
          <option value="">Select Project</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        {activeProject && (
          <div style={{ marginTop: 20 }}>
            <h3>{activeProject.name}</h3>
            <p>{activeProject.client_name}</p>
            <p>{currency(activeProject.contract_value)}</p>
          </div>
        )}
      </div>

      <div style={{ marginTop: 20, background: "white", padding: 20, borderRadius: 12 }}>
        <h2>Projects List</h2>

        {projects.map((p) => (
          <div
            key={p.id}
            style={{
              borderBottom: "1px solid #ddd",
              padding: 10,
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <div>
              {p.name} — {currency(p.contract_value)}
            </div>

            <button onClick={() => deleteProject(p.id)} style={smallDangerButton}>
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: 10,
  marginBottom: 10,
  borderRadius: 8,
  border: "1px solid #ccc",
};

const buttonDark = {
  padding: "10px 14px",
  background: "#111827",
  color: "white",
  border: "none",
  borderRadius: 8,
};

const smallDangerButton = {
  padding: "6px 10px",
  background: "#fee2e2",
  border: "none",
  borderRadius: 6,
};

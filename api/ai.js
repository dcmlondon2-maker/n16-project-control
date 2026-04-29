import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function money(value) {
  return `£${Number(value || 0).toLocaleString("en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { prompt, projectId } = req.body;
    const q = String(prompt || "").toLowerCase();

    if (!projectId) {
      return res.status(400).json({
        reply: "Please select a project first.",
      });
    }

    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      return res.status(404).json({
        reply: "I could not find that project.",
      });
    }

    const { data: expenses = [] } = await supabase
      .from("expenses")
      .select("*")
      .eq("project_id", projectId);

    const { data: invoices = [] } = await supabase
      .from("invoices")
      .select("*")
      .eq("project_id", projectId);

    const { data: variations = [] } = await supabase
      .from("variations")
      .select("*")
      .eq("project_id", projectId);

    const sellValue = Number(project.contract_value || 0);

    const totalExpenses = expenses.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );

    const totalInvoiced = invoices.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );

    const totalPaid = invoices.reduce(
      (sum, item) => sum + Number(item.paid_amount || 0),
      0
    );

    const unpaid = totalInvoiced - totalPaid;

    const approvedVariations = variations
      .filter(v => String(v.status || "").toLowerCase() === "approved")
      .reduce((sum, item) => sum + Number(item.approved_value || 0), 0);

    const adjustedSellValue = sellValue + approvedVariations;
    const profit = adjustedSellValue - totalExpenses;
    const margin = adjustedSellValue > 0 ? (profit / adjustedSellValue) * 100 : 0;

    let reply = `Project summary for ${project.name}:

Sell value: ${money(sellValue)}
Approved variations: ${money(approvedVariations)}
Adjusted sell value: ${money(adjustedSellValue)}
Total expenses: ${money(totalExpenses)}
Expected profit: ${money(profit)}
Margin: ${margin.toFixed(1)}%
Total invoiced: ${money(totalInvoiced)}
Paid: ${money(totalPaid)}
Outstanding: ${money(unpaid)}`;

    if (q.includes("profit") || q.includes("margin")) {
      reply = `Profit check for ${project.name}:

Adjusted sell value: ${money(adjustedSellValue)}
Total expenses: ${money(totalExpenses)}
Expected profit: ${money(profit)}
Margin: ${margin.toFixed(1)}%`;
    }

    if (q.includes("invoice") || q.includes("unpaid") || q.includes("payment")) {
      reply = `Invoice check for ${project.name}:

Total invoiced: ${money(totalInvoiced)}
Paid so far: ${money(totalPaid)}
Outstanding: ${money(unpaid)}

${unpaid > 0 ? "There is still money to chase." : "All invoiced money appears paid."}`;
    }

    if (q.includes("variation")) {
      reply = `Variation check for ${project.name}:

Approved variations: ${money(approvedVariations)}

Approved variations increase your sell value and help protect your profit.`;
    }

    return res.status(200).json({ reply });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      reply: "Project AI failed.",
    });
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { prompt } = req.body;

    let reply = "";

    const lower = prompt.toLowerCase();

    if (lower.includes("profit")) {
      reply = "Your profit tab tracks live project margin and forecast profit. Review labour, purchase orders and subcontractor costs to improve margin.";
    } else if (lower.includes("invoice")) {
      reply = "Your invoice tracker shows amounts invoiced, paid and outstanding. Chase overdue invoices to improve cashflow.";
    } else if (lower.includes("snag")) {
      reply = "Your snagging tracker can prioritise defects by urgency and assigned contractor.";
    } else if (lower.includes("variation")) {
      reply = "Monitor submitted and approved variations closely to protect profit.";
    } else if (lower.includes("budget")) {
      reply = "Review overspend areas in the budget tracker and compare against contract value.";
    } else if (lower.includes("site")) {
      reply = "Use site diary reports to summarise labour, weather, completed works and delays.";
    } else {
      reply = "I can help with profit forecasting, budgets, invoices, variations, snags, subcontractor payments, expenses and site reports.";
    }

    res.status(200).json({ reply });
  } catch (error) {
    res.status(500).json({ error: "AI failed." });
  }
}

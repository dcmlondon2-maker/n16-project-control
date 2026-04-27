export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { prompt } = req.body;
    const lower = prompt.toLowerCase();
    let reply = "";

    if (lower.includes("setup") || lower.includes("new project")) {
      reply = "To set up a project: go to Projects tab, click Add Project, enter client, address, contract value and dates.";
    } else if (lower.includes("budget")) {
      reply = "Use the Budget tab to enter trade budgets and monitor spent vs remaining.";
    } else if (lower.includes("invoice")) {
      reply = "Use Invoices tab to log applications, invoices, payments and outstanding balances.";
    } else if (lower.includes("snag")) {
      reply = "Use Snagging tab to log defects, assign responsibility and upload photos.";
    } else if (lower.includes("site report")) {
      reply = "Go to Site Diary, add entries, then click Generate Site Report.";
    } else if (lower.includes("expense")) {
      reply = "Use Expenses tab to upload receipts and track net, VAT and gross costs.";
    } else {
      reply = "I can help you set up projects, budgets, invoices, expenses, snags and site reports.";
    }

    res.status(200).json({ reply });
  } catch (error) {
    res.status(500).json({ error: "AI failed." });
  }
}

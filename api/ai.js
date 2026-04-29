export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { prompt } = req.body;
    const q = String(prompt || "").toLowerCase();

    let reply = "I can help you set up projects, budgets, invoices, cashflow, variations, snags, expenses, site diary notes and profit checks.";

    if (q.includes("set up") || q.includes("new project") || q.includes("project")) {
      reply = `To set up a new project:
1. Go to Projects.
2. Add project name, client, site address and contract value.
3. Add start and target completion dates.
4. Save it.
5. Select it from Project Control.
6. Then add budget, invoices, expenses, snags and diary entries against that project.`;
    }

    if (q.includes("cashflow") || q.includes("cash flow")) {
      reply = `Cashflow setup:
1. Add your opening bank/project balance.
2. Enter expected client payments from invoices.
3. Add upcoming labour, supplier, subbie and expense payments.
4. Watch the forecast balance.
5. If it goes negative, chase invoices, delay non-critical spend or bring payment applications forward.`;
    }

    if (q.includes("profit") || q.includes("margin")) {
      reply = `Profit check:
Compare contract value plus approved variations against labour, POs, subbies, expenses and other costs. If margin is dropping, check overspending trades, unpaid variations and labour creep first.`;
    }

    if (q.includes("invoice") || q.includes("payment")) {
      reply = `Invoice advice:
Log invoice date, gross amount, paid amount and due date. Chase anything overdue. Your outstanding total shows cash still to collect.`;
    }

    if (q.includes("snag") || q.includes("defect")) {
      reply = `Snagging advice:
Add location, description, priority, status and assigned person. Use photos where possible. Close snags only when confirmed complete.`;
    }

    if (q.includes("site diary") || q.includes("diary") || q.includes("report")) {
      reply = `Site diary advice:
Record weather, labour on site, work completed, delays and issues daily. Then generate a site report for client records and dispute protection.`;
    }

    if (q.includes("variation")) {
      reply = `Variation advice:
Log every change immediately. Track submitted, approved and rejected values. Approved variations should increase your contract value and protect profit.`;
    }

    res.status(200).json({ reply });
  } catch (error) {
    res.status(500).json({ error: "AI failed." });
  }
}

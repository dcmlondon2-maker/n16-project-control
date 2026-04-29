export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ reply: "Method not allowed" });
    }

    const body = req.body || {};
    const prompt = body.prompt || "";
    const q = String(prompt).toLowerCase();

    let reply = "I can help with projects, budget, invoices, cashflow, variations, snags, expenses, diary notes and profit checks.";

    if (q.includes("budget")) {
      reply = "Budget should mean your COST, not the sell price. Use it for labour, materials, subbies, plant, skips and expenses. Contract value is your sell value ex VAT.";
    } else if (q.includes("vat")) {
      reply = "VAT should be separate. Contract value should be ex VAT. VAT is not profit; it is collected and passed on.";
    } else if (q.includes("project")) {
      reply = "To set up a project: go to Projects, enter client, site address, contract value ex VAT, dates, then save and select it.";
    } else if (q.includes("cashflow") || q.includes("cash flow")) {
      reply = "Cashflow tracks when money comes in and goes out. Watch invoices due, labour, suppliers, subbies, expenses and VAT timing.";
    } else if (q.includes("profit") || q.includes("margin")) {
      reply = "Profit = sell value ex VAT minus all costs. Margin = profit divided by sell value.";
    }

    return res.status(200).json({ reply });
  } catch (error) {
    return res.status(200).json({
      reply: "AI assistant is running, but there was a server error. Check api/ai.js.",
    });
  }
}

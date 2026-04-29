export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ reply: "Method not allowed" });
    }

    const { prompt = "", context = {} } = req.body || {};
    const q = String(prompt).toLowerCase();

    const sellValue = Number(context.sellValue || 0);
    const totalCosts =
      Number(context.labour || 0) +
      Number(context.purchaseOrders || 0) +
      Number(context.subbies || 0) +
      Number(context.expenses || 0) +
      Number(context.otherCosts || 0);

    const profit = sellValue - totalCosts;
    const margin = sellValue > 0 ? ((profit / sellValue) * 100).toFixed(1) : "0.0";
    const outstanding = Number(context.outstanding || 0);

    let reply = `I can help with live project profit, cashflow, invoices, budgets, snags and setup.`;

    if (q.includes("profit") || q.includes("margin")) {
      reply = `Project: ${context.projectName}

Sell value ex VAT: £${sellValue.toLocaleString("en-GB")}
Total known costs: £${totalCosts.toLocaleString("en-GB")}
Expected profit: £${profit.toLocaleString("en-GB")}
Expected margin: ${margin}%

Cost breakdown:
Labour: £${Number(context.labour || 0).toLocaleString("en-GB")}
POs/materials: £${Number(context.purchaseOrders || 0).toLocaleString("en-GB")}
Subbies: £${Number(context.subbies || 0).toLocaleString("en-GB")}
Expenses: £${Number(context.expenses || 0).toLocaleString("en-GB")}`;
    }

    if (q.includes("invoice") || q.includes("payment") || q.includes("outstanding")) {
      reply = `Project: ${context.projectName}

Total invoiced: £${Number(context.invoices || 0).toLocaleString("en-GB")}
Paid: £${Number(context.paid || 0).toLocaleString("en-GB")}
Outstanding: £${outstanding.toLocaleString("en-GB")}

${outstanding > 0 ? "Action: chase outstanding payments to protect cashflow." : "No outstanding invoice balance showing."}`;
    }

    if (q.includes("snag")) {
      reply = `Project: ${context.projectName}

Open snags: ${context.openSnags || 0}
High-priority snags: ${context.highPrioritySnags || 0}

${Number(context.highPrioritySnags || 0) > 0 ? "Action: clear high-priority snags first." : "No high-priority snags showing."}`;
    }

    if (q.includes("budget") || q.includes("cost")) {
      reply = `Project: ${context.projectName}

Known costs so far: £${totalCosts.toLocaleString("en-GB")}
Sell value ex VAT: £${sellValue.toLocaleString("en-GB")}
Profit remaining: £${profit.toLocaleString("en-GB")}

Budget should be your cost allowance, not the client sell price.`;
    }

    return res.status(200).json({ reply });
  } catch (error) {
    return res.status(200).json({
      reply: "AI assistant is running, but there was a server error.",
    });
  }
}

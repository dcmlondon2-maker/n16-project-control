export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ reply: "Method not allowed" });
    }

    const { prompt = "", context = {} } = req.body || {};
    const q = String(prompt).toLowerCase();

    const money = (n) =>
      `£${Number(n || 0).toLocaleString("en-GB", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;

    const sellValue = Number(context.sellValue || 0);
    const labour = Number(context.labour || 0);
    const purchaseOrders = Number(context.purchaseOrders || 0);
    const subbies = Number(context.subbies || 0);
    const expenses = Number(context.expenses || 0);
    const otherCosts = Number(context.otherCosts || 0);

    const invoices = Number(context.invoices || 0);
    const paid = Number(context.paid || 0);
    const outstanding = Number(context.outstanding || 0);

    const openSnags = Number(context.openSnags || 0);
    const highPrioritySnags = Number(context.highPrioritySnags || 0);

    const totalCosts = labour + purchaseOrders + subbies + expenses + otherCosts;
    const profit = sellValue - totalCosts;
    const margin = sellValue > 0 ? (profit / sellValue) * 100 : 0;

    const warnings = [];

    if (sellValue === 0) warnings.push("⚠️ No sell value found. Add a contract value to the project.");
    if (profit < 0) warnings.push("🚨 Project is currently showing a loss.");
    if (margin > 0 && margin < 20) warnings.push("⚠️ Margin is below 20%.");
    if (margin > 60) warnings.push("⚠️ Margin looks very high. You may be missing costs.");
    if (outstanding > 10000) warnings.push("⚠️ Outstanding invoices are high. Chase payment.");
    if (highPrioritySnags > 0) warnings.push("⚠️ High-priority snags are still open.");

    const warningText = warnings.length
      ? `\n\nWarnings:\n${warnings.join("\n")}`
      : "\n\nNo major warnings showing.";

    let reply = `I can help with live project profit, cashflow, invoices, budgets, snags and setup.`;

    if (q.includes("profit") || q.includes("margin")) {
      reply = `Project: ${context.projectName || "All Projects"}

Sell value ex VAT: ${money(sellValue)}
Total known costs: ${money(totalCosts)}
Expected profit: ${money(profit)}
Expected margin: ${margin.toFixed(1)}%

Cost breakdown:
Labour: ${money(labour)}
POs / materials: ${money(purchaseOrders)}
Subbies: ${money(subbies)}
Expenses: ${money(expenses)}
Other costs: ${money(otherCosts)}${warningText}`;
    } else if (q.includes("invoice") || q.includes("payment") || q.includes("outstanding")) {
      reply = `Project: ${context.projectName || "All Projects"}

Total invoiced: ${money(invoices)}
Paid: ${money(paid)}
Outstanding: ${money(outstanding)}

${outstanding > 0 ? "Action: chase outstanding payments to protect cashflow." : "No outstanding invoice balance showing."}${warningText}`;
    } else if (q.includes("snag") || q.includes("defect")) {
      reply = `Project: ${context.projectName || "All Projects"}

Open snags: ${openSnags}
High-priority snags: ${highPrioritySnags}

${highPrioritySnags > 0 ? "Action: clear high-priority snags first." : "No high-priority snags showing."}${warningText}`;
    } else if (q.includes("budget") || q.includes("cost")) {
      reply = `Project: ${context.projectName || "All Projects"}

Known costs so far: ${money(totalCosts)}
Sell value ex VAT: ${money(sellValue)}
Profit remaining: ${money(profit)}

Budget should be your cost allowance, not the client sell price.${warningText}`;
    } else if (q.includes("cashflow") || q.includes("cash flow")) {
      reply = `Project: ${context.projectName || "All Projects"}

Cashflow check:
Outstanding invoices: ${money(outstanding)}
Known costs: ${money(totalCosts)}
Expected profit: ${money(profit)}

Action:
- Chase unpaid invoices.
- Watch labour and subbie spend.
- Do not let costs run ahead of payments.${warningText}`;
    } else if (q.includes("set up") || q.includes("new project")) {
      reply = `To set up a new project:

1. Go to Projects.
2. Add project name, client, site address and contract value.
3. Use contract value as sell value excluding VAT.
4. Add start date and target completion date.
5. Save the project.
6. Select it from Project Control.
7. Add budgets, labour, POs, invoices, variations, expenses, snags and diary entries.`;
    }

    return res.status(200).json({ reply });
  } catch (error) {
    return res.status(200).json({
      reply: "AI assistant is running, but there was a server error.",
    });
  }
}

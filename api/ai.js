const knowledgeBase = [
  {
    keywords: ["set up", "new project", "create project", "start project"],
    reply: `To set up a new project:
1. Go to Projects.
2. Add project name, client, site address and contract value.
3. Use contract value as SELL VALUE excluding VAT.
4. Add start date and target completion date.
5. Save the project.
6. Select it from Project Control.
7. Then add budget, labour, invoices, expenses, variations, snags and diary entries.`
  },
  {
    keywords: ["budget", "cost", "costs", "allowance"],
    reply: `Budget should mean COST, not sell price.

Use Budget for:
- labour cost
- materials cost
- subcontractor cost
- plant / hire
- skips / waste
- other job costs

Sell value belongs in the project contract value.`
  },
  {
    keywords: ["vat", "tax"],
    reply: `VAT should be kept separate.

Best setup:
- Contract value = sell value excluding VAT
- VAT = 20%
- Total including VAT = contract value + VAT

VAT is not profit. It is money collected and passed on.`
  },
  {
    keywords: ["cashflow", "cash flow", "money in", "money out"],
    reply: `Cashflow means timing of money in and money out.

Track:
- expected client payments
- labour payments
- supplier payments
- subcontractor payments
- expenses
- VAT due

A project can show profit but still hurt you if cash comes in late.`
  },
  {
    keywords: ["profit", "margin", "markup"],
    reply: `Profit formula:

Sell value ex VAT
minus labour
minus materials
minus subcontractors
minus expenses
minus other costs
= expected profit

Margin = profit divided by sell value.`
  },
  {
    keywords: ["invoice", "payment", "paid", "outstanding", "overdue"],
    reply: `Invoice advice:
1. Log invoice date.
2. Enter gross amount.
3. Add paid amount when payment arrives.
4. Track outstanding.
5. Chase anything overdue.

Outstanding invoices are cash still owed to you.`
  },
  {
    keywords: ["variation", "change", "extra work", "additional work"],
    reply: `Variation advice:
Log every change straight away.

Track:
- description
- submitted value
- approved value
- status
- date submitted

Approved variations should increase your sell value and protect your profit.`
  },
  {
    keywords: ["snag", "snags", "defect", "defects", "fault"],
    reply: `Snagging advice:
Add location, description, priority, assigned person and photo.

Keep status as Open until actually completed.

High-priority snags should be chased first.`
  },
  {
    keywords: ["site diary", "diary", "report", "daily report"],
    reply: `Site diary advice:
Record daily:
- weather
- labour on site
- work completed
- delays
- issues
- instructions

This protects you if there is a dispute later.`
  }
];

const defaultReply = `I can help with:
- setting up a new project
- budget vs sell value
- invoices and payment chasing
- cashflow planning
- profit and margin checks
- variations
- snags and defects
- expenses and receipts
- site diary reports`;

function findBestReply(question) {
  const q = String(question || "").toLowerCase();

  const match = knowledgeBase.find(item =>
    item.keywords.some(keyword => q.includes(keyword))
  );

  return match ? match.reply : defaultReply;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({
        error: "Please provide a valid prompt."
      });
    }

    const reply = findBestReply(prompt);

    return res.status(200).json({
      reply,
      source: "project-control-assistant"
    });
  } catch (error) {
    console.error("Assistant error:", error);

    return res.status(500).json({
      error: "Assistant failed."
    });
  }
}

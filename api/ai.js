export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { prompt } = req.body;

    res.status(200).json({
      reply: `AI Assistant says: ${prompt}`
    });
  } catch (error) {
    res.status(500).json({ error: "AI failed." });
  }
}

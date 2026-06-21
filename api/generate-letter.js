import Stripe from "stripe";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { sessionId } = req.body;

  if (!sessionId || typeof sessionId !== "string" || !sessionId.startsWith("cs_")) {
    return res.status(400).json({ error: "Invalid or missing session ID" });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch (err) {
    console.error("Stripe retrieve error:", err.message);
    return res.status(400).json({ error: "Could not verify payment session." });
  }

  if (session.payment_status !== "paid") {
    return res.status(402).json({ error: "Payment not completed" });
  }

  const { name, platform, email, phone, courierId, date, story } = session.metadata;

  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  let deactivationDate = date;
  try {
    deactivationDate = new Date(date + "T12:00:00").toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  } catch(e) {}

  const systemPrompt = `You are a formal legal correspondence specialist helping NYC app-based delivery workers assert their rights under NYC Local Law protecting delivery workers from wrongful deactivation. Generate a professional formal Appeal and Demand for Reinstatement Letter. Cite applicable NYC laws. Do NOT promise guaranteed outcomes. Output ONLY the letter, no preamble.`;

  const userMessage = `Generate the full Formal Appeal Letter.
TODAY'S DATE: ${today}
WORKER NAME: ${name}
EMAIL: ${email}
PHONE: ${phone || "Not provided"}
COURIER/ACCOUNT ID: ${courierId}
PLATFORM: ${platform}
DEACTIVATION DATE: ${deactivationDate}
WORKER TESTIMONY: ${story}`;

  try {
    const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 2000,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    const aiData = await aiRes.json();
    if (!aiRes.ok) throw new Error(aiData.error?.message || "AI generation failed");

    const letter = aiData.content.filter(b => b.type === "text").map(b => b.text).join("\n");
    if (!letter || letter.trim().length < 50) throw new Error("Empty letter returned");

    return res.status(200).json({ letter, workerName: name, platform });
  } catch (err) {
    console.error("Generation error:", err.message);
    return res.status(500).json({ error: "Generation failed: " + err.message });
  }
}

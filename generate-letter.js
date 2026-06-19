const Stripe = require("stripe");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON" }) };
  }

  const { sessionId } = body;
  if (!sessionId) {
    return { statusCode: 400, body: JSON.stringify({ error: "Missing session ID" }) };
  }

  // 1. Verify the Stripe payment actually succeeded
  const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch (err) {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid session" }) };
  }

  if (session.payment_status !== "paid") {
    return { statusCode: 402, body: JSON.stringify({ error: "Payment not completed" }) };
  }

  // 2. Pull worker data from session metadata
  const { name, platform, email, phone, courierId, date, story } = session.metadata;

  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });
  const deactivationDate = new Date(date + "T12:00:00").toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

  const systemPrompt = `You are an advanced AI legal correspondence agent specializing in NYC Labor Law and DCWP compliance, with core expertise in NYC Local Law 34 of 2026 (Wrongful Deactivation of App-Based Contracted Delivery Workers).

Generate a formal, legally aggressive Formal Appeal and Demand for Reinstatement Letter addressed to the platform's legal compliance team.

KEY STATUTES — NYC Local Law 34 of 2026:
• Just Cause Mandate: Platforms cannot deactivate a worker without proven Just Cause or a bona-fide economic reason.
• Progressive Discipline: Platform must issue documented warnings/suspensions before deactivation (except egregious misconduct).
• 72-Hour Notice Rule: Platform must provide exact written reasons within 72 hours. Vague language like "violated terms" fails this requirement.
• Data Transparency: Worker may demand all telemetry, customer logs, and internal data used for the decision.
• Remedies: Wrongful deactivation entitles the worker to immediate reinstatement and full back pay based on historical shift averages.
• DCWP may impose $2,500 fines per violation plus mandatory back pay.

Output ONLY the letter. No preamble, no commentary. Use strict formal legal correspondence formatting with clearly numbered and titled sections. Be specific, cite statutes precisely, and be legally aggressive.`;

  const userMessage = `Generate the full Formal Appeal and Demand for Reinstatement Letter.

TODAY'S DATE: ${today}
WORKER NAME: ${name}
EMAIL: ${email}
PHONE: ${phone || "Not provided"}
COURIER / ACCOUNT ID: ${courierId}
PLATFORM: ${platform}
DEACTIVATION DATE: ${deactivationDate}
WORKER TESTIMONY: ${story}

No screenshot was provided. Argue that the platform's notice was vague and failed the 72-Hour Notice Rule of NYC Local Law 34 of 2026. Generate the complete letter now.`;

  // 3. Call Anthropic API (server-side, key never exposed to browser)
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
        max_tokens: 1500,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    const aiData = await aiRes.json();
    if (!aiRes.ok) throw new Error(aiData.error?.message || "AI error");

    const letter = aiData.content.map((b) => b.text || "").join("\n");

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ letter, workerName: name, platform }),
    };
  } catch (err) {
    console.error("Anthropic error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to generate letter" }),
    };
  }
};

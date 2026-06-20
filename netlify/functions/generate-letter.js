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
  if (!sessionId || typeof sessionId !== "string" || !sessionId.startsWith("cs_")) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid or missing session ID" }),
    };
  }

  // 1. Verify Stripe payment
  const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch (err) {
    console.error("Stripe retrieve error:", err.message);
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Could not verify payment session. Please contact support." }),
    };
  }

  if (session.payment_status !== "paid") {
    return {
      statusCode: 402,
      body: JSON.stringify({ error: "Payment not completed" }),
    };
  }

  // 2. Pull worker data from metadata
  const { name, platform, email, phone, courierId, date, story } = session.metadata;

  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

  let deactivationDate = date;
  try {
    deactivationDate = new Date(date + "T12:00:00").toLocaleDateString("en-US", {
      year: "numeric", month: "long", day: "numeric",
    });
  } catch (e) {
    // fallback to raw date string if parsing fails
  }

  const systemPrompt = `You are a formal legal correspondence specialist helping NYC app-based delivery workers assert their rights under NYC Local Law protecting delivery workers from wrongful deactivation.

Generate a professional, formal Formal Appeal and Demand for Reinstatement Letter addressed to the platform's legal compliance team.

KEY LEGAL PROTECTIONS — NYC Delivery Worker Law:
• Platforms cannot deactivate a worker without documented Just Cause or a legitimate economic reason.
• Progressive Discipline: Platform should issue documented warnings before permanent deactivation (except in cases of serious misconduct).
• 72-Hour Notice Rule: Platform must provide specific written reasons within 72 hours. Vague language like "violated terms" is insufficient.
• Data Transparency: Worker may request all data used in the deactivation decision.
• Possible Remedies: Reinstatement and back pay if the deactivation is found to be wrongful. The NYC DCWP may investigate and take enforcement action.

IMPORTANT: Write formally and assertively. Cite the applicable NYC laws. Do NOT promise guaranteed outcomes or imply automatic fines or payouts — frame remedies as possible outcomes subject to review. Output ONLY the letter. No preamble or commentary.`;

  const userMessage = `Generate the full Formal Appeal and Demand for Reinstatement Letter.

TODAY'S DATE: ${today}
WORKER NAME: ${name}
EMAIL: ${email}
PHONE: ${phone || "Not provided"}
COURIER / ACCOUNT ID: ${courierId}
PLATFORM: ${platform}
DEACTIVATION DATE: ${deactivationDate}
WORKER TESTIMONY: ${story}

Write the complete formal appeal letter now, citing applicable NYC delivery worker protection laws.`;

  // 3. Call Anthropic API
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

    if (!aiRes.ok) {
      console.error("Anthropic API error:", JSON.stringify(aiData));
      throw new Error(aiData.error?.message || "AI generation failed");
    }

    const letter = aiData.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n");

    if (!letter || letter.trim().length < 50) {
      throw new Error("Empty or too-short letter returned");
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ letter, workerName: name, platform }),
    };
  } catch (err) {
    console.error("Generation error:", err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Generation failed: " + err.message }),
    };
  }
};

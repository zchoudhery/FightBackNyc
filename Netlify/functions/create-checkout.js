const Stripe = require("stripe");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON" }) };
  }

  // Store the worker form data in Stripe metadata so we can retrieve it after payment
  const { name, platform, email, phone, courierId, date, story } = body;

  if (!name || !platform || !email || !courierId || !date || !story) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing required fields" }),
    };
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "FightBack NYC — Legal Appeal Letter",
              description:
                "Formal appeal letter citing NYC Local Law 34 of 2026. Delivered instantly after payment.",
              images: [],
            },
            unit_amount: 1500, // $15.00 in cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      // After payment, redirect to the generate page with the session ID
      success_url: `${event.headers.origin}/generating.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${event.headers.origin}/index.html?cancelled=true`,
      customer_email: email,
      metadata: {
        name,
        platform,
        email,
        phone: phone || "",
        courierId,
        date,
        // Stripe metadata values must be strings under 500 chars
        story: story.slice(0, 490),
      },
    });

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: session.url }),
    };
  } catch (err) {
    console.error("Stripe error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to create checkout session" }),
    };
  }
};

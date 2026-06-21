import Stripe from "stripe";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const { name, platform, email, phone, courierId, date, story } = req.body;

  if (!name || !platform || !email || !courierId || !date || !story) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const host = req.headers["x-forwarded-host"] || req.headers.host || "fightbacknyc.net";
  const proto = req.headers["x-forwarded-proto"] || "https";
  const baseUrl = `${proto}://${host}`;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency: "usd",
          product_data: {
            name: "FightBack NYC — Legal Appeal Letter",
            description: "Formal appeal letter based on NYC delivery worker protections. Delivered instantly after payment.",
          },
          unit_amount: 1500,
        },
        quantity: 1,
      }],
      mode: "payment",
      success_url: `${baseUrl}/generating.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/index.html?cancelled=true`,
      customer_email: email,
      metadata: { name, platform, email, phone: phone || "", courierId, date, story: story.slice(0, 490) },
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("Stripe error:", err);
    return res.status(500).json({ error: "Failed to create checkout session" });
  }
}

# 🚀 FightBack NYC — Launch Guide
## Go live in ~30 minutes. Follow these steps exactly.

---

## STEP 1 — Create Your Stripe Account (10 min)

1. Go to https://stripe.com and click **Start now**
2. Fill in your email, name, country (United States), and create a password
3. Verify your email address
4. Complete business info:
   - Business type: **Individual / Sole proprietor**
   - Industry: **Software / Technology Services**
   - Website: (enter your Netlify URL later, or put a placeholder for now)
5. Add your bank account so Stripe can pay you out
6. Once inside the dashboard, go to **Developers → API Keys**
7. Copy your **Secret key** — it starts with `sk_live_...`
   - ⚠️ Keep this secret. Never share it or put it in your HTML.

---

## STEP 2 — Get Your Anthropic API Key (5 min)

1. Go to https://console.anthropic.com
2. Sign in or create a free account
3. Go to **Settings → API Keys**
4. Click **Create Key**, name it "FightBack NYC"
5. Copy the key — it starts with `sk-ant-...`
6. Add a credit card and set a spending limit (suggested: $50/month to start)
   - Each letter costs about $0.03–0.05 to generate, so $50 covers 1,000+ letters

---

## STEP 3 — Push to GitHub (5 min)

1. Go to https://github.com and create a free account if you don't have one
2. Click **New repository**, name it `fightback-nyc`, set it to **Private**, click Create
3. Download and install GitHub Desktop from https://desktop.github.com
4. Open GitHub Desktop → **File → Add Local Repository**
5. Point it to this `fightback-site` folder
6. Click **Publish repository** → push to GitHub

---

## STEP 4 — Deploy to Netlify (5 min)

1. Go to https://netlify.com and sign up (free) — use "Sign up with GitHub"
2. Click **Add new site → Import an existing project**
3. Choose **GitHub**, authorize Netlify, select your `fightback-nyc` repo
4. Build settings (Netlify should auto-detect, but confirm):
   - Build command: (leave blank)
   - Publish directory: `public`
   - Functions directory: `netlify/functions`
5. Click **Deploy site**
6. Netlify will give you a URL like `https://random-name-123.netlify.app`
   - You can change this to something like `fightbacknyc.netlify.app` in Site Settings

---

## STEP 5 — Add Your Secret Keys to Netlify (3 min)

⚠️ This is the most important step. Your keys must NEVER go in your code files.

1. In your Netlify dashboard, go to **Site configuration → Environment variables**
2. Click **Add a variable** and add these two:

   | Key | Value |
   |-----|-------|
   | `STRIPE_SECRET_KEY` | `sk_live_...` (your Stripe secret key) |
   | `ANTHROPIC_API_KEY` | `sk-ant-...` (your Anthropic key) |

3. Click **Save**, then go to **Deploys** and click **Trigger deploy → Deploy site**
   (Environment variables only take effect after a redeploy)

---

## STEP 6 — Test Everything (5 min)

1. Visit your Netlify URL
2. Fill in the form with test data
3. When you hit "Generate my appeal letter", you'll be sent to Stripe checkout
4. Use Stripe's test card to test without real charges:
   - Card number: `4242 4242 4242 4242`
   - Expiry: any future date (e.g. `12/30`)
   - CVC: any 3 digits (e.g. `123`)
   - ⚠️ Test cards only work when using `sk_test_...` keys (Stripe test mode)
5. After "payment", you should land on the generating page and see your letter

---

## STEP 7 — Switch to Live Mode

When you're ready to accept real $15 payments:

1. In Stripe dashboard, toggle from **Test mode** to **Live mode** (top left)
2. Copy your **live** Secret key (`sk_live_...`)
3. Update `STRIPE_SECRET_KEY` in Netlify environment variables to the live key
4. Redeploy

---

## OPTIONAL — Custom Domain

1. Buy a domain (e.g. `fightbacknyc.com`) at Namecheap (~$10/year)
2. In Netlify: **Site configuration → Domain management → Add custom domain**
3. Follow Netlify's DNS instructions — takes ~10 minutes to go live
4. Netlify provides free HTTPS automatically

---

## 💰 Your Cost Structure

| Item | Cost |
|------|------|
| Netlify hosting | FREE |
| Custom domain | ~$10/year |
| Stripe fee per sale | 2.9% + $0.30 = ~$0.74 per $15 sale |
| Anthropic AI per letter | ~$0.04 |
| **Your net per sale** | **~$14.22** |

At 10 sales/day = **$142/day = ~$4,260/month**

---

## 📣 Marketing (Where to Post)

- Facebook Groups: "DoorDash Drivers NYC", "NYC Food Delivery Workers", "UberEats Drivers NYC"
- WhatsApp groups for NYC couriers (search locally or ask at courier meetups)
- Reddit: r/doordash_drivers, r/UberEATS, r/gig_workers
- Post in Spanish, Bengali, Hindi, Nepali, Uzbek — your site already supports all these languages
- Simple post template: "Did DoorDash/UberEats/Grubhub deactivate your account? NYC law says they owe you $2,500 + back pay. Get a legal appeal letter for $15 → [your link]"

---

## 🆘 Need Help?

If something doesn't work, the most common issues are:
1. **Environment variables not set** → check Netlify site settings
2. **Functions not deploying** → confirm `netlify.toml` is in the root folder
3. **Stripe redirect failing** → make sure your site URL is correct in the function

Good luck! 🚀

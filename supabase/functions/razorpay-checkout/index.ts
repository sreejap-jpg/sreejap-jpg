import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// Razorpay keys are read from environment variables.
// Test keys use RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET.
// Live keys use the SAME variable names — swapping test → live is just an env change.
const KEY_ID = Deno.env.get("RAZORPAY_KEY_ID") ?? "";
const KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET") ?? "";

const RAZORPAY_API = "https://api.razorpay.com/v1";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    if (!KEY_ID || !KEY_SECRET) {
      return json({ error: "Razorpay keys not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET." }, 500);
    }

    const url = new URL(req.url);
    const action = url.searchParams.get("action") ?? "create-order";

    // -----------------------------
    // Create order
    // -----------------------------
    if (action === "create-order") {
      if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
      const body = await req.json();
      const amount = Number(body.amount); // in paise (INR)
      const listingId = String(body.listing_id ?? "");
      const bookId = String(body.book_id ?? "");
      const buyerId = String(body.buyer_id ?? "");

      if (!amount || amount < 100) {
        return json({ error: "Invalid amount. Minimum is 100 paise (₹1.00)." }, 400);
      }

      const orderPayload = {
        amount,
        currency: "INR",
        receipt: `kathazo_${listingId || bookId}_${Date.now()}`,
        notes: {
          listing_id: listingId,
          book_id: bookId,
          buyer_id: buyerId,
          platform: "kathazo",
        },
      };

      const resp = await fetch(`${RAZORPAY_API}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Basic " + btoa(`${KEY_ID}:${KEY_SECRET}`),
        },
        body: JSON.stringify(orderPayload),
      });

      const order = await resp.json();
      if (!resp.ok) {
        return json({ error: order.error?.description || "Failed to create Razorpay order", raw: order }, 400);
      }

      // Return order + key_id so the client can open the checkout modal
      return json({
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        key_id: KEY_ID,
      });
    }

    // -----------------------------
    // Verify payment signature
    // -----------------------------
    if (action === "verify") {
      if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
      const body = await req.json();
      const razorpayOrderId = String(body.razorpay_order_id ?? "");
      const razorpayPaymentId = String(body.razorpay_payment_id ?? "");
      const signature = String(body.razorpay_signature ?? "");

      if (!razorpayOrderId || !razorpayPaymentId || !signature) {
        return json({ error: "Missing payment parameters for verification." }, 400);
      }

      // HMAC SHA256 signature verification
      // expected = HMAC_SHA256(razorpay_order_id + "|" + razorpay_payment_id, key_secret)
      const key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(KEY_SECRET),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"],
      );
      const data = new TextEncoder().encode(`${razorpayOrderId}|${razorpayPaymentId}`);
      const sig = await crypto.subtle.sign("HMAC", key, data);
      const expected = Array.from(new Uint8Array(sig))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      if (expected !== signature) {
        return json({ verified: false, error: "Signature mismatch — payment verification failed." }, 400);
      }

      return json({ verified: true, order_id: razorpayOrderId, payment_id: razorpayPaymentId });
    }

    return json({ error: `Unknown action: ${action}` }, 404);
  } catch (err) {
    return json({ error: err.message || "Internal server error" }, 500);
  }
});

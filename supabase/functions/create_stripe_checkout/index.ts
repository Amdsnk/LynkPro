import { createClient } from "jsr:@supabase/supabase-js@2";
import Stripe from "npm:stripe@19.1.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

const successUrlPath = '/payment-success?session_id={CHECKOUT_SESSION_ID}';
const cancelUrlPath = '/invoices';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
  image_url?: string;
}

interface CheckoutRequest {
  items: OrderItem[];
  invoiceId?: string;
  currency?: string;
  payment_method_types?: string[];
}

function ok(data: unknown): Response {
  return new Response(
    JSON.stringify({ code: "SUCCESS", message: "Success", data }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    }
  );
}

function fail(msg: string, code = 400): Response {
  return new Response(
    JSON.stringify({ code: "FAIL", message: msg }),
    {
      status: code,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    }
  );
}

function validateCheckoutRequest(request: CheckoutRequest): void {
  if (!request.items?.length) {
    throw new Error("Items cannot be empty");
  }
  for (const item of request.items) {
    if (!item.name || item.price <= 0 || item.quantity <= 0) {
      throw new Error("Invalid item information");
    }
  }
}

function processOrderItems(items: OrderItem[]) {
  const formattedItems = items.map(item => ({
    name: item.name.trim(),
    price: Math.round(item.price * 100),
    quantity: item.quantity,
    image_url: item.image_url?.trim() || "",
  }));
  const totalAmount = formattedItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  return { formattedItems, totalAmount };
}

async function createCheckoutSession(
  stripe: Stripe,
  userId: string | null,
  firmId: string,
  items: OrderItem[],
  invoiceId: string | undefined,
  currency: string,
  paymentMethods: string[],
  origin: string
) {
  const { formattedItems, totalAmount } = processOrderItems(items);

  const { data: order, error } = await supabase
    .from("orders")
    .insert({
      firm_id: firmId,
      user_id: userId,
      invoice_id: invoiceId || null,
      items: formattedItems,
      total_amount: totalAmount / 100,
      currency: currency.toLowerCase(),
      status: "pending",
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create order: ${error.message}`);

  const session = await stripe.checkout.sessions.create({
    line_items: items.map(item => ({
      price_data: {
        currency: currency.toLowerCase(),
        product_data: {
          name: item.name,
          images: item.image_url ? [item.image_url] : [],
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    })),
    mode: "payment",
    success_url: `${origin}${successUrlPath}`,
    cancel_url: `${origin}${cancelUrlPath}`,
    payment_method_types: paymentMethods,
    metadata: {
      order_id: order.id,
      user_id: userId || "",
      invoice_id: invoiceId || "",
    },
  });

  await supabase
    .from("orders")
    .update({
      stripe_session_id: session.id,
      stripe_payment_intent_id: session.payment_intent as string,
    })
    .eq("id", order.id);

  return { order, session };
}

Deno.serve(async (req) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }
    if (req.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const request = await req.json();
    validateCheckoutRequest(request);

    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    const { data: { user } } = token
      ? await supabase.auth.getUser(token)
      : { data: { user: null } };

    if (!user) {
      throw new Error("Authentication required");
    }

    // Get user's firm_id
    const { data: profile } = await supabase
      .from("profiles")
      .select("firm_id")
      .eq("id", user.id)
      .single();

    if (!profile?.firm_id) {
      throw new Error("User firm not found");
    }

    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      throw new Error("STRIPE_SECRET_KEY not configured. Please add your Stripe secret key to environment variables.");
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2025-01-27.acacia",
    });

    const origin = req.headers.get("origin") || "";
    const { order, session } = await createCheckoutSession(
      stripe,
      user.id,
      profile.firm_id,
      request.items,
      request.invoiceId,
      request.currency || 'usd',
      request.payment_method_types || ['card'],
      origin
    );

    return ok({
      url: session.url,
      sessionId: session.id,
      orderId: order.id,
    });
  } catch (error) {
    console.error("Checkout error:", error);
    return fail(error instanceof Error ? error.message : "Payment processing failed", 500);
  }
});

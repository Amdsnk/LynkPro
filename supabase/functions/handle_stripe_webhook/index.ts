import { createClient } from "jsr:@supabase/supabase-js@2";
import Stripe from "npm:stripe@19.1.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY")!;
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;

const supabase = createClient(supabaseUrl, supabaseKey);
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

async function handlePaymentSuccess(session: Stripe.Checkout.Session) {
  console.log('Processing successful payment:', session.id);

  try {
    // Update order status
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .update({
        status: 'completed',
        stripe_session_id: session.id,
        stripe_payment_intent: session.payment_intent as string,
      })
      .eq('stripe_session_id', session.id)
      .select()
      .single();

    if (orderError) {
      console.error('Failed to update order:', orderError);
      throw orderError;
    }

    console.log('Order updated:', order.id);

    // If order has an associated invoice, update invoice status
    if (order.invoice_id) {
      const { error: invoiceError } = await supabase
        .from('invoices')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
        })
        .eq('id', order.invoice_id);

      if (invoiceError) {
        console.error('Failed to update invoice:', invoiceError);
      } else {
        console.log('Invoice updated:', order.invoice_id);
      }
    }

    return { success: true, orderId: order.id };
  } catch (error) {
    console.error('Error handling payment success:', error);
    throw error;
  }
}

async function handlePaymentFailed(session: Stripe.Checkout.Session) {
  console.log('Processing failed payment:', session.id);

  try {
    // Update order status to failed
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .update({
        status: 'failed',
        stripe_session_id: session.id,
      })
      .eq('stripe_session_id', session.id)
      .select()
      .single();

    if (orderError) {
      console.error('Failed to update order:', orderError);
      throw orderError;
    }

    console.log('Order marked as failed:', order.id);
    return { success: true, orderId: order.id };
  } catch (error) {
    console.error('Error handling payment failure:', error);
    throw error;
  }
}

Deno.serve(async (req) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (req.method !== "POST") {
      return new Response("Method not allowed", { 
        status: 405,
        headers: corsHeaders 
      });
    }

    // Get the signature from headers
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      return new Response(
        JSON.stringify({ error: "Missing stripe-signature header" }),
        { 
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        }
      );
    }

    // Get the raw body
    const body = await req.text();

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return new Response(
        JSON.stringify({ error: `Webhook Error: ${err instanceof Error ? err.message : 'Unknown error'}` }),
        { 
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        }
      );
    }

    console.log('Received webhook event:', event.type);

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Only process if payment was successful
        if (session.payment_status === 'paid') {
          await handlePaymentSuccess(session);
        }
        break;
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handlePaymentFailed(session);
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('PaymentIntent succeeded:', paymentIntent.id);
        // Additional handling if needed
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('PaymentIntent failed:', paymentIntent.id);
        // Additional handling if needed
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Return a 200 response to acknowledge receipt of the event
    return new Response(
      JSON.stringify({ received: true, eventType: event.type }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      }
    );
  } catch (error) {
    console.error('Webhook handler error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error' 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      }
    );
  }
});

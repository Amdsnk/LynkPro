import { createClient } from "jsr:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RecurringInvoice {
  id: string;
  firm_id: string;
  client_id: string;
  template_data: {
    items: Array<{ description: string; quantity: number; rate: number }>;
    total_amount: number;
    terms: string;
  };
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  next_generation_date: string;
}

async function generateInvoiceFromTemplate(recurring: RecurringInvoice) {
  try {
    // Get the next invoice number
    const { data: lastInvoice } = await supabase
      .from('invoices')
      .select('invoice_number')
      .eq('firm_id', recurring.firm_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const lastNumber = lastInvoice?.invoice_number 
      ? parseInt(lastInvoice.invoice_number.replace(/\D/g, '')) 
      : 0;
    const newNumber = `INV-${String(lastNumber + 1).padStart(4, '0')}`;

    // Create the invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        firm_id: recurring.firm_id,
        client_id: recurring.client_id,
        invoice_number: newNumber,
        items: recurring.template_data.items,
        subtotal: recurring.template_data.total_amount,
        tax_amount: 0,
        total_amount: recurring.template_data.total_amount,
        status: 'draft',
        terms: recurring.template_data.terms,
        issue_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      })
      .select()
      .single();

    if (invoiceError) throw invoiceError;

    // Update next generation date
    const { error: updateError } = await supabase.rpc('update_next_generation_date', {
      recurring_invoice_id: recurring.id,
      frequency: recurring.frequency,
    });

    if (updateError) throw updateError;

    return { success: true, invoiceNumber: newNumber };
  } catch (error) {
    console.error(`Failed to generate invoice for recurring ${recurring.id}:`, error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

Deno.serve(async (req) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // Query recurring invoices due for generation
    const today = new Date().toISOString().split('T')[0];
    const { data: recurringInvoices, error: queryError } = await supabase
      .from('recurring_invoices')
      .select('*')
      .eq('is_active', true)
      .lte('next_generation_date', today);

    if (queryError) throw queryError;

    if (!recurringInvoices || recurringInvoices.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: 'No recurring invoices due for generation',
          count: 0 
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        }
      );
    }

    // Generate invoices
    const results = await Promise.all(
      recurringInvoices.map(recurring => generateInvoiceFromTemplate(recurring))
    );

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    return new Response(
      JSON.stringify({
        message: 'Recurring invoice generation completed',
        total: recurringInvoices.length,
        successful,
        failed,
        results,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      }
    );
  } catch (error) {
    console.error('Error generating recurring invoices:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      }
    );
  }
});

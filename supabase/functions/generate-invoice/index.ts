// Supabase Edge Function: generate-invoice
// Calculates line items, subtotal, tax rate, and returns structured draft invoice
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { client_name, client_email, items, due_days = 14, currency = "USD" } = await req.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return new Response(JSON.stringify({ error: "At least one item is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const calculatedItems = items.map((it: any, index: number) => {
      const qty = Number(it.quantity) || 1;
      const unit = Number(it.unit_price) || 0;
      const taxRate = Number(it.tax_rate) || 8.25;
      const lineTotal = Math.round(qty * unit * 100) / 100;
      return {
        id: it.id || `item_${index + 1}`,
        description: it.description || "Cloud Service",
        quantity: qty,
        unit_price: unit,
        tax_rate: taxRate,
        line_total: lineTotal,
      };
    });

    const subtotal = calculatedItems.reduce((sum: number, it: any) => sum + it.line_total, 0);
    const tax = Math.round(subtotal * 0.0825 * 100) / 100;
    const total = Math.round((subtotal + tax) * 100) / 100;

    const issueDate = new Date().toISOString().split("T")[0];
    const dueDate = new Date(Date.now() + due_days * 86400000).toISOString().split("T")[0];
    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;

    const invoice = {
      invoice_number: invoiceNumber,
      customer_name: client_name || "Enterprise Client",
      customer_email: client_email || "billing@client.com",
      issue_date: issueDate,
      due_date: dueDate,
      subtotal,
      tax_amount: tax,
      total_amount: total,
      currency,
      status: "issued",
      items: calculatedItems,
    };

    return new Response(JSON.stringify({ invoice }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});

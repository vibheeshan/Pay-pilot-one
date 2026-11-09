// Supabase Edge Function: paypal-create-order
// Generates sandbox order intent and authoritative tax breakdown
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
    const { items, customer, source = "agentcart" } = await req.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return new Response(JSON.stringify({ error: "Order must have items" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const subtotal = items.reduce((sum: number, it: any) => sum + (Number(it.unit_price) * Number(it.quantity)), 0);
    const taxRate = 0.0825;
    const tax = Math.round(subtotal * taxRate * 100) / 100;
    const total = Math.round((subtotal + tax) * 100) / 100;

    const orderId = `PAYPAL-EDGE-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    return new Response(JSON.stringify({
      orderId,
      status: "CREATED",
      intent: "CAPTURE",
      source,
      currency: "USD",
      breakdown: {
        subtotal: subtotal.toFixed(2),
        tax: tax.toFixed(2),
        total: total.toFixed(2),
      },
      customer: customer || { name: "Sandbox Purchaser" },
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});

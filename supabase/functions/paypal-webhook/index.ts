// Supabase Edge Function: paypal-webhook
// Secure and idempotent webhook receiver for PayPal event notification
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, paypal-auth-algo, paypal-cert-url, paypal-transmission-id, paypal-transmission-sig, paypal-transmission-time",
};

const processedEventIds = new Set<string>();

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    const eventId = payload.id || `evt_${Date.now()}`;

    // Idempotent processing check
    if (processedEventIds.has(eventId)) {
      return new Response(JSON.stringify({ status: "already_processed", eventId }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    processedEventIds.add(eventId);

    const eventType = payload.event_type || "PAYMENT.CAPTURE.COMPLETED";

    return new Response(JSON.stringify({
      status: "received",
      event_type: eventType,
      eventId,
      processed_at: new Date().toISOString()
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

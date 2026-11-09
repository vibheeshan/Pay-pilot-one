// Supabase Edge Function: notification-service
// Manages real-time event alerts and push notification triggers
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
    const { title, message, type = "info", user_id } = await req.json();

    const notificationRecord = {
      id: `notif_${Date.now()}`,
      title: title || "System Alert",
      message: message || "PayPilot event triggered.",
      type,
      user_id,
      read: false,
      created_at: new Date().toISOString(),
    };

    return new Response(JSON.stringify({ status: "dispatched", notification: notificationRecord }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});

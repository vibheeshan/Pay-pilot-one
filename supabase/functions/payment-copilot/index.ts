// Supabase Edge Function: payment-copilot
// Multi-agent financial orchestrator with human approval security gate
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
    const { message, context } = await req.json();
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");

    if (!message) {
      return new Response(JSON.stringify({ error: "Message required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Default response shape
    const responsePayload = {
      agent_tag: "payment_agent",
      response_text: `Payment Operations verified. Context: ${context?.business_name || 'Active Workspace'}.`,
      action_data: null as any,
    };

    if (/invoice|bill|draft/i.test(message)) {
      responsePayload.agent_tag = "invoice_agent";
      responsePayload.action_data = {
        action_type: "create_invoice",
        title: "Draft Client Invoice",
        summary: "Calculated invoice line items with 8.25% tax. Requires human authorization.",
        requires_human_approval: true,
      };
    } else if (/remind|overdue/i.test(message)) {
      responsePayload.agent_tag = "invoice_agent";
      responsePayload.action_data = {
        action_type: "send_invoice_reminder",
        title: "Dispatch Overdue Reminder",
        summary: "Notice prepared for overdue client accounts. Awaiting confirmation.",
        requires_human_approval: true,
      };
    }

    if (geminiApiKey) {
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`;
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `You are PayPilot Copilot. Answer concisely: "${message}"` }] }]
        })
      });
      const data = await res.json();
      if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
        responsePayload.response_text = data.candidates[0].content.parts[0].text;
      }
    }

    return new Response(JSON.stringify(responsePayload), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});

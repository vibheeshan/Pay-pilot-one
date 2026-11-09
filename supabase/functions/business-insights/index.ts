// Supabase Edge Function: business-insights
// Analyzes sales velocity, cash flow runway, and customer cohort health
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
    const { metrics } = await req.json();
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");

    const prompt = `Analyze these business metrics: ${JSON.stringify(metrics || {})}. Provide: 1. Executive Summary, 2. Top Performing Revenue Driver, 3. Churn/Overdue Risk, 4. Three High-ROI Tactical Recommendations.`;

    let insights = "Revenue velocity is healthy. Focus on closing outstanding invoices to maximize operating liquidity.";

    if (geminiApiKey) {
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`;
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });
      const data = await response.json();
      insights = data.candidates?.[0]?.content?.parts?.[0]?.text || insights;
    }

    return new Response(JSON.stringify({ insights, generated_at: new Date().toISOString() }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});

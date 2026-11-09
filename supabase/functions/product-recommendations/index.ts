// Supabase Edge Function: product-recommendations
// AI-assisted shopping and SaaS recommendation engine based on user requirements or budget
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
    const { budget, requirement, catalog } = await req.json();
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");

    let recommendations = [];
    if (catalog && Array.isArray(catalog)) {
      recommendations = catalog.filter((p: any) => (!budget || p.price <= budget));
    }

    let aiExplanation = `Filtered ${recommendations.length} items within $${budget || 'unlimited'} budget.`;

    if (geminiApiKey) {
      const prompt = `Given this software catalog: ${JSON.stringify(catalog)}, recommend the best 2 tools for: "${requirement || 'infrastructure scale'}". Budget limit: $${budget || 'any'}.`;
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`;
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });
      const data = await response.json();
      aiExplanation = data.candidates?.[0]?.content?.parts?.[0]?.text || aiExplanation;
    }

    return new Response(JSON.stringify({ recommendations, aiExplanation }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});

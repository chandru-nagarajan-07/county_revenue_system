import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are a knowledgeable bank product advisor. The bank offers the following account types:

1. **Savings Account** – Ideal for customers looking to save regularly and earn interest. Good for emergency funds, goal-based savings, and building financial discipline. Interest: 4-7% p.a.
2. **Current Account** – Best for businesses and individuals with high transaction volumes. No interest but offers cheque books, overdraft facilities, and unlimited transactions.
3. **Fixed Deposit Account** – For customers who want to lock funds for a guaranteed return. Terms from 1-12 months. Higher interest rates (8-12% p.a.) but limited liquidity.
4. **Foreign Currency (FX) Account** – For customers who earn, receive, or need to hold foreign currencies (USD, EUR, GBP). Ideal for importers, exporters, diaspora, and frequent travelers.
5. **Junior Savings Account** – For parents/guardians opening accounts for children under 18. Teaches financial literacy with competitive interest rates.
6. **Business Current Account** – Tailored for SMEs and corporates with payroll integration, bulk payments, and trade finance facilities.

Based on the customer's stated objective or purpose, recommend the BEST FIT account type(s). Provide:
- Your top recommendation with a clear reason
- Any alternative options worth considering
- Key benefits relevant to their specific need

Keep responses concise (3-5 sentences). Be warm and professional.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please top up." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service unavailable" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("product-advisor error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

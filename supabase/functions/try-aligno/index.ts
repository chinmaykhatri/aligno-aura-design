import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { scenario } = await req.json();
    
    if (!scenario || typeof scenario !== "string" || scenario.trim().length < 10) {
      return new Response(
        JSON.stringify({ error: "Please provide a project scenario with at least 10 characters." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("AI service not configured");
    }

    console.log("Processing scenario:", scenario.substring(0, 100));

    const systemPrompt = `You are Aligno, a work intelligence platform that provides predictive insights for project teams. 
Given a project scenario, analyze it and provide a structured insight response.

Your response must be valid JSON with this exact structure:
{
  "healthScore": <number 0-100>,
  "healthStatus": "<string: 'healthy' | 'at-risk' | 'critical'>",
  "primaryRisk": "<string: main risk identified>",
  "riskLevel": "<string: 'low' | 'medium' | 'high'>",
  "predictedImpact": "<string: e.g., '+3 days delay' or 'On track'>",
  "recommendedAction": "<string: clear actionable recommendation>",
  "whyThisMatters": "<string: 2-3 sentence explanation of why this insight is important>",
  "confidenceScore": <number 0-100>
}

Be realistic and helpful. Focus on actionable insights that help teams make better decisions early.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Analyze this project scenario and provide insights:\n\n${scenario}` }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "provide_project_insight",
              description: "Provide structured project insight analysis",
              parameters: {
                type: "object",
                properties: {
                  healthScore: { type: "number", description: "Project health score 0-100" },
                  healthStatus: { type: "string", enum: ["healthy", "at-risk", "critical"] },
                  primaryRisk: { type: "string", description: "Main risk identified" },
                  riskLevel: { type: "string", enum: ["low", "medium", "high"] },
                  predictedImpact: { type: "string", description: "Impact prediction" },
                  recommendedAction: { type: "string", description: "Actionable recommendation" },
                  whyThisMatters: { type: "string", description: "Explanation of why this matters" },
                  confidenceScore: { type: "number", description: "Confidence in analysis 0-100" }
                },
                required: ["healthScore", "healthStatus", "primaryRisk", "riskLevel", "predictedImpact", "recommendedAction", "whyThisMatters", "confidenceScore"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "provide_project_insight" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Service is busy. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Service temporarily unavailable." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error("AI service error");
    }

    const data = await response.json();
    console.log("AI response received");

    let insight;
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      insight = JSON.parse(toolCall.function.arguments);
    } else {
      // Fallback: try to parse from content
      const content = data.choices?.[0]?.message?.content;
      if (content) {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          insight = JSON.parse(jsonMatch[0]);
        }
      }
    }

    if (!insight) {
      throw new Error("Could not parse AI response");
    }

    return new Response(JSON.stringify({ insight }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("try-aligno error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "An error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
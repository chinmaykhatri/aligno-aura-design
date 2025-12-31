import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Sanitize input
function sanitize(input: string | null | undefined, maxLength = 500): string {
  if (!input) return '';
  return input
    .replace(/[<>{}[\]]/g, '')
    .slice(0, maxLength)
    .trim();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, context } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const sanitizedQuery = sanitize(query, 500);
    if (!sanitizedQuery) {
      return new Response(
        JSON.stringify({ error: "Query is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build context from provided data
    const projectContext = (context?.projects || []).slice(0, 20).map((p: any) => ({
      id: p.id,
      name: sanitize(p.name, 100),
      status: p.status,
      progress: p.progress
    }));

    const taskContext = (context?.tasks || []).slice(0, 50).map((t: any) => ({
      id: t.id,
      title: sanitize(t.title, 100),
      status: t.status,
      priority: t.priority,
      projectId: t.project_id,
      dueDate: t.due_date,
      assignedTo: t.assigned_to
    }));

    const sprintContext = (context?.sprints || []).slice(0, 10).map((s: any) => ({
      id: s.id,
      name: sanitize(s.name, 100),
      status: s.status,
      projectId: s.project_id
    }));

    const systemPrompt = `You are an intelligent assistant for Aligno, a project management platform. Users can ask natural language questions about their projects, tasks, and sprints.

Available data context:
- Projects: ${JSON.stringify(projectContext)}
- Tasks: ${JSON.stringify(taskContext)}
- Sprints: ${JSON.stringify(sprintContext)}

Respond to user queries by analyzing this data. Format your response as JSON:
{
  "answer": "Direct answer to the question",
  "details": ["Additional detail points if relevant"],
  "relatedItems": [
    {
      "type": "project" | "task" | "sprint",
      "id": "item id",
      "name": "item name",
      "relevance": "why this item is relevant"
    }
  ],
  "suggestions": ["Follow-up questions the user might ask"]
}

Be helpful, specific, and reference actual items from the data when possible.`;

    console.log("Processing natural language query:", sanitizedQuery);

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
          { role: "user", content: sanitizedQuery }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    let result;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        result = { answer: content, details: [], relatedItems: [], suggestions: [] };
      }
    } catch {
      result = { answer: content, details: [], relatedItems: [], suggestions: [] };
    }

    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Natural language query error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

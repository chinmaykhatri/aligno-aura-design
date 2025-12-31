import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Sanitize input to prevent prompt injection
function sanitize(input: string | null | undefined, maxLength = 200): string {
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
    const { projects, tasks, sprints, dateRange } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Prepare sanitized project summaries
    const projectSummaries = (projects || []).slice(0, 10).map((p: any) => ({
      name: sanitize(p.name, 100),
      status: sanitize(p.status, 20),
      progress: Math.min(100, Math.max(0, Number(p.progress) || 0)),
      teamSize: Number(p.members?.length) || 0
    }));

    // Prepare sanitized task summaries
    const taskStats = {
      total: (tasks || []).length,
      completed: (tasks || []).filter((t: any) => t.status === 'completed').length,
      inProgress: (tasks || []).filter((t: any) => t.status === 'in_progress').length,
      overdue: (tasks || []).filter((t: any) => {
        if (!t.due_date) return false;
        return new Date(t.due_date) < new Date() && t.status !== 'completed';
      }).length,
      highPriority: (tasks || []).filter((t: any) => t.priority === 'high').length
    };

    // Prepare sprint summaries
    const sprintSummaries = (sprints || []).slice(0, 5).map((s: any) => ({
      name: sanitize(s.name, 100),
      status: sanitize(s.status, 20),
      goal: sanitize(s.goal, 200)
    }));

    const systemPrompt = `You are an executive report writer for a project management platform called Aligno. Generate professional, concise executive summaries that highlight:
1. Key achievements and wins
2. Current risks and blockers
3. Team velocity and productivity trends
4. Recommendations for the coming week

Format the response as JSON with these sections:
{
  "summary": "2-3 sentence executive summary",
  "achievements": ["list of 3-5 key achievements"],
  "risks": ["list of 2-4 risks with severity (high/medium/low)"],
  "velocityInsight": "brief insight about team velocity",
  "recommendations": ["list of 3-5 actionable recommendations"],
  "outlook": "brief outlook for the coming period"
}

Be specific but concise. Use the actual project data provided.`;

    const userPrompt = `Generate an executive report for the ${sanitize(dateRange, 20) || 'past week'}.

Projects Overview:
${JSON.stringify(projectSummaries, null, 2)}

Task Statistics:
- Total tasks: ${taskStats.total}
- Completed: ${taskStats.completed}
- In Progress: ${taskStats.inProgress}
- Overdue: ${taskStats.overdue}
- High Priority: ${taskStats.highPriority}

Active Sprints:
${JSON.stringify(sprintSummaries, null, 2)}

Generate a professional executive report based on this data.`;

    console.log("Generating executive report");

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
          { role: "user", content: userPrompt }
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
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    // Parse the JSON response
    let report;
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        report = JSON.parse(jsonMatch[0]);
      } else {
        report = { summary: content, achievements: [], risks: [], recommendations: [], outlook: '' };
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      report = { summary: content, achievements: [], risks: [], recommendations: [], outlook: '' };
    }

    return new Response(JSON.stringify({ report }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Executive report error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

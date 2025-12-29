import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectId, actionType, brief } = await req.json();
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    
    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch existing project data
    const { data: project } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();

    const { data: tasks } = await supabase
      .from("tasks")
      .select("*")
      .eq("project_id", projectId);

    const { data: sprints } = await supabase
      .from("sprints")
      .select("*")
      .eq("project_id", projectId);

    const { data: goals } = await supabase
      .from("goals")
      .select("*")
      .eq("project_id", projectId);

    const { data: roadmapItems } = await supabase
      .from("roadmap_items")
      .select("*")
      .eq("project_id", projectId);

    let systemPrompt = "";
    let userPrompt = "";

    if (actionType === "generate_plan") {
      // WBS Generator from brief
      systemPrompt = `You are a project planning expert. Generate a comprehensive work breakdown structure (WBS) with epics, tasks, dependencies, and timeline from a project brief.

Return JSON with this exact structure:
{
  "projectPlan": {
    "summary": "<brief summary of the plan>",
    "estimatedDuration": "<e.g., 3 months>",
    "roadmapItems": [
      {
        "title": "<epic/initiative name>",
        "description": "<what this delivers>",
        "lane": "q1" | "q2" | "q3" | "q4" | "now" | "next" | "later",
        "priority": <1-10>,
        "color": "<hex color>",
        "tasks": [
          {
            "title": "<task name>",
            "description": "<what to do>",
            "priority": "high" | "medium" | "low",
            "estimated_hours": <number>,
            "dependencies": ["<task title it depends on>"]
          }
        ]
      }
    ],
    "milestones": [
      { "title": "<milestone>", "targetDate": "<relative timing>" }
    ]
  }
}`;

      userPrompt = `Generate a detailed project plan from this brief:

PROJECT BRIEF:
${brief}

EXISTING PROJECT: ${project?.name || "New Project"}

Create a realistic, phased plan with:
1. Clear epics/initiatives for the roadmap
2. Detailed tasks with estimates and dependencies
3. Logical sequencing (what comes first)
4. Appropriate lane assignments (now/next/later or Q1-Q4)`;

    } else if (actionType === "analyze_roadmap") {
      // AI suggestions for existing roadmap
      systemPrompt = `You are a product roadmap analyst. Analyze the roadmap and provide actionable suggestions for improvements, capacity issues, and release planning.

Return JSON with this structure:
{
  "analysis": {
    "summary": "<overall assessment>",
    "capacityAlerts": [
      { "lane": "<lane>", "issue": "<what's wrong>", "suggestion": "<how to fix>" }
    ],
    "groupingSuggestions": [
      { "items": ["<item1>", "<item2>"], "reason": "<why group>", "suggestedRelease": "<release name>" }
    ],
    "priorityRecommendations": [
      { "item": "<item title>", "currentLane": "<lane>", "suggestedLane": "<new lane>", "reason": "<why>" }
    ],
    "riskItems": [
      { "item": "<item>", "risk": "<what could go wrong>", "mitigation": "<suggestion>" }
    ]
  }
}`;

      userPrompt = `Analyze this product roadmap:

PROJECT: ${project?.name}
CURRENT TASKS: ${tasks?.length || 0}
SPRINTS: ${sprints?.length || 0}
GOALS: ${goals?.length || 0}

ROADMAP ITEMS:
${(roadmapItems || []).map(item => 
  `- "${item.title}" [${item.lane}] Status: ${item.status}, Priority: ${item.priority}`
).join("\n") || "No items yet"}

TASKS BY STATUS:
- Pending: ${tasks?.filter(t => t.status === 'pending').length || 0}
- In Progress: ${tasks?.filter(t => t.status === 'in_progress').length || 0}
- Completed: ${tasks?.filter(t => t.status === 'completed').length || 0}

Provide suggestions for:
1. Lane capacity balance
2. Items that should be grouped together
3. Priority adjustments
4. Risk identification`;
    } else {
      throw new Error("Invalid action type");
    }

    console.log("Calling Lovable AI for roadmap analysis...");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.4,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds to your workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No response from AI");
    }

    // Parse JSON from response
    let result;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      throw new Error("Failed to parse AI response");
    }

    console.log("Roadmap AI analysis complete");

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Roadmap AI error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

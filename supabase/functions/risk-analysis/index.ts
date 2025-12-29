import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  due_date: string | null;
  estimated_hours: number | null;
  tracked_hours: number | null;
  assigned_to: string | null;
  sprint_id: string | null;
  created_at: string;
  updated_at: string;
}

interface Sprint {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectId, analysisType } = await req.json();
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    
    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch project data
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (projectError) throw projectError;

    // Fetch tasks
    const { data: tasks, error: tasksError } = await supabase
      .from("tasks")
      .select("*")
      .eq("project_id", projectId);

    if (tasksError) throw tasksError;

    // Fetch sprints
    const { data: sprints, error: sprintsError } = await supabase
      .from("sprints")
      .select("*")
      .eq("project_id", projectId);

    if (sprintsError) throw sprintsError;

    // Fetch scheduling history for patterns
    const { data: history } = await supabase
      .from("scheduling_history")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(50);

    const now = new Date();
    
    // Calculate basic risk metrics
    const overdueTasks = (tasks as Task[]).filter(t => 
      t.due_date && new Date(t.due_date) < now && t.status !== "completed"
    );
    
    const tasksWithNoEstimate = (tasks as Task[]).filter(t => 
      !t.estimated_hours && t.status !== "completed"
    );
    
    const highPriorityIncomplete = (tasks as Task[]).filter(t => 
      t.priority === "high" && t.status !== "completed"
    );

    const completedTasks = (tasks as Task[]).filter(t => t.status === "completed");
    const totalTasks = tasks?.length || 0;
    const completionRate = totalTasks > 0 ? (completedTasks.length / totalTasks) * 100 : 0;

    // Build AI prompt for risk analysis
    const systemPrompt = `You are a project management risk analyst. Analyze the provided project data and identify risks, predict potential slip days, and suggest mitigation actions. Be specific and actionable.

Return your analysis as a JSON object with this exact structure:
{
  "projectRisk": {
    "riskScore": <0-100>,
    "riskLevel": "low" | "medium" | "high" | "critical",
    "predictedSlipDays": <number>,
    "confidenceScore": <0-100>,
    "summary": "<brief summary>",
    "riskFactors": [
      { "factor": "<description>", "severity": "low" | "medium" | "high", "impact": "<what could happen>" }
    ],
    "mitigationActions": [
      { "action": "<specific action>", "priority": "immediate" | "soon" | "later", "effort": "low" | "medium" | "high" }
    ]
  },
  "taskRisks": [
    {
      "taskId": "<uuid>",
      "taskTitle": "<title>",
      "riskScore": <0-100>,
      "riskLevel": "low" | "medium" | "high" | "critical",
      "predictedSlipDays": <number>,
      "factors": ["<reason1>", "<reason2>"],
      "suggestion": "<mitigation>"
    }
  ],
  "sprintRisks": [
    {
      "sprintId": "<uuid>",
      "sprintName": "<name>",
      "riskScore": <0-100>,
      "riskLevel": "low" | "medium" | "high" | "critical",
      "factors": ["<reason1>"],
      "suggestion": "<mitigation>"
    }
  ]
}`;

    const userPrompt = `Analyze this project for risks:

PROJECT: ${project.name}
Status: ${project.status}
Progress: ${project.progress}%
Completion Rate: ${completionRate.toFixed(1)}%

TASK SUMMARY:
- Total Tasks: ${totalTasks}
- Completed: ${completedTasks.length}
- Overdue: ${overdueTasks.length}
- High Priority Incomplete: ${highPriorityIncomplete.length}
- Tasks Without Estimates: ${tasksWithNoEstimate.length}

OVERDUE TASKS:
${overdueTasks.map(t => `- "${t.title}" (Priority: ${t.priority}, Due: ${t.due_date})`).join("\n") || "None"}

HIGH PRIORITY INCOMPLETE:
${highPriorityIncomplete.map(t => `- "${t.title}" (Status: ${t.status}, Due: ${t.due_date || "No date"})`).join("\n") || "None"}

ALL TASKS:
${(tasks as Task[]).slice(0, 20).map(t => 
  `- "${t.title}" [${t.status}] Priority: ${t.priority}, Due: ${t.due_date || "None"}, Est: ${t.estimated_hours || 0}h, Tracked: ${t.tracked_hours || 0}h`
).join("\n")}

SPRINTS:
${(sprints as Sprint[]).map(s => 
  `- "${s.name}" [${s.status}] ${s.start_date} to ${s.end_date}`
).join("\n") || "No sprints"}

RECENT SCHEDULING CHANGES: ${history?.length || 0} actions in history

Analyze for schedule slips, workload issues, blocking risks, and provide actionable mitigations.`;

    console.log("Calling Lovable AI for risk analysis...");

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
        temperature: 0.3,
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
    let analysis;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("JSON parse error:", parseError, "Content:", content);
      // Return basic analysis if AI parse fails
      analysis = {
        projectRisk: {
          riskScore: overdueTasks.length > 3 ? 70 : overdueTasks.length > 0 ? 40 : 20,
          riskLevel: overdueTasks.length > 3 ? "high" : overdueTasks.length > 0 ? "medium" : "low",
          predictedSlipDays: overdueTasks.length * 2,
          confidenceScore: 60,
          summary: `${overdueTasks.length} overdue tasks, ${highPriorityIncomplete.length} high priority items pending`,
          riskFactors: overdueTasks.length > 0 ? [{ factor: "Overdue tasks", severity: "high", impact: "Schedule slip" }] : [],
          mitigationActions: overdueTasks.length > 0 ? [{ action: "Address overdue tasks immediately", priority: "immediate", effort: "medium" }] : [],
        },
        taskRisks: overdueTasks.slice(0, 5).map(t => ({
          taskId: t.id,
          taskTitle: t.title,
          riskScore: 80,
          riskLevel: "high",
          predictedSlipDays: 3,
          factors: ["Task is overdue"],
          suggestion: "Reassign or add buffer time",
        })),
        sprintRisks: [],
      };
    }

    // Store the project-level risk assessment
    const { error: insertError } = await supabase
      .from("risk_assessments")
      .upsert({
        project_id: projectId,
        task_id: null,
        sprint_id: null,
        risk_score: analysis.projectRisk.riskScore,
        risk_level: analysis.projectRisk.riskLevel,
        risk_factors: analysis.projectRisk.riskFactors,
        mitigation_actions: analysis.projectRisk.mitigationActions,
        predicted_slip_days: analysis.projectRisk.predictedSlipDays,
        confidence_score: analysis.projectRisk.confidenceScore,
        assessed_at: new Date().toISOString(),
      }, {
        onConflict: "project_id",
        ignoreDuplicates: false,
      });

    if (insertError) {
      console.error("Failed to store assessment:", insertError);
    }

    console.log("Risk analysis complete");

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Risk analysis error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

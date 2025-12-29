import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Sanitize user input to prevent prompt injection attacks
function sanitizeForPrompt(input: string | null | undefined, maxLength: number = 200): string {
  if (!input) return '';
  
  let sanitized = String(input)
    .replace(/[\x00-\x1f\x7f]/g, '')
    .replace(/[<>{}[\]\\]/g, '')
    .replace(/```/g, '')
    .replace(/\n{2,}/g, '\n')
    .trim();
  
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength) + '...';
  }
  
  return sanitized;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, data } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const allowedTypes = ['task-suggestions', 'sprint-recommendations', 'retrospective-insights'];
    if (!allowedTypes.includes(type)) {
      console.error(`Invalid insight type: ${type}`);
      return new Response(JSON.stringify({ error: 'Invalid insight type' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`AI insights request: ${type}`);

    let systemPrompt = '';
    let userPrompt = '';

    switch (type) {
      case 'task-suggestions': {
        const { goals, existingTasks, projectName } = data;
        
        const goalsContext = goals?.map((g: any) => 
          `- "${sanitizeForPrompt(g.title, 100)}" (Progress: ${g.progress || 0}%, Status: ${g.status || 'in_progress'}, Target: ${g.target_date || 'No deadline'})`
        ).join('\n') || 'No goals defined';

        const existingTasksContext = existingTasks?.slice(0, 10).map((t: any) => 
          `- "${sanitizeForPrompt(t.title, 80)}"`
        ).join('\n') || 'No existing tasks';

        systemPrompt = `You are an AI project assistant that suggests actionable tasks based on project goals. Be specific, actionable, and practical. Return JSON format only.`;
        userPrompt = `Based on these project goals for "${sanitizeForPrompt(projectName, 50)}", suggest 3-5 new tasks that would help achieve them.

Project Goals:
${goalsContext}

Existing Tasks (avoid duplicates):
${existingTasksContext}

Return JSON: { "suggestions": [{ "title": "task title", "description": "brief description", "priority": "high|medium|low", "estimatedHours": number, "relatedGoal": "goal title this helps achieve", "reasoning": "why this task helps" }] }`;
        break;
      }

      case 'sprint-recommendations': {
        const { sprint, tasks, velocity, capacity } = data;
        
        const backlogTasks = tasks?.filter((t: any) => !t.sprint_id).slice(0, 15).map((t: any) => 
          `- "${sanitizeForPrompt(t.title, 80)}" (Priority: ${t.priority || 'medium'}, Points: ${t.story_points || 'N/A'}, Hours: ${t.estimated_hours || 'N/A'}h)`
        ).join('\n') || 'No backlog tasks';

        const sprintTasks = tasks?.filter((t: any) => t.sprint_id === sprint?.id).map((t: any) => 
          `- "${sanitizeForPrompt(t.title, 80)}" (Status: ${t.status}, Points: ${t.story_points || 0})`
        ).join('\n') || 'No sprint tasks yet';

        systemPrompt = `You are an AI sprint planning advisor. Analyze sprint capacity and backlog to provide smart planning recommendations. Return JSON format only.`;
        userPrompt = `Provide sprint planning recommendations:

Sprint: ${sanitizeForPrompt(sprint?.name, 50) || 'New Sprint'}
Goal: ${sanitizeForPrompt(sprint?.goal, 200) || 'No goal set'}
Duration: ${sprint?.start_date} to ${sprint?.end_date}

Team Velocity: ${velocity?.averagePoints || 'Unknown'} story points/sprint
Available Capacity: ${capacity || 'Unknown'} hours

Current Sprint Tasks:
${sprintTasks}

Backlog (prioritized):
${backlogTasks}

Return JSON: { 
  "recommendations": [{ 
    "type": "add_task|remove_task|adjust_scope|capacity_warning|goal_suggestion",
    "title": "recommendation title",
    "description": "detailed explanation",
    "priority": "high|medium|low",
    "taskTitle": "related task title if applicable"
  }],
  "sprintHealth": {
    "score": "good|warning|at_risk",
    "commitmentLevel": "under|optimal|over",
    "suggestedPoints": number,
    "summary": "one sentence summary"
  }
}`;
        break;
      }

      case 'retrospective-insights': {
        const { retrospectives, sprintName, sprintStats } = data;
        
        const retroContext = retrospectives?.map((r: any) => 
          `[${r.category}] ${sanitizeForPrompt(r.content, 150)} ${r.is_resolved ? '(Resolved)' : ''}`
        ).join('\n') || 'No retrospective items';

        systemPrompt = `You are an AI retrospective analyst. Analyze sprint retrospective feedback to identify patterns, themes, and actionable insights. Return JSON format only.`;
        userPrompt = `Analyze this sprint retrospective and provide insights:

Sprint: ${sanitizeForPrompt(sprintName, 50)}
Completion Rate: ${sprintStats?.completionRate || 'N/A'}%
Velocity: ${sprintStats?.completedPoints || 0} story points
Tasks Completed: ${sprintStats?.completedTasks || 0}/${sprintStats?.totalTasks || 0}

Retrospective Items:
${retroContext}

Return JSON: {
  "themes": [{ "theme": "theme name", "category": "went_well|to_improve|action_item", "frequency": number, "items": ["related items"] }],
  "insights": [{ "title": "insight title", "description": "detailed analysis", "impact": "high|medium|low", "category": "team|process|technical|communication" }],
  "actionPlan": [{ "action": "specific action", "owner": "suggested owner role", "priority": "high|medium|low", "timeframe": "immediate|next_sprint|ongoing" }],
  "summary": "2-3 sentence overall analysis"
}`;
        break;
      }

      default:
        throw new Error(`Unknown insight type: ${type}`);
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content;
    
    console.log('AI response received for:', type);

    let result;
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      result = JSON.parse(jsonMatch[1] || content);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      result = { error: 'Failed to parse AI response', raw: content };
    }

    return new Response(JSON.stringify({ type, result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('AI insights error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

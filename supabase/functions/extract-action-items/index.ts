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
    const { transcript } = await req.json();
    
    if (!transcript || transcript.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "No transcript provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Processing transcript for action items extraction...");
    console.log("Transcript length:", transcript.length);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an expert at analyzing meeting transcripts and extracting actionable information. 
            Extract action items, decisions, blockers, and key discussion points from meeting transcripts.
            Be thorough but concise. Focus on identifying WHO should do WHAT by WHEN.`
          },
          {
            role: "user",
            content: `Analyze this meeting transcript and extract structured information:

${transcript}

Return a JSON object with this structure:
{
  "summary": "Brief 1-2 sentence summary of the meeting",
  "action_items": [
    {"content": "task description", "assignee": "person name or null", "priority": "high|medium|low", "due_date": "mentioned date or null"}
  ],
  "decisions": ["decision 1", "decision 2"],
  "blockers": ["blocker 1", "blocker 2"],
  "key_points": ["point 1", "point 2"],
  "attendees": ["name1", "name2"]
}

Only return valid JSON, no markdown or explanation.`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_meeting_data",
              description: "Extract structured data from a meeting transcript",
              parameters: {
                type: "object",
                properties: {
                  summary: { type: "string", description: "Brief meeting summary" },
                  action_items: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        content: { type: "string" },
                        assignee: { type: "string" },
                        priority: { type: "string", enum: ["low", "medium", "high"] },
                        due_date: { type: "string" }
                      },
                      required: ["content", "priority"]
                    }
                  },
                  decisions: { type: "array", items: { type: "string" } },
                  blockers: { type: "array", items: { type: "string" } },
                  key_points: { type: "array", items: { type: "string" } },
                  attendees: { type: "array", items: { type: "string" } }
                },
                required: ["summary", "action_items", "decisions", "blockers", "key_points"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "extract_meeting_data" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    console.log("AI response received");

    // Extract the function call arguments
    let extractedData;
    try {
      const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall?.function?.arguments) {
        extractedData = JSON.parse(toolCall.function.arguments);
      } else {
        // Fallback: try to parse from content
        const content = aiResponse.choices?.[0]?.message?.content;
        if (content) {
          extractedData = JSON.parse(content);
        }
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      extractedData = {
        summary: "Meeting transcript processed",
        action_items: [],
        decisions: [],
        blockers: [],
        key_points: [],
        attendees: []
      };
    }

    console.log("Extracted action items:", extractedData.action_items?.length || 0);

    return new Response(
      JSON.stringify(extractedData),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error in extract-action-items:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to process transcript";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

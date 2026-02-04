import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { interviewId } = await req.json();

    if (!interviewId) {
      return new Response(
        JSON.stringify({ error: "Interview ID is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch interview data
    const { data: interview, error: interviewError } = await supabase
      .from("interviews")
      .select("*")
      .eq("id", interviewId)
      .single();

    if (interviewError || !interview) {
      return new Response(
        JSON.stringify({ error: "Interview not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Fetch interview messages
    const { data: messages, error: messagesError } = await supabase
      .from("interview_messages")
      .select("*")
      .eq("interview_id", interviewId)
      .order("timestamp", { ascending: true });

    if (messagesError) {
      console.error("Error fetching messages:", messagesError);
    }

    // Prepare conversation transcript
    const transcript = (messages || [])
      .map((m: any) => `${m.role}: ${m.content}`)
      .join("\n\n");

    // Prepare behavior data
    const gazeEvents = interview.gaze_events || [];
    const behaviorFlags = interview.behavior_flags || {};
    const resumeAnalysis = interview.resume_analysis || {};

    // Calculate duration
    const duration = interview.started_at && interview.completed_at
      ? Math.floor((new Date(interview.completed_at).getTime() - new Date(interview.started_at).getTime()) / 1000)
      : null;

    // Generate AI evaluation using Lovable AI
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const evaluationPrompt = `You are an expert HR interviewer evaluating a candidate's interview performance. Analyze the following interview and provide a detailed evaluation.

CANDIDATE BACKGROUND:
${JSON.stringify(resumeAnalysis, null, 2)}

INTERVIEW TRANSCRIPT:
${transcript || "No transcript available"}

BEHAVIORAL DATA:
- Gaze deviation events: ${Array.isArray(gazeEvents) ? gazeEvents.length : 0}
- Tab switches: ${behaviorFlags.tabSwitchCount || 0}
- Total time away from tab: ${behaviorFlags.totalHiddenTime || 0}ms

INTERVIEW DURATION: ${duration ? `${Math.floor(duration / 60)} minutes ${duration % 60} seconds` : "Unknown"}

Please evaluate the candidate and provide a JSON response with the following structure:
{
  "overall_score": <number 0-100>,
  "problem_solving_score": <number 0-100>,
  "problem_solving_feedback": "<brief feedback>",
  "communication_score": <number 0-100>,
  "communication_feedback": "<brief feedback>",
  "behavioral_fit_score": <number 0-100>,
  "behavioral_fit_feedback": "<brief feedback>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "growth_areas": ["<area 1>", "<area 2>"],
  "summary": "<2-3 sentence overall summary>",
  "recommendation": "<Recommend for next round / Further review needed / Not recommended>",
  "engagement_level": "<High/Medium/Low>",
  "consistency_flag": <true if responses seem inconsistent or scripted, false otherwise>
}

Be constructive and fair in your evaluation. Focus on specific examples from the transcript.`;

    const aiResponse = await fetch("https://api.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${lovableApiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are an expert HR interviewer providing fair, constructive interview evaluations. Always respond with valid JSON.",
          },
          {
            role: "user",
            content: evaluationPrompt,
          },
        ],
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", errorText);
      throw new Error(`AI evaluation failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content || "";

    // Parse AI response
    let evaluation;
    try {
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = aiContent.match(/```json\s*([\s\S]*?)\s*```/) || 
                        aiContent.match(/```\s*([\s\S]*?)\s*```/) ||
                        [null, aiContent];
      const jsonStr = jsonMatch[1] || aiContent;
      evaluation = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error("Failed to parse AI response:", aiContent);
      // Use default values if parsing fails
      evaluation = {
        overall_score: 70,
        problem_solving_score: 70,
        problem_solving_feedback: "Evaluation pending review",
        communication_score: 70,
        communication_feedback: "Evaluation pending review",
        behavioral_fit_score: 70,
        behavioral_fit_feedback: "Evaluation pending review",
        strengths: ["Completed the interview"],
        growth_areas: ["Further evaluation needed"],
        summary: "The interview was completed. A detailed evaluation will be provided after human review.",
        recommendation: "Further review needed",
        engagement_level: "Medium",
        consistency_flag: false,
      };
    }

    // Create the report
    const reportData = {
      interview_id: interviewId,
      overall_score: evaluation.overall_score,
      problem_solving_score: evaluation.problem_solving_score,
      problem_solving_feedback: evaluation.problem_solving_feedback,
      communication_score: evaluation.communication_score,
      communication_feedback: evaluation.communication_feedback,
      behavioral_fit_score: evaluation.behavioral_fit_score,
      behavioral_fit_feedback: evaluation.behavioral_fit_feedback,
      strengths: evaluation.strengths,
      growth_areas: evaluation.growth_areas,
      summary: evaluation.summary,
      recommendation: evaluation.recommendation,
      engagement_level: evaluation.engagement_level,
      gaze_deviation_count: Array.isArray(gazeEvents) ? gazeEvents.length : 0,
      consistency_flag: evaluation.consistency_flag,
      passed_to_hr: evaluation.overall_score >= 70 && !evaluation.consistency_flag,
      hr_notified_at: evaluation.overall_score >= 70 ? new Date().toISOString() : null,
    };

    // Insert or update the report
    const { data: report, error: reportError } = await supabase
      .from("interview_reports")
      .upsert(reportData, { onConflict: "interview_id" })
      .select()
      .single();

    if (reportError) {
      console.error("Error saving report:", reportError);
      throw new Error("Failed to save report");
    }

    // Update interview status
    await supabase
      .from("interviews")
      .update({
        status: "completed",
        completed_at: interview.completed_at || new Date().toISOString(),
        duration_seconds: duration,
      })
      .eq("id", interviewId);

    return new Response(
      JSON.stringify({
        success: true,
        report,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error generating report:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Failed to generate report",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

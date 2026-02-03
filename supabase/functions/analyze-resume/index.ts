import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ResumeAnalysis {
  name: string;
  skills: string[];
  experience: string[];
  education: string[];
  summary: string;
  dynamicQuestions: string[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { resumeText, fileName } = await req.json();

    if (!resumeText || resumeText.trim().length === 0) {
      throw new Error("Resume text is required");
    }

    console.log(`Analyzing resume: ${fileName}`);

    // Use Lovable AI to analyze the resume
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are an expert HR recruiter and resume analyst. Analyze the provided resume and extract key information. You must respond with a valid JSON object only, no additional text.

The JSON must have this exact structure:
{
  "name": "Candidate's full name (if not found, use 'Candidate')",
  "skills": ["skill1", "skill2", ...] (extract 5-10 key technical and soft skills),
  "experience": ["brief description of role 1", "brief description of role 2", ...] (max 3-4 key experiences),
  "education": ["degree/certification 1", "degree/certification 2", ...],
  "summary": "A 2-3 sentence professional summary of the candidate",
  "dynamicQuestions": ["question1", "question2", ...] (generate 6 personalized interview questions based on their specific skills and experience)
}

For dynamicQuestions, create questions that:
1. First question: Ask them to introduce themselves briefly
2. Questions 2-4: Focus on their specific technical skills and projects mentioned
3. Question 5: Ask about a challenging situation or problem they solved
4. Question 6: Ask if they have any questions for the interviewer`
          },
          {
            role: "user",
            content: `Please analyze this resume and extract the information:\n\n${resumeText}`
          }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Service temporarily unavailable. Please try again later." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI analysis failed: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No response from AI");
    }

    console.log("AI response received, parsing...");

    // Parse the JSON response
    let analysis: ResumeAnalysis;
    try {
      // Clean the response - remove markdown code blocks if present
      let cleanedContent = content.trim();
      if (cleanedContent.startsWith("```json")) {
        cleanedContent = cleanedContent.replace(/^```json\n?/, "").replace(/\n?```$/, "");
      } else if (cleanedContent.startsWith("```")) {
        cleanedContent = cleanedContent.replace(/^```\n?/, "").replace(/\n?```$/, "");
      }
      
      analysis = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      // Return a fallback analysis if parsing fails
      analysis = {
        name: "Candidate",
        skills: ["Communication", "Problem Solving", "Teamwork"],
        experience: ["Professional experience in relevant field"],
        education: ["Educational background"],
        summary: "Experienced professional with relevant skills and background.",
        dynamicQuestions: [
          "Tell me about yourself and your professional background.",
          "What interests you about this position?",
          "Describe a challenging project you've worked on.",
          "How do you handle tight deadlines and pressure?",
          "Where do you see yourself in 5 years?",
          "Do you have any questions for me?"
        ]
      };
    }

    // Ensure all required fields exist
    const validatedAnalysis: ResumeAnalysis = {
      name: analysis.name || "Candidate",
      skills: Array.isArray(analysis.skills) ? analysis.skills.slice(0, 10) : [],
      experience: Array.isArray(analysis.experience) ? analysis.experience.slice(0, 4) : [],
      education: Array.isArray(analysis.education) ? analysis.education : [],
      summary: analysis.summary || "Professional candidate with relevant experience.",
      dynamicQuestions: Array.isArray(analysis.dynamicQuestions) && analysis.dynamicQuestions.length >= 6
        ? analysis.dynamicQuestions
        : [
            "Tell me about yourself and your professional background.",
            "What interests you about this position?",
            "Describe a challenging project you've worked on.",
            "How do you handle tight deadlines and pressure?",
            "Where do you see yourself in 5 years?",
            "Do you have any questions for me?"
          ]
    };

    console.log("Resume analysis complete:", validatedAnalysis.name);

    return new Response(
      JSON.stringify({ success: true, analysis: validatedAnalysis }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error analyzing resume:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

 import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
 import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
 
 const corsHeaders = {
   "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Headers":
     "authorization, x-client-info, apikey, content-type",
 };
 
 interface NotificationRequest {
   interviewId: string;
   candidateName: string;
   candidateEmail?: string;
   overallScore: number;
   recommendation: string;
   reportUrl: string;
 }
 
 serve(async (req) => {
   // Handle CORS preflight requests
   if (req.method === "OPTIONS") {
     return new Response(null, { headers: corsHeaders });
   }
 
   try {
     const resendApiKey = Deno.env.get("RESEND_API_KEY");
     
     // If no Resend API key, log the notification but don't fail
     if (!resendApiKey) {
       console.log("RESEND_API_KEY not configured - email notifications disabled");

       const { interviewId, candidateName, overallScore, recommendation } = await req.json();

       // Log the notification for tracking
       console.log(`HR NOTIFICATION: Candidate ${candidateName} scored ${overallScore}% - ${recommendation}`);
       console.log(`Interview ID: ${interviewId}`);

       return new Response(
         JSON.stringify({
           success: true,
           message: "Notification logged (email not configured)",
           emailSent: false,
         }),
         {
           status: 200,
           headers: { ...corsHeaders, "Content-Type": "application/json" },
         }
       );
     }
 
    // Dynamic import for Resend
    const { Resend } = await import("https://esm.sh/resend@2.0.0");
    const resend = new Resend(resendApiKey);

     const {
       interviewId,
       candidateName,
       candidateEmail,
       overallScore,
       recommendation,
       reportUrl,
     }: NotificationRequest = await req.json();
 
     // Validate required fields
     if (!interviewId || !candidateName) {
       throw new Error("Missing required fields");
     }
 
     // Get HR email from environment or use default
     const hrEmail = Deno.env.get("HR_NOTIFICATION_EMAIL") || "hr@company.com";
 
     // Determine email styling based on score
     const isPassed = overallScore >= 70;
     const statusColor = isPassed ? "#22c55e" : "#f59e0b";
     const statusText = isPassed ? "PASSED" : "NEEDS REVIEW";
 
     // Send email to HR
     const emailResponse = await resend.emails.send({
       from: "HumanTalk AI <noreply@humantalk.ai>",
       to: [hrEmail],
       subject: `[${statusText}] Interview Complete: ${candidateName} - ${overallScore}%`,
       html: `
         <!DOCTYPE html>
         <html>
         <head>
           <meta charset="utf-8">
           <style>
             body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
             .container { max-width: 600px; margin: 0 auto; padding: 20px; }
             .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 30px; border-radius: 12px 12px 0 0; }
             .content { background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; }
             .score-badge { display: inline-block; background: ${statusColor}; color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold; font-size: 18px; }
             .metric { background: white; padding: 15px; border-radius: 8px; margin: 10px 0; border-left: 4px solid ${statusColor}; }
             .button { display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500; }
           </style>
         </head>
         <body>
           <div class="container">
             <div class="header">
               <h1 style="margin: 0;">🎯 Interview Complete</h1>
               <p style="margin: 10px 0 0; opacity: 0.9;">AI-Powered Candidate Evaluation</p>
             </div>
             <div class="content">
               <h2 style="margin-top: 0;">Candidate: ${candidateName}</h2>
               
               <div class="metric">
                 <strong>Overall Score:</strong>
                 <span class="score-badge">${overallScore}%</span>
               </div>
               
               <div class="metric">
                 <strong>Status:</strong> ${statusText}
               </div>
               
               <div class="metric">
                 <strong>Recommendation:</strong> ${recommendation}
               </div>
               
               ${candidateEmail ? `
               <div class="metric">
                 <strong>Candidate Email:</strong> ${candidateEmail}
               </div>
               ` : ''}
               
               <p style="margin-top: 30px;">
                 <a href="${reportUrl}" class="button">View Full Report →</a>
               </p>
               
               <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
               
               <p style="color: #6b7280; font-size: 14px;">
                 This is an automated notification from HumanTalk AI. 
                 The candidate has completed their interview and the AI evaluation is ready for your review.
               </p>
             </div>
           </div>
         </body>
         </html>
       `,
     });
 
     console.log("HR notification email sent successfully:", emailResponse);
 
     // Update the report to mark HR as notified
     const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
     const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
     const supabase = createClient(supabaseUrl, supabaseServiceKey);
 
     await supabase
       .from("interview_reports")
       .update({ hr_notified_at: new Date().toISOString() })
       .eq("interview_id", interviewId);
 
     return new Response(
       JSON.stringify({
         success: true,
         message: "HR notification sent",
         emailSent: true,
        emailId: (emailResponse as any).id || "sent",
       }),
       {
         status: 200,
         headers: { ...corsHeaders, "Content-Type": "application/json" },
       }
     );
   } catch (error: any) {
     console.error("Error in send-hr-notification function:", error);
     return new Response(
       JSON.stringify({ error: error.message }),
       {
         status: 500,
         headers: { ...corsHeaders, "Content-Type": "application/json" },
       }
     );
   }
 });
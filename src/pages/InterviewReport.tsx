import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  MessageSquare,
  Brain,
  Heart,
  Eye,
  Clock,
  ArrowLeft,
  Send,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface InterviewReport {
  id: string;
  interview_id: string;
  overall_score: number | null;
  problem_solving_score: number | null;
  problem_solving_feedback: string | null;
  communication_score: number | null;
  communication_feedback: string | null;
  behavioral_fit_score: number | null;
  behavioral_fit_feedback: string | null;
  strengths: string[] | null;
  growth_areas: string[] | null;
  summary: string | null;
  recommendation: string | null;
  engagement_level: string | null;
  gaze_deviation_count: number | null;
  consistency_flag: boolean | null;
  passed_to_hr: boolean | null;
  hr_notified_at: string | null;
  created_at: string;
}

interface Interview {
  id: string;
  interview_type: string;
  status: string;
  duration_seconds: number | null;
  started_at: string | null;
  completed_at: string | null;
  resume_analysis: any;
}

const ScoreCard = ({
  title,
  score,
  feedback,
  icon: Icon,
}: {
  title: string;
  score: number | null;
  feedback: string | null;
  icon: React.ElementType;
}) => {
  const getScoreColor = (score: number | null) => {
    if (score === null) return "text-muted-foreground";
    if (score >= 80) return "text-success";
    if (score >= 60) return "text-warning";
    return "text-destructive";
  };

  const getProgressColor = (score: number | null) => {
    if (score === null) return "bg-muted";
    if (score >= 80) return "bg-success";
    if (score >= 60) return "bg-warning";
    return "bg-destructive";
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="w-4 h-4 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 mb-3">
          <span className={`text-3xl font-bold ${getScoreColor(score)}`}>
            {score ?? "—"}
          </span>
          <span className="text-muted-foreground">/100</span>
        </div>
        <div className="relative h-2 bg-muted rounded-full overflow-hidden mb-3">
          <div
            className={`absolute inset-y-0 left-0 ${getProgressColor(score)} transition-all duration-500`}
            style={{ width: `${score ?? 0}%` }}
          />
        </div>
        {feedback && (
          <p className="text-sm text-muted-foreground">{feedback}</p>
        )}
      </CardContent>
    </Card>
  );
};

const InterviewReportPage = () => {
  const { interviewId } = useParams<{ interviewId: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<InterviewReport | null>(null);
  const [interview, setInterview] = useState<Interview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReportAndInterview = async () => {
      if (!interviewId) {
        setError("No interview ID provided");
        setIsLoading(false);
        return;
      }

      try {
        // Fetch interview
        const { data: interviewData, error: interviewError } = await supabase
          .from("interviews")
          .select("*")
          .eq("id", interviewId)
          .single();

        if (interviewError) throw interviewError;
        setInterview(interviewData);

        // Fetch report
        const { data: reportData, error: reportError } = await supabase
          .from("interview_reports")
          .select("*")
          .eq("interview_id", interviewId)
          .single();

        if (reportError && reportError.code !== "PGRST116") {
          throw reportError;
        }

        setReport(reportData);
      } catch (err: any) {
        console.error("Error fetching report:", err);
        setError(err.message || "Failed to load report");
      } finally {
        setIsLoading(false);
      }
    };

    fetchReportAndInterview();
  }, [interviewId]);

  const generateReport = async () => {
    if (!interviewId) return;

    setIsGenerating(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-interview-report`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ interviewId }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to generate report");
      }

      const data = await response.json();
      if (data.success && data.report) {
        setReport(data.report);
        toast.success("Report generated successfully!");
      }
    } catch (err: any) {
      console.error("Error generating report:", err);
      toast.error(err.message || "Failed to generate report");
    } finally {
      setIsGenerating(false);
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "—";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading interview report...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Unable to Load Report</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => navigate("/")}>Return Home</Button>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md">
          <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Report Pending</h2>
          <p className="text-muted-foreground mb-4">
            The interview report is being generated. This usually takes a moment.
          </p>
          <Button onClick={generateReport} disabled={isGenerating}>
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              "Generate Report Now"
            )}
          </Button>
        </div>
      </div>
    );
  }

  const overallPassed = report.overall_score !== null && report.overall_score >= 70;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => navigate("/")} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
            <div className="flex items-center gap-2">
              {report.passed_to_hr ? (
                <Badge variant="default" className="bg-success text-success-foreground">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Passed to HR
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <Clock className="w-3 h-3 mr-1" />
                  Under Review
                </Badge>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Overall Score Section */}
          <div className="text-center">
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Interview <span className="text-gradient-hero">Report</span>
            </h1>
            <div
              className={`inline-flex items-center justify-center w-32 h-32 rounded-full border-4 ${
                overallPassed
                  ? "border-success bg-success/10"
                  : "border-warning bg-warning/10"
              }`}
            >
              <div className="text-center">
                <span
                  className={`text-4xl font-bold ${
                    overallPassed ? "text-success" : "text-warning"
                  }`}
                >
                  {report.overall_score ?? "—"}
                </span>
                <p className="text-xs text-muted-foreground mt-1">Overall Score</p>
              </div>
            </div>
            {report.recommendation && (
              <div className="mt-4 flex items-center justify-center gap-2">
                {overallPassed ? (
                  <CheckCircle className="w-5 h-5 text-success" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-warning" />
                )}
                <span className="font-medium">{report.recommendation}</span>
              </div>
            )}
          </div>

          {/* Summary */}
          {report.summary && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{report.summary}</p>
              </CardContent>
            </Card>
          )}

          {/* Score Cards */}
          <div className="grid md:grid-cols-3 gap-4">
            <ScoreCard
              title="Problem Solving"
              score={report.problem_solving_score}
              feedback={report.problem_solving_feedback}
              icon={Brain}
            />
            <ScoreCard
              title="Communication"
              score={report.communication_score}
              feedback={report.communication_feedback}
              icon={MessageSquare}
            />
            <ScoreCard
              title="Behavioral Fit"
              score={report.behavioral_fit_score}
              feedback={report.behavioral_fit_feedback}
              icon={Heart}
            />
          </div>

          {/* Strengths & Growth Areas */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Strengths */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-success">
                  <TrendingUp className="w-5 h-5" />
                  Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                {report.strengths && report.strengths.length > 0 ? (
                  <ul className="space-y-2">
                    {report.strengths.map((strength, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{strength}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No strengths identified</p>
                )}
              </CardContent>
            </Card>

            {/* Growth Areas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-warning">
                  <AlertCircle className="w-5 h-5" />
                  Growth Areas
                </CardTitle>
              </CardHeader>
              <CardContent>
                {report.growth_areas && report.growth_areas.length > 0 ? (
                  <ul className="space-y-2">
                    {report.growth_areas.map((area, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{area}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No growth areas identified</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Behavioral Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-primary" />
                Behavioral Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold">{report.engagement_level || "—"}</p>
                  <p className="text-xs text-muted-foreground">Engagement Level</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold">{report.gaze_deviation_count ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Gaze Deviations</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold">
                    {report.consistency_flag ? (
                      <XCircle className="w-6 h-6 text-destructive mx-auto" />
                    ) : (
                      <CheckCircle className="w-6 h-6 text-success mx-auto" />
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">Consistent Responses</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold">{formatDuration(interview?.duration_seconds ?? null)}</p>
                  <p className="text-xs text-muted-foreground">Duration</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* HR Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="w-5 h-5 text-primary" />
                HR Notification Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  {report.passed_to_hr ? (
                    <div className="flex items-center gap-2 text-success">
                      <CheckCircle className="w-5 h-5" />
                      <div>
                        <p className="font-medium">Passed to HR Team</p>
                        <p className="text-sm text-muted-foreground">
                          {report.hr_notified_at
                            ? `Notified on ${new Date(report.hr_notified_at).toLocaleDateString()}`
                            : "Awaiting notification"}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="w-5 h-5" />
                      <div>
                        <p className="font-medium">Under Review</p>
                        <p className="text-sm">Your interview is being reviewed</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-center gap-4">
            <Button variant="outline" onClick={() => navigate("/")}>
              Return Home
            </Button>
            <Button onClick={() => navigate("/interview")}>
              Start New Interview
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default InterviewReportPage;

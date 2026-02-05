 import { useState, useEffect } from "react";
 import { useNavigate } from "react-router-dom";
 import { 
   Search, 
   Filter, 
   ChevronDown, 
   Eye, 
   CheckCircle, 
   XCircle, 
   Clock,
   Users,
   TrendingUp,
   AlertTriangle,
   ArrowLeft
 } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Badge } from "@/components/ui/badge";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from "@/components/ui/select";
 import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
 } from "@/components/ui/table";
 import { supabase } from "@/integrations/supabase/client";
 import { cn } from "@/lib/utils";
 
 interface InterviewWithReport {
   id: string;
   interview_type: string;
   status: string;
   started_at: string | null;
   completed_at: string | null;
   duration_seconds: number | null;
   resume_analysis: any;
   behavior_flags: any;
   report?: {
     overall_score: number | null;
     recommendation: string | null;
     passed_to_hr: boolean | null;
     engagement_level: string | null;
     consistency_flag: boolean | null;
     gaze_deviation_count: number | null;
   };
 }
 
 const HRDashboard = () => {
   const navigate = useNavigate();
   const [interviews, setInterviews] = useState<InterviewWithReport[]>([]);
   const [loading, setLoading] = useState(true);
   const [searchTerm, setSearchTerm] = useState("");
   const [statusFilter, setStatusFilter] = useState<string>("all");
   const [scoreFilter, setScoreFilter] = useState<string>("all");
 
   useEffect(() => {
     fetchInterviews();
   }, []);
 
   const fetchInterviews = async () => {
     try {
       // Fetch all completed interviews with their reports
       const { data: interviewsData, error: interviewsError } = await supabase
         .from("interviews")
         .select("*")
         .order("completed_at", { ascending: false });
 
       if (interviewsError) throw interviewsError;
 
       // Fetch all reports
       const { data: reportsData, error: reportsError } = await supabase
         .from("interview_reports")
         .select("*");
 
       if (reportsError) throw reportsError;
 
       // Combine interviews with their reports
       const combined = (interviewsData || []).map((interview) => {
         const report = reportsData?.find((r) => r.interview_id === interview.id);
         return {
           ...interview,
           report: report
             ? {
                 overall_score: report.overall_score,
                 recommendation: report.recommendation,
                 passed_to_hr: report.passed_to_hr,
                 engagement_level: report.engagement_level,
                 consistency_flag: report.consistency_flag,
                 gaze_deviation_count: report.gaze_deviation_count,
               }
             : undefined,
         };
       });
 
       setInterviews(combined);
     } catch (error) {
       console.error("Error fetching interviews:", error);
     } finally {
       setLoading(false);
     }
   };
 
   // Filter interviews
   const filteredInterviews = interviews.filter((interview) => {
     const candidateName = interview.resume_analysis?.name || "";
     const matchesSearch = candidateName.toLowerCase().includes(searchTerm.toLowerCase());
     
     const matchesStatus =
       statusFilter === "all" ||
       (statusFilter === "passed" && interview.report?.passed_to_hr) ||
       (statusFilter === "review" && interview.report && !interview.report.passed_to_hr) ||
       (statusFilter === "pending" && !interview.report);
 
     const score = interview.report?.overall_score || 0;
     const matchesScore =
       scoreFilter === "all" ||
       (scoreFilter === "high" && score >= 80) ||
       (scoreFilter === "medium" && score >= 60 && score < 80) ||
       (scoreFilter === "low" && score < 60);
 
     return matchesSearch && matchesStatus && matchesScore;
   });
 
   // Stats
   const stats = {
     total: interviews.length,
     passed: interviews.filter((i) => i.report?.passed_to_hr).length,
     review: interviews.filter((i) => i.report && !i.report.passed_to_hr).length,
     pending: interviews.filter((i) => !i.report).length,
     avgScore: Math.round(
       interviews.reduce((acc, i) => acc + (i.report?.overall_score || 0), 0) /
         (interviews.filter((i) => i.report).length || 1)
     ),
   };
 
   const getScoreBadge = (score: number | null | undefined) => {
     if (!score) return <Badge variant="secondary">N/A</Badge>;
     if (score >= 80) return <Badge className="bg-success text-success-foreground">{score}%</Badge>;
     if (score >= 60) return <Badge className="bg-warning text-warning-foreground">{score}%</Badge>;
     return <Badge variant="destructive">{score}%</Badge>;
   };
 
   const getStatusBadge = (interview: InterviewWithReport) => {
     if (!interview.report) {
       return (
         <Badge variant="secondary" className="gap-1">
           <Clock className="w-3 h-3" />
           Pending
         </Badge>
       );
     }
     if (interview.report.passed_to_hr) {
       return (
         <Badge className="bg-success text-success-foreground gap-1">
           <CheckCircle className="w-3 h-3" />
           Passed
         </Badge>
       );
     }
     return (
       <Badge variant="destructive" className="gap-1">
         <XCircle className="w-3 h-3" />
         Review
       </Badge>
     );
   };
 
   const formatDuration = (seconds: number | null) => {
     if (!seconds) return "N/A";
     const mins = Math.floor(seconds / 60);
     const secs = seconds % 60;
     return `${mins}m ${secs}s`;
   };
 
   return (
     <div className="min-h-screen bg-background">
       {/* Header */}
       <header className="border-b border-border bg-card/80 backdrop-blur-sm px-4 py-4">
         <div className="container flex items-center justify-between">
           <div className="flex items-center gap-4">
             <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
               <ArrowLeft className="w-5 h-5" />
             </Button>
             <div>
               <h1 className="text-2xl font-display font-bold">HR Dashboard</h1>
               <p className="text-sm text-muted-foreground">
                 Review and manage candidate interviews
               </p>
             </div>
           </div>
         </div>
       </header>
 
       <div className="container py-8 space-y-8">
         {/* Stats Cards */}
         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           <Card>
             <CardHeader className="pb-2">
               <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                 <Users className="w-4 h-4" />
                 Total Interviews
               </CardTitle>
             </CardHeader>
             <CardContent>
               <p className="text-3xl font-bold">{stats.total}</p>
             </CardContent>
           </Card>
           <Card>
             <CardHeader className="pb-2">
               <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                 <CheckCircle className="w-4 h-4 text-success" />
                 Passed to HR
               </CardTitle>
             </CardHeader>
             <CardContent>
               <p className="text-3xl font-bold text-success">{stats.passed}</p>
             </CardContent>
           </Card>
           <Card>
             <CardHeader className="pb-2">
               <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                 <AlertTriangle className="w-4 h-4 text-warning" />
                 Needs Review
               </CardTitle>
             </CardHeader>
             <CardContent>
               <p className="text-3xl font-bold text-warning">{stats.review}</p>
             </CardContent>
           </Card>
           <Card>
             <CardHeader className="pb-2">
               <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                 <TrendingUp className="w-4 h-4" />
                 Avg. Score
               </CardTitle>
             </CardHeader>
             <CardContent>
               <p className="text-3xl font-bold">{stats.avgScore}%</p>
             </CardContent>
           </Card>
         </div>
 
         {/* Filters */}
         <div className="flex flex-col sm:flex-row gap-4">
           <div className="relative flex-1">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
             <Input
               placeholder="Search by candidate name..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="pl-10"
             />
           </div>
           <Select value={statusFilter} onValueChange={setStatusFilter}>
             <SelectTrigger className="w-[180px]">
               <Filter className="w-4 h-4 mr-2" />
               <SelectValue placeholder="Status" />
             </SelectTrigger>
             <SelectContent>
               <SelectItem value="all">All Status</SelectItem>
               <SelectItem value="passed">Passed</SelectItem>
               <SelectItem value="review">Needs Review</SelectItem>
               <SelectItem value="pending">Pending</SelectItem>
             </SelectContent>
           </Select>
           <Select value={scoreFilter} onValueChange={setScoreFilter}>
             <SelectTrigger className="w-[180px]">
               <TrendingUp className="w-4 h-4 mr-2" />
               <SelectValue placeholder="Score" />
             </SelectTrigger>
             <SelectContent>
               <SelectItem value="all">All Scores</SelectItem>
               <SelectItem value="high">High (80%+)</SelectItem>
               <SelectItem value="medium">Medium (60-79%)</SelectItem>
               <SelectItem value="low">Low (&lt;60%)</SelectItem>
             </SelectContent>
           </Select>
         </div>
 
         {/* Table */}
         <Card>
           <CardContent className="p-0">
             <Table>
               <TableHeader>
                 <TableRow>
                   <TableHead>Candidate</TableHead>
                   <TableHead>Status</TableHead>
                   <TableHead>Score</TableHead>
                   <TableHead>Engagement</TableHead>
                   <TableHead>Flags</TableHead>
                   <TableHead>Duration</TableHead>
                   <TableHead>Date</TableHead>
                   <TableHead className="text-right">Actions</TableHead>
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {loading ? (
                   <TableRow>
                     <TableCell colSpan={8} className="text-center py-8">
                       Loading interviews...
                     </TableCell>
                   </TableRow>
                 ) : filteredInterviews.length === 0 ? (
                   <TableRow>
                     <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                       No interviews found
                     </TableCell>
                   </TableRow>
                 ) : (
                   filteredInterviews.map((interview) => (
                     <TableRow key={interview.id}>
                       <TableCell>
                         <div>
                           <p className="font-medium">
                             {interview.resume_analysis?.name || "Unknown"}
                           </p>
                           <p className="text-xs text-muted-foreground">
                             {interview.resume_analysis?.skills?.slice(0, 3).join(", ") || "N/A"}
                           </p>
                         </div>
                       </TableCell>
                       <TableCell>{getStatusBadge(interview)}</TableCell>
                       <TableCell>{getScoreBadge(interview.report?.overall_score)}</TableCell>
                       <TableCell>
                         <Badge variant="outline">
                           {interview.report?.engagement_level || "N/A"}
                         </Badge>
                       </TableCell>
                       <TableCell>
                         <div className="flex items-center gap-2">
                           {interview.report?.consistency_flag && (
                             <Badge variant="destructive" className="text-xs">
                               Inconsistent
                             </Badge>
                           )}
                           {(interview.report?.gaze_deviation_count || 0) > 5 && (
                             <Badge variant="outline" className="text-xs text-warning">
                               {interview.report?.gaze_deviation_count} gaze events
                             </Badge>
                           )}
                           {(interview.behavior_flags?.tabSwitchCount || 0) > 3 && (
                             <Badge variant="outline" className="text-xs text-warning">
                               {interview.behavior_flags?.tabSwitchCount} tab switches
                             </Badge>
                           )}
                           {!interview.report?.consistency_flag &&
                             (interview.report?.gaze_deviation_count || 0) <= 5 &&
                             (interview.behavior_flags?.tabSwitchCount || 0) <= 3 && (
                               <span className="text-xs text-muted-foreground">None</span>
                             )}
                         </div>
                       </TableCell>
                       <TableCell>{formatDuration(interview.duration_seconds)}</TableCell>
                       <TableCell>
                         <span className="text-xs text-muted-foreground">
                           {interview.completed_at
                             ? new Date(interview.completed_at).toLocaleDateString()
                             : "In progress"}
                         </span>
                       </TableCell>
                       <TableCell className="text-right">
                         <Button
                           variant="ghost"
                           size="sm"
                           onClick={() => navigate(`/interview/report/${interview.id}`)}
                           disabled={!interview.report}
                         >
                           <Eye className="w-4 h-4 mr-1" />
                           View
                         </Button>
                       </TableCell>
                     </TableRow>
                   ))
                 )}
               </TableBody>
             </Table>
           </CardContent>
         </Card>
       </div>
     </div>
   );
 };
 
 export default HRDashboard;
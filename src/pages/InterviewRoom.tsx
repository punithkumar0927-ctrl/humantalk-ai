import { useState, useEffect } from "react";
import { Video, Mic, MicOff, VideoOff, Send, RotateCcw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import ResumeUpload, { ResumeAnalysis } from "@/components/interview/ResumeUpload";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";

type InterviewStage = "upload" | "interview" | "complete";

interface Message {
  id: string;
  role: "interviewer" | "candidate";
  content: string;
  timestamp: Date;
}

const SAMPLE_QUESTIONS = [
  "Tell me about yourself and your background.",
  "What interests you about this position?",
  "Describe a challenging project you've worked on.",
  "How do you handle tight deadlines and pressure?",
  "Where do you see yourself in 5 years?",
  "Do you have any questions for me?",
];

const InterviewRoom = () => {
  const [stage, setStage] = useState<InterviewStage>("upload");
  const [resumeAnalysis, setResumeAnalysis] = useState<ResumeAnalysis | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [candidateResponse, setCandidateResponse] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isInterviewerTyping, setIsInterviewerTyping] = useState(false);

  const {
    transcript,
    isListening,
    startListening,
    stopListening,
    resetTranscript,
    isSupported,
    error: speechError,
  } = useSpeechRecognition();

  // Update candidate response with speech transcript
  useEffect(() => {
    if (transcript.trim()) {
      setCandidateResponse(transcript.trim());
    }
  }, [transcript]);

  const handleResumeAnalyzed = (analysis: ResumeAnalysis) => {
    setResumeAnalysis(analysis);
    setStage("interview");
    
    // Add initial greeting from interviewer
    setTimeout(() => {
      const greeting: Message = {
        id: Date.now().toString(),
        role: "interviewer",
        content: `Hello ${analysis.name}! I'm Alex, your interviewer today. I've reviewed your resume and I'm excited to learn more about your experience with ${analysis.skills.slice(0, 3).join(", ")}. Let's get started!`,
        timestamp: new Date(),
      };
      setMessages([greeting]);
      
      // Ask first question after greeting
      setTimeout(() => {
        askNextQuestion();
      }, 2000);
    }, 1000);
  };

  const askNextQuestion = () => {
    if (currentQuestionIndex >= SAMPLE_QUESTIONS.length) {
      endInterview();
      return;
    }

    setIsInterviewerTyping(true);
    
    setTimeout(() => {
      const question: Message = {
        id: Date.now().toString(),
        role: "interviewer",
        content: SAMPLE_QUESTIONS[currentQuestionIndex],
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, question]);
      setCurrentQuestionIndex((prev) => prev + 1);
      setIsInterviewerTyping(false);
    }, 1500);
  };

  const handleSubmitResponse = () => {
    if (!candidateResponse.trim()) {
      toast.error("Please provide a response before continuing.");
      return;
    }

    // Stop listening if active
    if (isListening) {
      stopListening();
    }

    // Add candidate's response
    const response: Message = {
      id: Date.now().toString(),
      role: "candidate",
      content: candidateResponse,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, response]);
    setCandidateResponse("");
    resetTranscript();

    // Check if interview is complete
    if (currentQuestionIndex >= SAMPLE_QUESTIONS.length) {
      endInterview();
    } else {
      // Ask next question
      askNextQuestion();
    }
  };

  const endInterview = () => {
    setIsProcessing(true);
    
    setTimeout(() => {
      const closingMessage: Message = {
        id: Date.now().toString(),
        role: "interviewer",
        content: "Thank you for your time today! Your responses have been recorded and will be reviewed by our HR team. You'll receive feedback within 48 hours. Best of luck!",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, closingMessage]);
      setIsProcessing(false);
      setStage("complete");
      toast.success("Interview completed! Your report is being generated.");
    }, 2000);
  };

  const toggleMic = () => {
    if (isMicOn) {
      stopListening();
    } else {
      startListening();
    }
    setIsMicOn(!isMicOn);
  };

  const handleRestartVoice = () => {
    resetTranscript();
    setCandidateResponse("");
    startListening();
    toast.success("Voice input restarted!");
  };

  // Render upload stage
  if (stage === "upload") {
    return (
      <div className="min-h-screen bg-gradient-soft flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-8">
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Start Your <span className="text-gradient-hero">Interview</span>
            </h1>
            <p className="text-muted-foreground text-lg">
              Upload your resume to begin. Our AI will analyze it to personalize your interview.
            </p>
          </div>
          <ResumeUpload onResumeAnalyzed={handleResumeAnalyzed} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm px-4 py-3">
        <div className="container flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-sm font-medium">
              {stage === "complete" ? "Interview Complete" : "Interview in Progress"}
            </span>
          </div>
          <div className="text-sm text-muted-foreground">
            Question {Math.min(currentQuestionIndex, SAMPLE_QUESTIONS.length)} of {SAMPLE_QUESTIONS.length}
          </div>
        </div>
      </header>

      <div className="flex-1 container py-6">
        <div className="grid lg:grid-cols-3 gap-6 h-full">
          {/* Video area */}
          <div className="lg:col-span-2 space-y-4">
            {/* Interviewer video */}
            <div className="aspect-video bg-muted rounded-2xl relative overflow-hidden shadow-medium">
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                <div className="text-center">
                  <div className="w-24 h-24 rounded-full bg-gradient-hero flex items-center justify-center mx-auto mb-4 shadow-glow">
                    <span className="text-3xl font-display font-bold text-primary-foreground">AR</span>
                  </div>
                  <h3 className="font-display text-xl font-semibold">Alex Rivera</h3>
                  <p className="text-sm text-muted-foreground">Senior Interviewer</p>
                  
                  {isInterviewerTyping && (
                    <div className="mt-4 flex items-center justify-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-primary animate-typing" />
                      <span className="w-2 h-2 rounded-full bg-primary animate-typing" style={{ animationDelay: "0.2s" }} />
                      <span className="w-2 h-2 rounded-full bg-primary animate-typing" style={{ animationDelay: "0.4s" }} />
                      <span className="text-xs text-muted-foreground ml-2">Alex is thinking...</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Candidate video (small overlay) */}
              <div className="absolute bottom-4 right-4 w-32 h-24 rounded-lg bg-card/80 border border-border shadow-soft flex items-center justify-center">
                <div className="text-center">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center mx-auto">
                    <span className="text-xs font-semibold">You</span>
                  </div>
                  {isListening && (
                    <span className="text-[10px] text-success mt-1 block">Listening...</span>
                  )}
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-3">
              <Button
                variant={isMicOn ? "secondary" : "destructive"}
                size="lg"
                className="rounded-full w-14 h-14"
                onClick={toggleMic}
              >
                {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </Button>
              <Button
                variant={isVideoOn ? "secondary" : "destructive"}
                size="lg"
                className="rounded-full w-14 h-14"
                onClick={() => setIsVideoOn(!isVideoOn)}
              >
                {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </Button>
            </div>
          </div>

          {/* Chat/Response area */}
          <div className="flex flex-col bg-card rounded-2xl border border-border shadow-soft overflow-hidden">
            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 max-h-[400px]">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "p-3 rounded-xl max-w-[90%]",
                    msg.role === "interviewer"
                      ? "bg-primary/10 mr-auto"
                      : "bg-secondary/20 ml-auto"
                  )}
                >
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    {msg.role === "interviewer" ? "Alex Rivera" : "You"}
                  </p>
                  <p className="text-sm">{msg.content}</p>
                </div>
              ))}
              
              {isProcessing && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Generating report...</span>
                </div>
              )}
            </div>

            {/* Response input */}
            {stage === "interview" && (
              <div className="p-4 border-t border-border">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {isListening ? (
                        <span className="text-success flex items-center gap-1">
                          <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
                          Listening...
                        </span>
                      ) : (
                        "Type or speak your response"
                      )}
                    </span>
                    {!isSupported && (
                      <span className="text-xs text-destructive">
                        Voice not supported
                      </span>
                    )}
                  </div>
                  
                  <Textarea
                    value={candidateResponse}
                    onChange={(e) => setCandidateResponse(e.target.value)}
                    placeholder="Your response will appear here..."
                    className="min-h-[100px] resize-none"
                  />
                  
                  <div className="flex items-center gap-2">
                    {isSupported && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRestartVoice}
                        className="gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Restart Voice
                      </Button>
                    )}
                    <Button
                      onClick={handleSubmitResponse}
                      disabled={!candidateResponse.trim() || isProcessing}
                      className="ml-auto gap-2"
                    >
                      <Send className="w-4 h-4" />
                      Submit
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {stage === "complete" && (
              <div className="p-4 border-t border-border text-center">
                <p className="text-sm text-muted-foreground mb-3">
                  Your interview has been recorded and submitted.
                </p>
                <Button onClick={() => window.location.href = "/"}>
                  Return Home
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewRoom;

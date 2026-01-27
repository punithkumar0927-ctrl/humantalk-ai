import { useState, useEffect } from "react";
import { Video, Mic, MicOff, VideoOff, MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";

const InterviewPreview = () => {
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTyping(true);
      setTimeout(() => setIsTyping(false), 2000);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="py-24 bg-gradient-soft">
      <div className="container px-4">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Experience a <span className="text-gradient-hero">real</span> conversation
          </h2>
          <p className="text-muted-foreground text-lg">
            Our interview room feels like sitting across from a senior colleague
          </p>
        </div>

        {/* Mock Video Call UI */}
        <div className="max-w-4xl mx-auto">
          <div className="relative rounded-2xl overflow-hidden shadow-elevated bg-card border border-border">
            {/* Video area */}
            <div className="aspect-video bg-gradient-to-br from-muted to-muted/50 relative">
              {/* Interviewer video (main) */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  {/* Avatar */}
                  <div className="w-24 h-24 rounded-full bg-gradient-hero flex items-center justify-center mx-auto mb-4 shadow-glow">
                    <span className="text-3xl font-display font-bold text-primary-foreground">AR</span>
                  </div>
                  <h3 className="font-display text-xl font-semibold text-foreground">Alex Rivera</h3>
                  <p className="text-sm text-muted-foreground">Senior Tech Lead</p>
                  
                  {/* Typing indicator */}
                  <div className={cn(
                    "mt-4 flex items-center justify-center gap-1 transition-opacity duration-300",
                    isTyping ? "opacity-100" : "opacity-0"
                  )}>
                    <span className="w-2 h-2 rounded-full bg-primary animate-typing" />
                    <span className="w-2 h-2 rounded-full bg-primary animate-typing" style={{ animationDelay: "0.2s" }} />
                    <span className="w-2 h-2 rounded-full bg-primary animate-typing" style={{ animationDelay: "0.4s" }} />
                    <span className="text-xs text-muted-foreground ml-2">Alex is thinking...</span>
                  </div>
                </div>
              </div>

              {/* Candidate video (small overlay) */}
              <div className="absolute bottom-4 right-4 w-40 h-28 rounded-lg bg-muted/80 border border-border shadow-medium flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                  <span className="text-sm font-semibold text-secondary-foreground">You</span>
                </div>
              </div>

              {/* Top bar */}
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-card/80 backdrop-blur-sm border border-border">
                  <span className="w-2 h-2 rounded-full bg-success animate-pulse-soft" />
                  <span className="text-xs font-medium text-foreground">Interview in progress</span>
                </div>
                <button className="p-2 rounded-full bg-card/80 backdrop-blur-sm border border-border hover:bg-accent transition-colors">
                  <MoreVertical className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Controls bar */}
            <div className="px-6 py-4 bg-card border-t border-border flex items-center justify-center gap-3">
              <button className="p-3 rounded-full bg-muted hover:bg-accent transition-colors">
                <Mic className="w-5 h-5 text-foreground" />
              </button>
              <button className="p-3 rounded-full bg-muted hover:bg-accent transition-colors">
                <Video className="w-5 h-5 text-foreground" />
              </button>
              <button className="px-6 py-3 rounded-full bg-destructive hover:bg-destructive/90 text-destructive-foreground font-medium transition-colors">
                End Interview
              </button>
            </div>
          </div>

          {/* Sample question bubble */}
          <div className="mt-8 max-w-2xl mx-auto">
            <div className="p-5 rounded-2xl bg-card border border-border shadow-soft">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-hero flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-primary-foreground">AR</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">Alex Rivera</p>
                  <p className="text-muted-foreground">
                    "That's a really interesting approach to the scaling problem. Tell me more about how you'd handle the data consistency challenges in a distributed system like this..."
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default InterviewPreview;

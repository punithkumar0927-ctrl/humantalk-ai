import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, Video, Brain, Eye, FileText, ChevronRight, ChevronLeft, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface DemoVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const demoSteps = [
  {
    id: 1,
    title: "Upload Your Resume",
    description: "Start by uploading your resume in PDF, Word, or image format. Our AI analyzes your skills, experience, and background to personalize your interview.",
    icon: Upload,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    id: 2,
    title: "Face-to-Face Interview",
    description: "Join a live video interview with our AI interviewer. It feels just like talking to a real person - natural conversation with voice and video.",
    icon: Video,
    color: "text-success",
    bgColor: "bg-success/10",
  },
  {
    id: 3,
    title: "Adaptive Questions",
    description: "Questions are dynamically generated based on your resume and your previous answers. Each interview is unique and tailored to you.",
    icon: Brain,
    color: "text-secondary",
    bgColor: "bg-secondary/10",
  },
  {
    id: 4,
    title: "Behavioral Monitoring",
    description: "Our system monitors engagement and attention patterns to ensure interview integrity. This helps maintain a fair evaluation for all candidates.",
    icon: Eye,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
  },
  {
    id: 5,
    title: "Performance Report",
    description: "After the interview, a comprehensive report is generated with scores, feedback, and recommendations. Qualified candidates are forwarded to HR.",
    icon: FileText,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
];

const DemoVideoModal = ({ isOpen, onClose }: DemoVideoModalProps) => {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < demoSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = () => {
    setCurrentStep(0);
    onClose();
  };

  const step = demoSteps[currentStep];
  const Icon = step.icon;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">How HumanTalk AI Works</DialogTitle>
        </DialogHeader>

        <div className="py-6">
          {/* Progress indicator */}
          <div className="flex justify-center gap-2 mb-8">
            {demoSteps.map((s, index) => (
              <button
                key={s.id}
                onClick={() => setCurrentStep(index)}
                className={cn(
                  "w-3 h-3 rounded-full transition-all duration-300",
                  index === currentStep
                    ? "bg-primary w-8"
                    : index < currentStep
                    ? "bg-primary/60"
                    : "bg-muted"
                )}
              />
            ))}
          </div>

          {/* Step content */}
          <div className="text-center animate-fade-in" key={currentStep}>
            <div className={cn("w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6", step.bgColor)}>
              <Icon className={cn("w-10 h-10", step.color)} />
            </div>

            <h3 className="font-display text-xl font-semibold mb-3">
              Step {step.id}: {step.title}
            </h3>

            <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
              {step.description}
            </p>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8">
            <Button
              variant="ghost"
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>

            <span className="text-sm text-muted-foreground">
              {currentStep + 1} of {demoSteps.length}
            </span>

            {currentStep < demoSteps.length - 1 ? (
              <Button onClick={handleNext} className="gap-2">
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button onClick={handleClose} className="gap-2">
                <Check className="w-4 h-4" />
                Got it!
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DemoVideoModal;

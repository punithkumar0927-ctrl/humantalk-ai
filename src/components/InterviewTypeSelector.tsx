import { useState } from "react";
import { Code, Brain, Cpu, Network } from "lucide-react";
import { cn } from "@/lib/utils";

const interviewTypes = [
  {
    id: "technical",
    name: "Technical",
    description: "Coding & problem-solving",
    icon: Code,
  },
  {
    id: "behavioral",
    name: "Behavioral",
    description: "Communication & leadership",
    icon: Brain,
  },
  {
    id: "aiml",
    name: "AI/ML",
    description: "Machine learning concepts",
    icon: Cpu,
  },
  {
    id: "system-design",
    name: "System Design",
    description: "Architecture & scalability",
    icon: Network,
  },
];

const InterviewTypeSelector = () => {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="w-full max-w-3xl mx-auto">
      <p className="text-sm font-medium text-muted-foreground mb-4">
        Ready? Pick your focus:
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {interviewTypes.map((type) => {
          const Icon = type.icon;
          const isSelected = selected === type.id;

          return (
            <button
              key={type.id}
              onClick={() => setSelected(type.id)}
              className={cn(
                "group relative flex flex-col items-center p-5 rounded-xl border-2 transition-all duration-300",
                "bg-card hover:bg-accent/50",
                isSelected
                  ? "border-primary shadow-glow bg-primary/5"
                  : "border-border hover:border-primary/50 shadow-soft hover:shadow-medium"
              )}
            >
              <div
                className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-all duration-300",
                  isSelected
                    ? "bg-gradient-hero text-primary-foreground"
                    : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                )}
              >
                <Icon className="w-6 h-6" />
              </div>
              <span
                className={cn(
                  "font-semibold text-sm transition-colors",
                  isSelected ? "text-primary" : "text-foreground"
                )}
              >
                {type.name}
              </span>
              <span className="text-xs text-muted-foreground mt-1 text-center">
                {type.description}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default InterviewTypeSelector;

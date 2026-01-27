import { UserCheck, MessageCircle, FileCheck } from "lucide-react";

const steps = [
  {
    icon: UserCheck,
    step: "01",
    title: "Choose Your Interview",
    description:
      "Select from Technical, Behavioral, AI/ML, or System Design interviews. Each is tailored to evaluate the specific skills that matter.",
  },
  {
    icon: MessageCircle,
    step: "02",
    title: "Have a Conversation",
    description:
      "Engage in a natural dialogue with your interviewer. They'll ask follow-up questions, show genuine interest, and probe your thinking.",
  },
  {
    icon: FileCheck,
    step: "03",
    title: "Receive Insights",
    description:
      "Get a comprehensive report highlighting your strengths and areas for growth. No arbitrary scores—just actionable feedback.",
  },
];

const HowItWorks = () => {
  return (
    <section className="py-24 bg-gradient-soft">
      <div className="container px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            How it <span className="text-gradient-hero">works</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Three simple steps to a fairer interview experience
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="relative">
            {/* Connection line */}
            <div className="hidden md:block absolute top-24 left-[calc(16.67%-20px)] right-[calc(16.67%-20px)] h-0.5 bg-gradient-to-r from-primary/20 via-primary to-primary/20" />

            <div className="grid md:grid-cols-3 gap-8">
              {steps.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div key={item.step} className="relative text-center">
                    {/* Step number */}
                    <div className="relative z-10 w-20 h-20 rounded-2xl bg-gradient-hero flex items-center justify-center mx-auto mb-6 shadow-glow">
                      <Icon className="w-8 h-8 text-primary-foreground" />
                    </div>

                    {/* Step indicator */}
                    <span className="inline-block text-xs font-bold text-primary mb-2 tracking-wider">
                      STEP {item.step}
                    </span>

                    <h3 className="font-display text-xl font-semibold mb-3 text-foreground">
                      {item.title}
                    </h3>

                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;

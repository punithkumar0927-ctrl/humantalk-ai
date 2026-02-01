import { MessageSquare, Shield, FileText, Users } from "lucide-react";

const features = [
  {
    icon: MessageSquare,
    title: "Natural Conversations",
    description:
      "Our interviews feel like genuine discussions, not robotic Q&A sessions. Experience thoughtful pauses, empathetic responses, and adaptive questioning.",
  },
  {
    icon: Shield,
    title: "Fair & Unbiased",
    description:
      "Every candidate is evaluated on the same criteria. Our process focuses on potential and problem-solving, not background or credentials.",
  },
  {
    icon: FileText,
    title: "Insightful Reports",
    description:
      "Receive structured feedback highlighting strengths and growth areas. No scores—just actionable insights for meaningful development.",
  },
  {
    icon: Users,
    title: "Human Review",
    description:
      "Important decisions always include human oversight. Our system flags areas for review, ensuring fairness at every step.",
  },
];

const Features = () => {
  return (
    <section id="for-companies" className="py-24 bg-background">
      <div className="container px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Why candidates <span className="text-gradient-hero">love</span> our process
          </h2>
          <p className="text-muted-foreground text-lg">
            Built to uncover real potential, not rehearsed perfection
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="group p-6 rounded-2xl bg-gradient-card border border-border shadow-soft hover:shadow-medium transition-all duration-300 hover:-translate-y-1"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-gradient-hero group-hover:text-primary-foreground transition-all duration-300">
                  <Icon className="w-6 h-6 text-primary group-hover:text-primary-foreground transition-colors" />
                </div>
                <h3 className="font-display text-xl font-semibold mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Features;

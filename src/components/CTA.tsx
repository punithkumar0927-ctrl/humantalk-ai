import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

const CTA = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="relative p-12 rounded-3xl bg-gradient-card border border-border shadow-elevated overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-secondary/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 mb-6">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">
                  Start for free
                </span>
              </div>

              <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-foreground">
                Ready to experience a{" "}
                <span className="text-gradient-hero">better</span> interview?
              </h2>

              <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
                Join thousands of candidates who've discovered a fairer way to
                showcase their potential.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button variant="hero" size="xl" className="group">
                  Start Your Interview
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Button>
                <Button variant="heroOutline" size="lg">
                  Book Enterprise Demo
                </Button>
              </div>

              {/* Trust badges */}
              <div className="mt-10 pt-8 border-t border-border">
                <p className="text-sm text-muted-foreground mb-4">
                  Trusted by leading companies
                </p>
                <div className="flex items-center justify-center gap-8 opacity-60">
                  <span className="font-display text-xl font-semibold text-muted-foreground">TechCorp</span>
                  <span className="font-display text-xl font-semibold text-muted-foreground">Innovate.io</span>
                  <span className="font-display text-xl font-semibold text-muted-foreground">StartupXYZ</span>
                  <span className="font-display text-xl font-semibold text-muted-foreground">Enterprise+</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;

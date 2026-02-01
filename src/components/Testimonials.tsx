import { Star } from "lucide-react";

const testimonials = [
  {
    quote: "It felt like a real conversation, not an interrogation. I could actually showcase my thinking process instead of just reciting memorized answers.",
    author: "Sarah Chen",
    role: "Software Engineer",
    company: "Hired at Meta",
    avatar: "SC",
  },
  {
    quote: "As a fresher, I was nervous about competing with experienced candidates. This process focused on my problem-solving abilities, giving me a fair chance.",
    author: "Raj Patel",
    role: "Recent Graduate",
    company: "Hired at Stripe",
    avatar: "RP",
  },
  {
    quote: "The feedback report was incredibly helpful. Even though I didn't get the role, I understood exactly what to improve. That's rare in hiring processes.",
    author: "Maria Santos",
    role: "Product Manager",
    company: "Now at Airbnb",
    avatar: "MS",
  },
];

const Testimonials = () => {
  return (
    <section id="about" className="py-24 bg-background">
      <div className="container px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Candidates share their <span className="text-gradient-hero">experience</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Real feedback from people who've been through our interview process
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <div
              key={testimonial.author}
              className="group p-6 rounded-2xl bg-gradient-card border border-border shadow-soft hover:shadow-medium transition-all duration-300"
            >
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-4 h-4 fill-primary text-primary"
                  />
                ))}
              </div>

              {/* Quote */}
              <blockquote className="text-foreground mb-6 leading-relaxed">
                "{testimonial.quote}"
              </blockquote>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-hero flex items-center justify-center">
                  <span className="text-sm font-bold text-primary-foreground">
                    {testimonial.avatar}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-sm text-foreground">
                    {testimonial.author}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {testimonial.role} • {testimonial.company}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;

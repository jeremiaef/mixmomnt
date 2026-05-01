import { Shield, BarChart3, Target, Zap } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";

const features = [
  {
    icon: Shield,
    title: "AI Overspend Guard",
    description:
      "Built-in AI analyzes your spending patterns in real-time and alerts you before you overspend.",
  },
  {
    icon: BarChart3,
    title: "Smart Budget Tracking",
    description:
      "Automatically categorize transactions and visualize where your money goes with beautiful charts.",
  },
  {
    icon: Target,
    title: "Financial Goals",
    description:
      "Set savings targets and track progress with intelligent reminders that keep you on course.",
  },
  {
    icon: Zap,
    title: "Real-time Insights",
    description:
      "Get instant notifications and actionable insights to make smarter financial decisions every day.",
  },
];

export function Services() {
  return (
    <section id="product" className="bg-white py-20 sm:py-28">
      <Container>
        <SectionHeading
          title="Why meetstabl?"
          subtitle="A finance tracker designed to keep you in control — powered by AI that actually helps."
        />
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-2xl bg-slate-50 p-8 transition-all hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-6 text-lg font-semibold text-slate-900">
                {feature.title}
              </h3>
              <p className="mt-3 text-slate-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

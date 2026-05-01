import { Quote } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";

const testimonials = [
  {
    quote:
      "meetstabl helped me cut my unnecessary spending by 30% in the first month. The AI alerts are genuinely life-changing.",
    name: "Sarah",
    role: "Freelance Designer",
    initials: "SJ",
    color: "bg-emerald-500",
  },
  {
    quote:
      "Finally a finance app that doesn't just track — it actually prevents me from going over budget. Brilliant concept.",
    name: "Marcus",
    role: "Music Producer",
    initials: "MW",
    color: "bg-blue-500",
  },
  {
    quote:
      "As someone who struggles with overspending, meetstabl's AI guardrails have given me real control over my finances.",
    name: "Priya",
    role: "Sound Engineer",
    initials: "PK",
    color: "bg-amber-500",
  },
];

export function Testimonials() {
  return (
    <section id="testimonials" className="py-20 sm:py-28">
      <Container>
        <SectionHeading
          title="What People Say"
          subtitle="Early users share how meetstabl is helping them take control of their spending."
        />
        <div className="grid gap-8 md:grid-cols-3">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200"
            >
              <Quote className="h-8 w-8 text-indigo-600" />
              <p className="mt-4 text-slate-700 leading-relaxed">
                {t.quote}
              </p>
              <div className="mt-6 flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white ${t.color}`}
                >
                  {t.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {t.name}
                  </p>
                  <p className="text-sm text-slate-500">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

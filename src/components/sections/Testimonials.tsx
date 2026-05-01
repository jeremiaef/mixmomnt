import { Quote } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";

const testimonials = [
  {
    quote:
      "Alex transformed our online presence. The attention to detail and creativity exceeded all expectations. Highly recommended!",
    name: "Sarah",
    role: "Startup Founder",
    initials: "SJ",
    color: "bg-emerald-500",
  },
  {
    quote:
      "The attention to detail and speed of delivery was outstanding. Working with mixmomnt was a game changer for our product.",
    name: "Marcus",
    role: "Product Manager",
    initials: "MW",
    color: "bg-blue-500",
  },
  {
    quote:
      "mixmomnt delivered beyond expectations. Our new website has significantly improved user engagement and conversions.",
    name: "Priya",
    role: "Creative Director",
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
          subtitle="Kind words from clients and collaborators I've had the pleasure of working with."
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

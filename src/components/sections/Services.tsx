import { Code, Palette, Lightbulb, MessageSquare } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";

const services = [
  {
    icon: Code,
    title: "Web Development",
    description:
      "Building fast, responsive websites with modern technologies that perform and scale.",
  },
  {
    icon: Palette,
    title: "UI/UX Design",
    description:
      "Crafting intuitive interfaces that delight users and drive engagement.",
  },
  {
    icon: Lightbulb,
    title: "Brand Strategy",
    description:
      "Helping brands tell their story visually and connect with their audience.",
  },
  {
    icon: MessageSquare,
    title: "Consulting",
    description:
      "Technical guidance and creative direction for your next digital product.",
  },
];

export function Services() {
  return (
    <section id="services" className="bg-white py-20 sm:py-28">
      <Container>
        <SectionHeading
          title="What I Do"
          subtitle="A range of services to help you build, launch, and grow your digital presence."
        />
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((service) => (
            <div
              key={service.title}
              className="group rounded-2xl bg-slate-50 p-8 transition-all hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white">
                <service.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-6 text-lg font-semibold text-slate-900">
                {service.title}
              </h3>
              <p className="mt-3 text-slate-600">{service.description}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

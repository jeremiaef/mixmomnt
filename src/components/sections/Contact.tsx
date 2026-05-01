"use client";

import { useState } from "react";
import { Globe, Briefcase, MessageCircle, Mail, MapPin } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";

const socialLinks = [
  { icon: Globe, href: "https://github.com", label: "GitHub" },
  { icon: Briefcase, href: "https://linkedin.com", label: "LinkedIn" },
  { icon: MessageCircle, href: "https://twitter.com", label: "Twitter" },
];

export function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = encodeURIComponent(`Message from ${formData.name}`);
    const body = encodeURIComponent(
      `Name: ${formData.name}\nEmail: ${formData.email}\n\nMessage:\n${formData.message}`
    );
    window.location.href = `mailto:hello@mixmomnt.dev?subject=${subject}&body=${body}`;
  };

  return (
    <section id="contact" className="bg-white py-20 sm:py-28">
      <Container>
        <SectionHeading
          title="Get in Touch"
          subtitle="Have a project in mind or just want to say hello? I'd love to hear from you."
        />
        <div className="grid gap-12 lg:grid-cols-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-slate-700"
              >
                Name
              </label>
              <input
                type="text"
                id="name"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="mt-2 block w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-700"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                required
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="mt-2 block w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label
                htmlFor="message"
                className="block text-sm font-medium text-slate-700"
              >
                Message
              </label>
              <textarea
                id="message"
                rows={5}
                required
                value={formData.message}
                onChange={(e) =>
                  setFormData({ ...formData, message: e.target.value })
                }
                className="mt-2 block w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <Button type="submit">Send Message</Button>
          </form>

          <div className="flex flex-col justify-center space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                Contact Details
              </h3>
              <div className="mt-4 space-y-4">
                <div className="flex items-center gap-3 text-slate-600">
                  <Mail className="h-5 w-5 text-indigo-600" />
                  <a
                    href="mailto:hello@mixmomnt.dev"
                    className="hover:text-indigo-600"
                  >
                    hello@mixmomnt.dev
                  </a>
                </div>
                <div className="flex items-center gap-3 text-slate-600">
                  <MapPin className="h-5 w-5 text-indigo-600" />
                  <span>San Francisco, CA</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                Follow Along
              </h3>
              <div className="mt-4 flex gap-4">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-colors hover:bg-indigo-600 hover:text-white"
                    aria-label={social.label}
                  >
                    <social.icon className="h-5 w-5" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

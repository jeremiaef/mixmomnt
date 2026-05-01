"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Container } from "@/components/ui/Container";

const navLinks = [
  { label: "Home", href: "#hero" },
  { label: "Product", href: "#product" },
  { label: "Testimonials", href: "#testimonials" },
  { label: "Contact", href: "#contact" },
];

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md">
      <Container>
        <nav className="flex h-16 items-center justify-between">
          <a href="#hero" className="text-xl font-bold text-slate-900">
            mixmomnt
          </a>

          {/* Desktop nav */}
          <div className="hidden md:flex md:items-center md:gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-slate-600 hover:text-indigo-600"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? (
              <X className="h-6 w-6 text-slate-900" />
            ) : (
              <Menu className="h-6 w-6 text-slate-900" />
            )}
          </button>
        </nav>

        {/* Mobile nav */}
        {isOpen && (
          <div className="md:hidden">
            <div className="space-y-1 pb-4 pt-2">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="block rounded-md px-3 py-2 text-base font-medium text-slate-600 hover:bg-slate-50 hover:text-indigo-600"
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        )}
      </Container>
    </header>
  );
}

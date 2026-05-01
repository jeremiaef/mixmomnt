import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

export function Hero() {
  return (
    <section id="hero" className="py-20 sm:py-28">
      <Container>
        <div className="flex flex-col items-center gap-12 lg:flex-row lg:gap-16">
          <div className="flex-1 text-center lg:text-left">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Hi, I&apos;m Alex —{" "}
              <span className="text-indigo-600">Creator behind mixmomnt</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-slate-600">
              Crafting digital experiences that leave a lasting impression. I
              help brands and individuals build beautiful, functional, and
              memorable products on the web.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row lg:justify-start">
              <Button href="#services">View My Work</Button>
              <Button href="#contact" variant="secondary">
                Get in Touch
              </Button>
            </div>
          </div>
          <div className="flex-shrink-0">
            <div className="h-72 w-72 rounded-3xl bg-gradient-to-br from-indigo-400 to-purple-500 shadow-xl sm:h-80 sm:w-80 lg:h-96 lg:w-96" />
          </div>
        </div>
      </Container>
    </section>
  );
}

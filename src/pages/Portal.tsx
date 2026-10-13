import { ArrowRight, Music2, UtensilsCrossed } from "lucide-react";
import { Link } from "react-router-dom";

const options = [
  {
    title: "Cantina",
    description:
      "Mirá el menú, hacé tu pedido y encontrá todo lo de la cantina.",
    href: "/cantina",
    action: "Ir a la cantina",
    icon: UtensilsCrossed,
    accent: "bg-[#2E86C1]",
    iconBackground: "bg-[#2E86C1]/10 text-[#2E86C1]",
  },
  {
    title: "Alabanza",
    description:
      "Explorá canciones, prepará la lista y consultá acordes para alabar.",
    href: "/alabanza",
    action: "Ir a Alabanza",
    icon: Music2,
    accent: "bg-[#E5BE01]",
    iconBackground: "bg-[#E5BE01]/20 text-[#806800]",
  },
];

export default function Portal() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#F2F4F4] px-4 py-12">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 -top-40 h-96 w-96 rounded-full bg-[#2E86C1]/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 -right-32 h-96 w-96 rounded-full bg-[#E5BE01]/15 blur-3xl"
      />

      <div className="relative w-full max-w-4xl">
        <header className="mb-10 text-center">
          <img
            src="/icon-192.png"
            alt="Somos Familia"
            className="mx-auto mb-5 h-20 w-20 rounded-full bg-white object-cover shadow-lg"
          />
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-[#2E86C1]">
            La Gracia de Cristo
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            Grupo de Jóvenes
            <span className="mt-2 block text-[#2E86C1]">Somos Familia</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-slate-600 sm:text-lg">
            ¿A dónde vamos? Elegí una opción para continuar.
          </p>
        </header>

        <section
          aria-label="Elegí una sección"
          className="grid gap-5 sm:grid-cols-2"
        >
          {options.map((option) => {
            const Icon = option.icon;

            return (
              <Link
                key={option.title}
                to={option.href}
                className="group flex min-h-64 flex-col rounded-3xl border border-white bg-white/90 p-7 shadow-lg shadow-slate-900/5 transition duration-200 hover:-translate-y-1 hover:shadow-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2E86C1]/30 sm:p-9"
              >
                <div
                  className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl ${option.iconBackground}`}
                >
                  <Icon className="h-7 w-7" aria-hidden="true" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">
                  {option.title}
                </h2>
                <p className="mt-2 flex-1 leading-relaxed text-slate-600">
                  {option.description}
                </p>
                <span className="mt-7 inline-flex items-center gap-2 font-bold text-slate-800">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${option.accent}`}
                    aria-hidden="true"
                  />
                  {option.action}
                  <ArrowRight
                    className="h-4 w-4 transition-transform group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </span>
              </Link>
            );
          })}
        </section>

        <footer className="mt-10 text-center text-sm text-slate-500">
          Cantina y Alabanza, juntos como familia.
        </footer>
      </div>
    </main>
  );
}

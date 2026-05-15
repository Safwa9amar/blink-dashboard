import { BlinkLogoSvg } from "../blink-logo";
import { ThemeToggle, LangToggle } from "../landing-client";

export function PageShell({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="landing-page">
      <Nav />
      <header className="py-20 max-md:py-14" style={{ borderBottom: "1px solid var(--line)" }}>
        <div className="max-w-[1240px] mx-auto px-8">
          <h1 className="font-bold leading-tight" style={{ fontFamily: "Poppins, sans-serif", fontSize: "clamp(36px, 5vw, 64px)" }}>
            {title}
          </h1>
          {subtitle && (
            <p className="mt-4 text-lg max-w-[640px]" style={{ color: "var(--ink-2)" }}>{subtitle}</p>
          )}
        </div>
      </header>
      <main className="py-16 max-md:py-10">
        <div className="max-w-[1240px] mx-auto px-8">{children}</div>
      </main>
      <Footer />
    </div>
  );
}

function Nav() {
  return (
    <nav className="nav-glass sticky top-0 z-50 py-3.5">
      <div className="max-w-[1240px] mx-auto px-8 flex items-center gap-8">
        <a href="/" className="flex items-center gap-2.5 font-bold text-lg" style={{ fontFamily: "Poppins, sans-serif", letterSpacing: "-0.01em" }}>
          <span className="brand-mark"><BlinkLogoSvg /></span>
          Blink
        </a>
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          <LangToggle />
          <ThemeToggle />
          <a href="/#download" className="btn-brand inline-flex items-center gap-2 h-[38px] px-3.5 rounded-xl text-[13px] font-semibold">Get the app</a>
        </div>
      </div>
    </nav>
  );
}

function Footer() {
  return (
    <footer className="py-12 pb-8" style={{ borderTop: "1px solid var(--line)" }}>
      <div className="max-w-[1240px] mx-auto px-8">
        <div className="flex justify-between flex-wrap gap-4 text-xs" style={{ color: "var(--ink-3)" }}>
          <span>&copy; 2025 Blink, SARL. Algiers, Algeria.</span>
          <div className="flex gap-6">
            <a href="/terms" className="footer-link">Terms</a>
            <a href="/privacy" className="footer-link">Privacy</a>
            <a href="/support" className="footer-link">Support</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export function Section({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`mb-16 ${className}`}>{children}</section>;
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-[28px] font-bold mb-4" style={{ fontFamily: "Poppins" }}>{children}</h2>;
}

export function Paragraph({ children }: { children: React.ReactNode }) {
  return <p className="text-[16px] leading-relaxed max-w-[720px] mb-4" style={{ color: "var(--ink-2)" }}>{children}</p>;
}

export function FeatureGrid({ features }: { features: { title: string; desc: string }[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-8">
      {features.map((f, i) => (
        <div key={i} className="rounded-2xl p-6" style={{ background: "var(--surface)", border: "1px solid var(--line)" }}>
          <h3 className="text-lg font-semibold mb-2" style={{ fontFamily: "Poppins" }}>{f.title}</h3>
          <p className="text-sm" style={{ color: "var(--ink-2)" }}>{f.desc}</p>
        </div>
      ))}
    </div>
  );
}

export function CTA({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} className="btn-brand inline-flex items-center gap-2 h-11 px-[18px] rounded-xl text-sm font-semibold mt-6">
      {children}
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>
    </a>
  );
}

export function StatRow({ stats }: { stats: { value: string; label: string }[] }) {
  return (
    <div className="flex gap-10 flex-wrap mt-8 pt-8" style={{ borderTop: "1px solid var(--line)" }}>
      {stats.map((s, i) => (
        <div key={i}>
          <div className="text-[28px] font-bold" style={{ fontFamily: "Poppins", color: "var(--brand)" }}>{s.value}</div>
          <div className="text-sm mt-1" style={{ color: "var(--ink-3)" }}>{s.label}</div>
        </div>
      ))}
    </div>
  );
}

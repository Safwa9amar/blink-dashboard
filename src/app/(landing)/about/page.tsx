import { PageShell } from "../components/page-shell";
import { Section, SectionTitle, Paragraph, StatRow } from "../components/content";

export default function AboutPage() {
  return (
    <PageShell title="About Blink" subtitle="We're building the mobility platform Algeria deserves — local-first, multilingual, and designed for how people actually move.">
      <Section>
        <SectionTitle>Our story</SectionTitle>
        <Paragraph>Blink started with a simple observation: getting around Algerian cities shouldn&apos;t be this hard. Between unreliable transport, opaque pricing, and fragmented services, everyday mobility was broken.</Paragraph>
        <Paragraph>We built Blink to fix that. One app that handles rides, deliveries, and marketplace orders. Available in Arabic, French, and English. Accepts cash and cards. Designed by Algerians, for Algerians.</Paragraph>
        <Paragraph>Founded in Bab Ezzouar, Algiers, Blink now operates in 12 cities across Algeria with a team of 120+ and a community of 18,000+ drivers.</Paragraph>
      </Section>

      <Section>
        <SectionTitle>Our values</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
          {[
            { title: "Local first", desc: "We build for the Algerian context — cash payments, Arabic UI, local partnerships. Not a copy-paste from abroad." },
            { title: "Fair for everyone", desc: "Transparent pricing for riders, fair commissions for drivers. Everyone should benefit." },
            { title: "Safety always", desc: "Verified drivers, trip sharing, 24/7 monitoring. Safety isn't a feature — it's the foundation." },
            { title: "Move fast, stay humble", desc: "We ship weekly, listen to feedback daily, and never assume we know better than our users." },
          ].map((v, i) => (
            <div key={i} className="rounded-2xl p-6" style={{ background: "var(--surface)", border: "1px solid var(--line)" }}>
              <h3 className="text-lg font-semibold mb-2" style={{ fontFamily: "Poppins" }}>{v.title}</h3>
              <p className="text-sm" style={{ color: "var(--ink-2)" }}>{v.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      <StatRow stats={[
        { value: "12", label: "Cities" },
        { value: "120+", label: "Team members" },
        { value: "18,000+", label: "Drivers" },
        { value: "2.4M+", label: "Trips completed" },
      ]} />
    </PageShell>
  );
}

import { PageShell } from "../components/page-shell";
import { Section, SectionTitle, Paragraph, CTA } from "../components/content";

export default function CareersPage() {
  return (
    <PageShell title="Careers" subtitle="Join the team building the future of mobility in Algeria. We're hiring across engineering, operations, and more.">
      <Section>
        <SectionTitle>Why work at Blink</SectionTitle>
        <Paragraph>We&apos;re a fast-growing team solving real problems for millions of people. You&apos;ll ship code that matters, work with talented people, and see your impact every day on the streets of Algerian cities.</Paragraph>
        <Paragraph>We offer competitive salaries, flexible work arrangements, health coverage, and the chance to build something meaningful from the ground up.</Paragraph>
      </Section>

      <Section>
        <SectionTitle>Open positions</SectionTitle>
        <div className="flex flex-col gap-3 mt-6">
          {[
            { role: "Senior Backend Engineer", team: "Engineering", location: "Algiers / Remote" },
            { role: "Mobile Developer (React Native)", team: "Engineering", location: "Algiers / Remote" },
            { role: "Product Designer", team: "Design", location: "Algiers" },
            { role: "City Operations Manager", team: "Operations", location: "Oran" },
            { role: "Customer Support Lead", team: "Support", location: "Algiers" },
            { role: "Marketing Manager", team: "Growth", location: "Algiers" },
            { role: "Data Analyst", team: "Analytics", location: "Algiers / Remote" },
            { role: "Driver Operations Specialist", team: "Operations", location: "Constantine" },
          ].map((j, i) => (
            <a key={i} href="#" className="flex items-center justify-between p-5 rounded-2xl transition-colors hover:border-[var(--brand)]" style={{ background: "var(--surface)", border: "1px solid var(--line)" }}>
              <div>
                <div className="font-semibold" style={{ fontFamily: "Poppins" }}>{j.role}</div>
                <div className="text-sm mt-1" style={{ color: "var(--ink-3)" }}>{j.team} · {j.location}</div>
              </div>
              <svg className="w-5 h-5" style={{ color: "var(--ink-3)" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>
            </a>
          ))}
        </div>
      </Section>

      <CTA href="mailto:careers@blink.com">Apply now</CTA>
    </PageShell>
  );
}

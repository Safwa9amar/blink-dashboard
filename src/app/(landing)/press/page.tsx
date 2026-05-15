import { PageShell } from "../components/page-shell";
import { Section, SectionTitle, Paragraph } from "../components/content";

export default function PressPage() {
  return (
    <PageShell title="Press" subtitle="News, media resources, and press inquiries for Blink.">
      <Section>
        <SectionTitle>In the news</SectionTitle>
        <div className="flex flex-col gap-4 mt-6">
          {[
            { date: "April 2025", title: "Blink expands to 12 cities across Algeria", source: "El Watan" },
            { date: "March 2025", title: "Blink Marketplace launches with 500+ partner stores", source: "Liberté" },
            { date: "January 2025", title: "Blink raises Series A to accelerate Algerian expansion", source: "TechCrunch MENA" },
            { date: "November 2024", title: "How Blink is reinventing urban mobility in Algeria", source: "Jeune Afrique" },
            { date: "September 2024", title: "Blink driver community surpasses 10,000 members", source: "Echorouk" },
          ].map((n, i) => (
            <div key={i} className="p-5 rounded-2xl" style={{ background: "var(--surface)", border: "1px solid var(--line)" }}>
              <div className="text-xs font-semibold" style={{ color: "var(--brand)" }}>{n.date}</div>
              <div className="text-lg font-semibold mt-1" style={{ fontFamily: "Poppins" }}>{n.title}</div>
              <div className="text-sm mt-1" style={{ color: "var(--ink-3)" }}>{n.source}</div>
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <SectionTitle>Media inquiries</SectionTitle>
        <Paragraph>For press inquiries, interviews, or media resources, please contact our communications team at press@blink.com. We typically respond within 24 hours.</Paragraph>
        <Paragraph>Brand assets, logos, and executive photos are available in our press kit.</Paragraph>
      </Section>
    </PageShell>
  );
}

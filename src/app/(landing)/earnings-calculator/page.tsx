import { PageShell } from "../components/page-shell";
import { Section, SectionTitle, Paragraph, CTA } from "../components/content";

export default function EarningsCalculatorPage() {
  return (
    <PageShell title="Earnings Calculator" subtitle="See how much you could earn driving with Blink based on your city and hours.">
      <Section>
        <SectionTitle>Estimate your weekly earnings</SectionTitle>
        <Paragraph>Earnings depend on your city, the hours you drive, and demand patterns. Below are average weekly earnings for Blink drivers across Algeria.</Paragraph>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-8">
          {[
            { city: "Algiers", hours: "40 hrs/week", earn: "28,000 - 35,000 DZD" },
            { city: "Oran", hours: "40 hrs/week", earn: "24,000 - 30,000 DZD" },
            { city: "Constantine", hours: "40 hrs/week", earn: "22,000 - 28,000 DZD" },
            { city: "Annaba", hours: "30 hrs/week", earn: "16,000 - 22,000 DZD" },
            { city: "Sétif", hours: "30 hrs/week", earn: "15,000 - 20,000 DZD" },
            { city: "Blida", hours: "30 hrs/week", earn: "14,000 - 19,000 DZD" },
          ].map((r, i) => (
            <div key={i} className="rounded-2xl p-6" style={{ background: "var(--surface)", border: "1px solid var(--line)" }}>
              <div className="text-sm font-semibold" style={{ color: "var(--brand)" }}>{r.city}</div>
              <div className="text-2xl font-bold mt-2" style={{ fontFamily: "Poppins" }}>{r.earn}</div>
              <div className="text-xs mt-1" style={{ color: "var(--ink-3)" }}>{r.hours}</div>
            </div>
          ))}
        </div>

        <Paragraph>These are estimates based on historical data. Actual earnings may vary based on demand, time of day, and trip acceptance rate. Peak hours (7-9 AM, 5-8 PM) and weekends typically yield higher earnings.</Paragraph>
      </Section>

      <CTA href="/drive">Start driving with Blink</CTA>
    </PageShell>
  );
}

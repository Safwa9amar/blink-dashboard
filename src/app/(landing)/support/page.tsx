import { PageShell } from "../components/page-shell";
import { Section, SectionTitle, Paragraph, FeatureGrid } from "../components/content";

export default function SupportPage() {
  return (
    <PageShell title="Support Center" subtitle="Need help? We're here for you — in Arabic, French, or English. Real humans, fast replies.">
      <Section>
        <SectionTitle>How can we help?</SectionTitle>
        <FeatureGrid features={[
          { title: "Ride issues", desc: "Wrong charge, lost item, driver complaint — we'll sort it out quickly." },
          { title: "Account & payments", desc: "Login problems, payment failures, balance questions — get help with your account." },
          { title: "Marketplace orders", desc: "Missing items, late delivery, wrong order — we'll make it right." },
          { title: "Driver support", desc: "Earnings questions, app issues, passenger disputes — dedicated driver support." },
          { title: "Safety concerns", desc: "Report a safety issue and our team will respond immediately." },
          { title: "General questions", desc: "How Blink works, coverage areas, pricing — ask us anything." },
        ]} />
      </Section>

      <Section>
        <SectionTitle>Contact us</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6">
          {[
            { method: "In-app chat", desc: "Fastest way to reach us. Open the app → Profile → Help.", time: "< 5 min response" },
            { method: "Email", desc: "support@blink.com — for detailed issues or documentation.", time: "< 2 hour response" },
            { method: "Phone", desc: "+213 XX XXX XXXX — for urgent matters only.", time: "Available 24/7" },
          ].map((c, i) => (
            <div key={i} className="rounded-2xl p-6" style={{ background: "var(--surface)", border: "1px solid var(--line)" }}>
              <div className="font-semibold text-lg" style={{ fontFamily: "Poppins" }}>{c.method}</div>
              <p className="text-sm mt-2" style={{ color: "var(--ink-2)" }}>{c.desc}</p>
              <div className="text-xs font-semibold mt-3" style={{ color: "var(--brand)" }}>{c.time}</div>
            </div>
          ))}
        </div>
      </Section>
    </PageShell>
  );
}

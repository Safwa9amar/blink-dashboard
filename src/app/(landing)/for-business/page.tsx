import { PageShell } from "../components/page-shell";
import { Section, SectionTitle, Paragraph, FeatureGrid, CTA } from "../components/content";

export default function ForBusinessPage() {
  return (
    <PageShell title="Blink for Business" subtitle="Corporate rides, team deliveries, and marketplace accounts — managed from one dashboard.">
      <Section>
        <SectionTitle>Move your team, not your budget</SectionTitle>
        <Paragraph>Blink for Business gives companies a centralized way to manage employee transportation and delivery needs. Set budgets, track spending, and get monthly invoices — no expense reports needed.</Paragraph>
      </Section>

      <Section>
        <SectionTitle>Business features</SectionTitle>
        <FeatureGrid features={[
          { title: "Team management", desc: "Add employees, set ride policies, and assign spending limits per person or department." },
          { title: "Centralized billing", desc: "One monthly invoice for all rides and deliveries. No more individual expense claims." },
          { title: "Ride policies", desc: "Set rules: work hours only, max fare limits, approved destinations. Enforce automatically." },
          { title: "Real-time reporting", desc: "See who's riding, how much it costs, and where the budget stands — in real time." },
          { title: "API access", desc: "Integrate Blink into your internal tools with our business API." },
          { title: "Dedicated support", desc: "Priority support line for business accounts. Response in under 30 minutes." },
        ]} />
      </Section>

      <CTA href="mailto:business@blink.com">Contact sales</CTA>
    </PageShell>
  );
}

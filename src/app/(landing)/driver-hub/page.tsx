import { PageShell } from "../components/page-shell";
import { Section, SectionTitle, Paragraph, FeatureGrid, CTA } from "../components/content";

export default function DriverHubPage() {
  return (
    <PageShell title="Driver Hub" subtitle="Resources, guides, and community for Blink drivers.">
      <Section>
        <SectionTitle>Your driver resource center</SectionTitle>
        <Paragraph>The Driver Hub is your go-to place for everything related to driving with Blink. From onboarding guides to tax tips, safety protocols to community forums — find what you need to succeed.</Paragraph>
      </Section>

      <Section>
        <SectionTitle>Resources</SectionTitle>
        <FeatureGrid features={[
          { title: "Getting started guide", desc: "Step-by-step walkthrough from sign-up to your first completed trip." },
          { title: "Earnings tips", desc: "Strategies from top-earning drivers to maximize your income." },
          { title: "Safety guidelines", desc: "Best practices for safe driving, passenger interaction, and emergency procedures." },
          { title: "Vehicle requirements", desc: "Specifications and maintenance checklist to keep your vehicle trip-ready." },
          { title: "Tax & accounting", desc: "How to track expenses, understand deductions, and file as a Blink driver." },
          { title: "Community forum", desc: "Connect with other drivers, share experiences, and get peer support." },
        ]} />
      </Section>

      <CTA href="/drive">Become a driver</CTA>
    </PageShell>
  );
}

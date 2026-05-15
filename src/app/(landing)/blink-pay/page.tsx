import { PageShell } from "../components/page-shell";
import { Section, SectionTitle, Paragraph, FeatureGrid, CTA } from "../components/content";

export default function BlinkPayPage() {
  return (
    <PageShell title="Blink Pay" subtitle="Your digital wallet for rides, orders, and more. Top up once, use everywhere in the Blink ecosystem.">
      <Section>
        <SectionTitle>One balance, every service</SectionTitle>
        <Paragraph>Blink Pay is your in-app wallet that works across all Blink services. Top up with cash at any Blink agent, by card, or set up auto-reload. Pay for rides, marketplace orders, and courier deliveries instantly.</Paragraph>
        <Paragraph>Every transaction is logged with a digital receipt. Check your spending history anytime, export it for accounting, or share it with your employer.</Paragraph>
      </Section>

      <Section>
        <SectionTitle>How it works</SectionTitle>
        <FeatureGrid features={[
          { title: "Easy top-up", desc: "Add funds via card, bank transfer, or cash at 500+ Blink agent locations." },
          { title: "Auto-reload", desc: "Set a minimum balance and we'll top up automatically from your card." },
          { title: "Instant payments", desc: "No fumbling for cash. Just confirm and your ride is paid." },
          { title: "Digital receipts", desc: "Every transaction generates a receipt you can view, download, or share." },
          { title: "Spending insights", desc: "See where your money goes — rides, food, deliveries — with monthly summaries." },
          { title: "Secure", desc: "PIN-protected transactions. Your money is safe even if your phone isn't." },
        ]} />
      </Section>

      <CTA href="/#download">Set up Blink Pay</CTA>
    </PageShell>
  );
}

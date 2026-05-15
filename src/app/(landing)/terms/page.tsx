import { PageShell } from "../components/page-shell";
import { Section, SectionTitle, Paragraph } from "../components/content";

export default function TermsPage() {
  return (
    <PageShell title="Terms of Service" subtitle="Last updated: May 2025">
      <Section>
        <SectionTitle>1. Acceptance of Terms</SectionTitle>
        <Paragraph>By accessing or using the Blink application and services, you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use our services.</Paragraph>
      </Section>

      <Section>
        <SectionTitle>2. Description of Service</SectionTitle>
        <Paragraph>Blink provides a technology platform that connects riders with drivers, facilitates marketplace orders and deliveries, and offers courier services. Blink does not provide transportation services directly — we connect you with independent service providers.</Paragraph>
      </Section>

      <Section>
        <SectionTitle>3. User Accounts</SectionTitle>
        <Paragraph>You must register an account to use Blink services. You are responsible for maintaining the confidentiality of your account credentials. You must provide accurate, current, and complete information during registration.</Paragraph>
        <Paragraph>You may not create multiple accounts, share your account with others, or use another person&apos;s account without permission.</Paragraph>
      </Section>

      <Section>
        <SectionTitle>4. Payments and Fees</SectionTitle>
        <Paragraph>Fares are calculated based on distance, time, and demand. You will see the estimated fare before confirming a trip. Final charges may differ from estimates due to route changes, waiting time, or tolls.</Paragraph>
        <Paragraph>Blink accepts cash, credit/debit cards, and Blink Pay balance. Cancellation fees may apply if you cancel a trip after a driver has been assigned.</Paragraph>
      </Section>

      <Section>
        <SectionTitle>5. User Conduct</SectionTitle>
        <Paragraph>You agree not to use Blink for any unlawful purpose, harass drivers or other users, damage vehicles, or engage in any behavior that creates an unsafe environment. Violation of these rules may result in account suspension or termination.</Paragraph>
      </Section>

      <Section>
        <SectionTitle>6. Limitation of Liability</SectionTitle>
        <Paragraph>Blink provides its services on an &quot;as-is&quot; basis. We are not liable for any indirect, incidental, or consequential damages arising from the use of our services. Our total liability is limited to the amount you paid for the specific service in question.</Paragraph>
      </Section>

      <Section>
        <SectionTitle>7. Changes to Terms</SectionTitle>
        <Paragraph>We may update these terms from time to time. Continued use of Blink after changes are posted constitutes acceptance of the revised terms. We will notify you of material changes via the app or email.</Paragraph>
      </Section>

      <Section>
        <SectionTitle>8. Contact</SectionTitle>
        <Paragraph>For questions about these terms, contact us at legal@blink.com or write to: Blink SARL, Bab Ezzouar, Algiers, Algeria.</Paragraph>
      </Section>
    </PageShell>
  );
}

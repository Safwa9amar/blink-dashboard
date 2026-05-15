import { PageShell } from "../components/page-shell";
import { Section, SectionTitle, Paragraph } from "../components/content";

export default function PrivacyPage() {
  return (
    <PageShell title="Privacy Policy" subtitle="Last updated: May 2025">
      <Section>
        <SectionTitle>1. Information We Collect</SectionTitle>
        <Paragraph>We collect information you provide directly: name, phone number, email, payment information, and location data when using our services. We also collect device information, app usage data, and trip history to improve our services.</Paragraph>
      </Section>

      <Section>
        <SectionTitle>2. How We Use Your Information</SectionTitle>
        <Paragraph>We use your information to provide and improve our services, process payments, match you with drivers, send trip updates, and ensure safety. We may also use aggregated, anonymized data for analytics and service improvement.</Paragraph>
      </Section>

      <Section>
        <SectionTitle>3. Information Sharing</SectionTitle>
        <Paragraph>We share your information with drivers (name and pickup location) to facilitate trips, with payment processors to handle transactions, and with authorities when required by law. We do not sell your personal data to third parties.</Paragraph>
      </Section>

      <Section>
        <SectionTitle>4. Location Data</SectionTitle>
        <Paragraph>We collect location data when the app is in use to provide ride matching, navigation, and ETA estimates. You can disable location access in your device settings, but this will prevent you from using ride and delivery services.</Paragraph>
      </Section>

      <Section>
        <SectionTitle>5. Data Retention</SectionTitle>
        <Paragraph>We retain your account data for as long as your account is active. Trip history is retained for 3 years for legal and accounting purposes. You can request deletion of your account and associated data at any time.</Paragraph>
      </Section>

      <Section>
        <SectionTitle>6. Data Security</SectionTitle>
        <Paragraph>We implement industry-standard security measures to protect your data, including encryption in transit and at rest, access controls, and regular security audits. However, no system is 100% secure.</Paragraph>
      </Section>

      <Section>
        <SectionTitle>7. Your Rights</SectionTitle>
        <Paragraph>You have the right to access, correct, or delete your personal data. You can export your data from the app settings or contact us. You may also opt out of marketing communications at any time.</Paragraph>
      </Section>

      <Section>
        <SectionTitle>8. Contact</SectionTitle>
        <Paragraph>For privacy-related inquiries, contact our Data Protection Officer at privacy@blink.com or write to: Blink SARL, Bab Ezzouar, Algiers, Algeria.</Paragraph>
      </Section>
    </PageShell>
  );
}

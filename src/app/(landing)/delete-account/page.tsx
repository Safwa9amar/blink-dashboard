import { PageShell } from "../components/page-shell";
import { Section, SectionTitle, Paragraph } from "../components/content";

export default function DeleteAccountPage() {
  return (
    <PageShell
      title="Delete your Blink account"
      subtitle="How to ask Blink (developer: bahi dev) to delete your account and the data linked to it."
    >
      <Section>
        <SectionTitle>1. From the Blink app</SectionTitle>
        <Paragraph>Customers: open the app, go to Profile → Settings → Delete Account, choose a reason and confirm.</Paragraph>
        <Paragraph>Riders, merchants and agents: go to Profile → Data &amp; Privacy → Delete account, choose a reason and confirm.</Paragraph>
        <Paragraph>You are signed out right away, and our team then completes the deletion. A request can&apos;t be sent while you still have an order or delivery in progress, or unpaid Blink Cash dues; the app tells you what to settle first.</Paragraph>
      </Section>

      <Section>
        <SectionTitle>2. Without the app</SectionTitle>
        <Paragraph>
          Email <a href="mailto:hassanih97@gmail.com?subject=Blink%20account%20deletion" style={{ color: "var(--brand)" }}>hassanih97@gmail.com</a> with
          the subject &quot;Blink account deletion&quot; and the phone number or email address you sign in with. We may ask you to confirm the request from that number or address before we delete anything.
        </Paragraph>
      </Section>

      <Section>
        <SectionTitle>3. What we delete</SectionTitle>
        <Paragraph>Your sign-in (phone number, email, Google sign-in), name, profile photo, saved addresses, favourites, notification tokens, last known location, and any identity, vehicle or store documents you uploaded.</Paragraph>
      </Section>

      <Section>
        <SectionTitle>4. What we keep, and for how long</SectionTitle>
        <Paragraph>Records of past orders, trips and Blink Cash transactions are kept, no longer linked to a profile, for up to 3 years for legal, tax and accounting purposes. A record of the deletion request itself (name, phone number and email) is kept for the same period so we can answer disputes and prevent fraud. Store and product images stay visible in other people&apos;s order history.</Paragraph>
      </Section>
    </PageShell>
  );
}

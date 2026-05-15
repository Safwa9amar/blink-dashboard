import { PageShell } from "../components/page-shell";
import { Section, SectionTitle, Paragraph, FeatureGrid, CTA, StatRow } from "../components/content";

export default function RidesPage() {
  return (
    <PageShell title="Rides" subtitle="Get where you need to go — fast, safe, and at a fair price. Blink connects you with verified drivers across Algeria.">
      <Section>
        <SectionTitle>How Blink Rides work</SectionTitle>
        <Paragraph>Open the app, enter your destination, and get matched with a nearby driver in seconds. See the fare upfront — no surprises, no haggling. Track your ride in real time and share your trip with family.</Paragraph>
        <Paragraph>Pay with cash, card, or your Blink balance. Rate your driver after every trip to keep the community strong.</Paragraph>
      </Section>

      <Section>
        <SectionTitle>Why riders choose Blink</SectionTitle>
        <FeatureGrid features={[
          { title: "Upfront pricing", desc: "Know exactly what you'll pay before you confirm. No surge multipliers, no hidden fees." },
          { title: "Verified drivers", desc: "Every driver passes background checks and vehicle inspection before their first trip." },
          { title: "Real-time tracking", desc: "Watch your driver approach on a live map. Share your trip link with anyone." },
          { title: "Multiple payment options", desc: "Cash, credit card, or Blink balance — pay however works for you." },
          { title: "24/7 availability", desc: "Early morning airport run or late-night return — Blink drivers are always out there." },
          { title: "In-app support", desc: "Lost item? Billing question? Our support team responds in minutes, not hours." },
        ]} />
      </Section>

      <StatRow stats={[
        { value: "2.4M+", label: "Trips completed" },
        { value: "< 4 min", label: "Average pickup time" },
        { value: "4.87", label: "Average driver rating" },
      ]} />

      <CTA href="/#download">Download Blink</CTA>
    </PageShell>
  );
}

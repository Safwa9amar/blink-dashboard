import { PageShell } from "../components/page-shell";
import { Section, SectionTitle, Paragraph, FeatureGrid, CTA } from "../components/content";

export default function CourierPage() {
  return (
    <PageShell title="Courier" subtitle="Send anything across town — documents, gifts, forgotten keys. Live tracking from pickup to drop.">
      <Section>
        <SectionTitle>Same-day delivery, any time</SectionTitle>
        <Paragraph>Need to send a package across the city? Blink Courier connects you with a driver who picks up from your location and delivers straight to the recipient. Track every step on a live map.</Paragraph>
        <Paragraph>Perfect for documents, small parcels, gifts, or anything that needs to get there today. The recipient gets notified and can track too.</Paragraph>
      </Section>

      <Section>
        <SectionTitle>Courier features</SectionTitle>
        <FeatureGrid features={[
          { title: "Door-to-door", desc: "Our driver picks up from you and delivers right to the recipient's door." },
          { title: "Live tracking", desc: "Both sender and recipient can watch the delivery in real time." },
          { title: "Photo proof", desc: "Get a delivery confirmation photo so you know it arrived." },
          { title: "Secure handling", desc: "Fragile items? Add a note and our drivers handle with care." },
          { title: "Instant quotes", desc: "See the delivery cost before you confirm. Based on distance, not weight." },
          { title: "Multi-stop", desc: "Need to deliver to multiple addresses? Add up to 5 stops in one trip." },
        ]} />
      </Section>

      <CTA href="/#download">Send a package</CTA>
    </PageShell>
  );
}

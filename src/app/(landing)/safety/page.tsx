import { PageShell } from "../components/page-shell";
import { Section, SectionTitle, Paragraph, FeatureGrid } from "../components/content";

export default function SafetyPage() {
  return (
    <PageShell title="Safety" subtitle="Your safety is our top priority. Every feature, every policy, every decision starts with keeping you safe.">
      <Section>
        <SectionTitle>Safety for riders</SectionTitle>
        <FeatureGrid features={[
          { title: "Verified drivers", desc: "Every driver passes identity verification, background checks, and vehicle inspection." },
          { title: "Trip sharing", desc: "Share your live trip with family or friends so they can follow along in real time." },
          { title: "Emergency button", desc: "One tap connects you to local emergency services with your live location." },
          { title: "PIN verification", desc: "Confirm your driver with a unique 4-digit PIN before starting your ride." },
          { title: "24/7 safety team", desc: "Our dedicated safety team monitors trips and responds to incidents around the clock." },
          { title: "Ride recording", desc: "Opt-in audio recording during trips for an extra layer of accountability." },
        ]} />
      </Section>

      <Section>
        <SectionTitle>Safety for drivers</SectionTitle>
        <FeatureGrid features={[
          { title: "Passenger ratings", desc: "See a rider's rating before accepting. Low-rated passengers are flagged automatically." },
          { title: "Trip details upfront", desc: "Know the destination and fare before accepting any trip request." },
          { title: "Speed alerts", desc: "Get notified if you're exceeding safe speed limits during a trip." },
          { title: "Fatigue detection", desc: "We'll prompt you to take a break after extended driving sessions." },
        ]} />
      </Section>

      <Section>
        <SectionTitle>Community guidelines</SectionTitle>
        <Paragraph>Blink is a community built on mutual respect. We have zero tolerance for harassment, discrimination, or dangerous behavior. Both riders and drivers who violate our guidelines are permanently removed from the platform.</Paragraph>
        <Paragraph>If you experience or witness any safety issue, report it immediately through the app or contact our safety team at safety@blink.com.</Paragraph>
      </Section>
    </PageShell>
  );
}

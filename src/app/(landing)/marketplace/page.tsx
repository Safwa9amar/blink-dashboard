import { PageShell } from "../components/page-shell";
import { Section, SectionTitle, Paragraph, FeatureGrid, CTA } from "../components/content";

export default function MarketplacePage() {
  return (
    <PageShell title="Marketplace" subtitle="Order from your favorite restaurants, pharmacies, and stores — delivered to your door in minutes.">
      <Section>
        <SectionTitle>Your neighborhood, delivered</SectionTitle>
        <Paragraph>Browse hundreds of local shops and restaurants right in the Blink app. From a quick lunch to weekly groceries, from pharmacy essentials to fresh flowers — find it, tap it, get it delivered.</Paragraph>
        <Paragraph>Real-time order tracking lets you see exactly when your delivery will arrive. No minimum order, no subscription required.</Paragraph>
      </Section>

      <Section>
        <SectionTitle>What you can order</SectionTitle>
        <FeatureGrid features={[
          { title: "Restaurants", desc: "Pizza, tacos, sushi, traditional dishes — hot food from the places you love, delivered fast." },
          { title: "Groceries", desc: "Fresh produce, pantry staples, snacks. Skip the checkout line." },
          { title: "Pharmacies", desc: "Medicines, vitamins, personal care. Available 24/7 from partner pharmacies." },
          { title: "Specialty shops", desc: "Bakeries, flower shops, electronics — if it's in your city, it's in Blink." },
          { title: "Scheduled delivery", desc: "Need it tomorrow morning? Schedule your order for the perfect time." },
          { title: "Group orders", desc: "Ordering for the office? Split the bill or pay for everyone — your call." },
        ]} />
      </Section>

      <CTA href="/#download">Start ordering</CTA>
    </PageShell>
  );
}

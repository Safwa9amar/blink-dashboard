import { PageShell } from "../components/page-shell";
import { Section, SectionTitle, Paragraph, FeatureGrid, CTA } from "../components/content";

export default function DriverAppPage() {
  return (
    <PageShell title="Driver App" subtitle="Everything you need to manage your trips, earnings, and account — all in one app.">
      <Section>
        <SectionTitle>Built for drivers</SectionTitle>
        <Paragraph>The Blink Driver app is your cockpit. See incoming trip requests with fare estimates, navigate with built-in directions, track your daily and weekly earnings, and manage your schedule — all from your phone.</Paragraph>
      </Section>

      <Section>
        <SectionTitle>App features</SectionTitle>
        <FeatureGrid features={[
          { title: "Smart trip requests", desc: "See pickup distance, fare estimate, and destination before accepting any trip." },
          { title: "Built-in navigation", desc: "Optimized routes that account for traffic, road closures, and fastest paths." },
          { title: "Earnings dashboard", desc: "Real-time earnings tracker with daily, weekly, and monthly breakdowns." },
          { title: "Heat maps", desc: "See where demand is highest so you can position yourself for more trips." },
          { title: "Schedule ahead", desc: "Set your available hours in advance and get trip requests only when you're ready." },
          { title: "In-app support", desc: "Report issues, get help with passengers, or contact support — without leaving the app." },
        ]} />
      </Section>

      <CTA href="/#download">Download the Driver app</CTA>
    </PageShell>
  );
}

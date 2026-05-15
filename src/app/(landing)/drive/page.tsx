import { PageShell } from "../components/page-shell";
import { Section, SectionTitle, Paragraph, FeatureGrid, CTA, StatRow } from "../components/content";

export default function DrivePage() {
  return (
    <PageShell title="Drive with Blink" subtitle="Be your own boss. Set your own hours. Earn on your terms — and cash out anytime.">
      <Section>
        <SectionTitle>Start earning in 3 days</SectionTitle>
        <Paragraph>Sign up online, upload your documents, pass a quick verification, and you&apos;re ready to drive. No office visits, no long waits. Most drivers complete their first trip within 3 days of signing up.</Paragraph>
        <Paragraph>Drive when you want, where you want. Accept the trips that work for you. Cash out your earnings daily — no minimum threshold, no waiting for payday.</Paragraph>
      </Section>

      <Section>
        <SectionTitle>Why drivers love Blink</SectionTitle>
        <FeatureGrid features={[
          { title: "Flexible hours", desc: "Online when you want, offline when you don't. No shifts, no commitments." },
          { title: "Transparent earnings", desc: "See exactly what you'll earn for each trip before you accept it." },
          { title: "Instant cashout", desc: "Transfer earnings to your bank or CCP account anytime. No fees." },
          { title: "Driver bonuses", desc: "Peak-hour bonuses, streak rewards, and weekly challenges to boost your income." },
          { title: "Insurance coverage", desc: "Every trip is covered by our partner insurance. Drive with peace of mind." },
          { title: "Driver community", desc: "Join a network of 18,000+ drivers. Share tips, get support, grow together." },
        ]} />
      </Section>

      <StatRow stats={[
        { value: "+45%", label: "Avg. earnings increase" },
        { value: "18,000+", label: "Active drivers" },
        { value: "3 days", label: "Sign-up to first trip" },
      ]} />

      <CTA href="/#download">Start driving</CTA>
    </PageShell>
  );
}

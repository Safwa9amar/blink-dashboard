import nodemailer from "nodemailer";

// Server-only SMTP transport for the dashboard's own auth emails (reset / sign-in code), so
// they skip Supabase's built-in mailer (2 emails/hour, team members only). Same env names
// as blink-server: SMTP_HOST, SMTP_PORT (587), SMTP_SECURE ("true" for 465), SMTP_USER,
// SMTP_PASS, SMTP_FROM (defaults to SMTP_USER). NEVER import this from a client component.
export function smtpConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;
function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      // Serverless: fail fast instead of hanging the server action on a dead host.
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
    });
  }
  return transporter;
}

/** One-shot send. Throws on failure. */
export async function sendMail(msg: { to: string; subject: string; html: string; text: string }): Promise<void> {
  await getTransporter().sendMail({ from: process.env.SMTP_FROM || process.env.SMTP_USER, ...msg });
}

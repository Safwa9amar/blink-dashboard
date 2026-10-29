// Localized (en/fr/ar) dashboard auth emails. Pure: no I/O. Copy and layout mirror
// blink-server's src/lib/email/auth-templates.ts (the Supabase Send Email hook) — keep
// the two in step when either changes.
export type AuthLang = "en" | "fr" | "ar";
export type AuthEmailType = "recovery" | "magiclink";

interface Copy {
  subject: string;
  heading: string;
  body: string;
  button: string;
  expiry: string;
}

const FOOTER: Record<AuthLang, string> = {
  en: "If you didn't ask for this, you can safely ignore this email.",
  fr: "Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet e-mail.",
  ar: "إذا لم تطلب ذلك، يمكنك تجاهل هذه الرسالة بأمان.",
};
const OR_CODE: Record<AuthLang, string> = { en: "Or use this code:", fr: "Ou utilisez ce code :", ar: "أو استخدم هذا الرمز:" };

const COPY: Record<AuthLang, Record<AuthEmailType, Copy>> = {
  en: {
    magiclink: { subject: "Your Blink sign-in code", heading: "Sign in to Blink", body: "Use the button or the code below to sign in.", button: "Sign in", expiry: "This code and link expire in 1 hour." },
    recovery: { subject: "Reset your Blink password", heading: "Reset your password", body: "We received a request to reset your password. Use the button or the code below to choose a new one.", button: "Reset password", expiry: "This code and link expire in 1 hour." },
  },
  fr: {
    magiclink: { subject: "Votre code de connexion Blink", heading: "Connexion à Blink", body: "Utilisez le bouton ou le code ci-dessous pour vous connecter.", button: "Se connecter", expiry: "Ce code et ce lien expirent dans 1 heure." },
    recovery: { subject: "Réinitialisez votre mot de passe Blink", heading: "Réinitialisez votre mot de passe", body: "Nous avons reçu une demande de réinitialisation de votre mot de passe. Utilisez le bouton ou le code ci-dessous pour en choisir un nouveau.", button: "Réinitialiser le mot de passe", expiry: "Ce code et ce lien expirent dans 1 heure." },
  },
  ar: {
    magiclink: { subject: "رمز تسجيل الدخول إلى Blink", heading: "تسجيل الدخول إلى Blink", body: "استخدم الزر أو الرمز أدناه لتسجيل الدخول.", button: "تسجيل الدخول", expiry: "ينتهي هذا الرمز والرابط خلال ساعة واحدة." },
    recovery: { subject: "إعادة تعيين كلمة مرور Blink", heading: "إعادة تعيين كلمة المرور", body: "تلقينا طلبًا لإعادة تعيين كلمة مرورك. استخدم الزر أو الرمز أدناه لاختيار كلمة مرور جديدة.", button: "إعادة تعيين كلمة المرور", expiry: "ينتهي هذا الرمز والرابط خلال ساعة واحدة." },
  },
};

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const BRAND = "#EE335F";

export function renderAuthEmail(input: { type: AuthEmailType; lang: AuthLang; code?: string; link: string }): {
  subject: string;
  html: string;
  text: string;
} {
  const { lang, link } = input;
  const c = COPY[lang][input.type];
  const rtl = lang === "ar";
  const dir = rtl ? "rtl" : "ltr";
  const align = rtl ? "right" : "left";
  const code = input.code && /^\d{4,8}$/.test(input.code) ? input.code : undefined;

  const parts: string[] = [];
  parts.push(`<p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#374151;text-align:${align};">${escapeHtml(c.body)}</p>`);
  parts.push(
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;"><tr><td style="background:${BRAND};border-radius:10px;"><a href="${escapeHtml(link)}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;font-family:Arial,Helvetica,sans-serif;">${escapeHtml(c.button)}</a></td></tr></table>`,
  );
  if (code) {
    parts.push(
      `<p style="margin:0 0 8px;font-size:13px;color:#6b7280;text-align:${align};">${escapeHtml(OR_CODE[lang])}</p>` +
        `<p dir="ltr" style="margin:0 0 20px;font-family:'Courier New',Courier,monospace;font-size:32px;font-weight:bold;letter-spacing:8px;color:#111827;text-align:${align};">${escapeHtml(code)}</p>`,
    );
  }
  parts.push(`<p style="margin:0 0 20px;font-size:13px;color:#6b7280;text-align:${align};">${escapeHtml(c.expiry)}</p>`);
  parts.push(
    `<p style="margin:0 0 20px;font-size:12px;line-height:1.5;color:#9ca3af;word-break:break-all;text-align:${align};" dir="ltr">${escapeHtml(link)}</p>`,
  );

  const html = `<!doctype html>
<html lang="${lang}" dir="${dir}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(c.subject)}</title></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f3f4f6;"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;background:#ffffff;border-radius:14px;">
<tr><td style="padding:28px 28px 0;text-align:${align};"><span style="font-size:26px;font-weight:bold;color:${BRAND};letter-spacing:0.5px;">Blink</span></td></tr>
<tr><td dir="${dir}" style="padding:20px 28px 8px;text-align:${align};">
<h1 style="margin:0 0 16px;font-size:20px;color:#111827;text-align:${align};">${escapeHtml(c.heading)}</h1>
${parts.join("\n")}
</td></tr>
<tr><td dir="${dir}" style="padding:0 28px 28px;"><hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 16px;"><p style="margin:0;font-size:12px;line-height:1.5;color:#9ca3af;text-align:${align};">${escapeHtml(FOOTER[lang])}</p></td></tr>
</table></td></tr></table>
</body></html>`;

  const text = [c.heading, "", c.body, "", `${c.button}: ${link}`, code ? `\n${OR_CODE[lang]} ${code}` : "", "", c.expiry, "", FOOTER[lang], "", "Blink"]
    .filter((l, i, a) => !(l === "" && a[i - 1] === ""))
    .join("\n");

  return { subject: c.subject, html, text };
}

"use client";

import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui";
import { LanguageSwitcher } from "@/components/language-switcher";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const t = useTranslations("auth");
  const tc = useTranslations("common");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-8 p-8 bg-card rounded-2xl border border-border">
        <div className="flex flex-col items-center gap-3">
          <Image src="/images/blink-logo.png" alt="Blink" width={98} height={27} className="mb-2" />
          <p className="text-subtext text-sm">{t("subtitle")}</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-subtext mb-1.5">
              {tc("email")}
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-background border border-border rounded-xl text-text placeholder-subtext/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              placeholder={t("email_placeholder")}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-subtext mb-1.5">
              {tc("password")}
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 bg-background border border-border rounded-xl text-text placeholder-subtext/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              placeholder={t("password_placeholder")}
            />
          </div>

          {error && (
            <div className="px-4 py-3 bg-danger-light border border-danger/20 rounded-xl">
              <p className="text-danger text-sm">{error}</p>
            </div>
          )}

          <Button type="submit" loading={loading} className="w-full">
            {loading ? tc("signing_in") : tc("sign_in")}
          </Button>
        </form>

        <div className="flex justify-center">
          <LanguageSwitcher />
        </div>
      </div>
    </div>
  );
}

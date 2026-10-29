import Image from "next/image";
import type { ReactNode } from "react";
import { LanguageSwitcher } from "@/components/language-switcher";

export const INPUT =
  "w-full px-4 py-3 bg-background border border-border rounded-xl text-text placeholder-subtext/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all";

/** The shared login card: logo, optional title/subtitle, content, language switcher. */
export function AuthShell({ title, subtitle, children }: { title?: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-6 p-8 bg-card rounded-2xl border border-border">
        <div className="flex flex-col items-center gap-3">
          <Image src="/images/blink-logo.png" alt="Blink" width={98} height={27} className="mb-2" />
          {title && <h1 className="text-text text-lg font-semibold">{title}</h1>}
          {subtitle && <p className="text-subtext text-sm text-center">{subtitle}</p>}
        </div>
        {children}
        <div className="flex justify-center">
          <LanguageSwitcher />
        </div>
      </div>
    </div>
  );
}

export function ErrorBox({ children }: { children: ReactNode }) {
  return (
    <div role="alert" className="px-4 py-3 bg-danger-light border border-danger/20 rounded-xl">
      <p className="text-danger text-sm">{children}</p>
    </div>
  );
}

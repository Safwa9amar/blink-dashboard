"use client";

import { useEffect, useState, useTransition } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { setLocale as setLocaleAction } from "@/i18n/actions";
import { BlinkLogoSvg } from "./blink-logo";

export function ThemeToggle() {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    const t = document.documentElement.getAttribute("data-theme");
    setDark(t === "dark");
  }, []);

  function toggle() {
    const next = dark ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
    setDark(!dark);
  }

  return (
    <button onClick={toggle} aria-label="Toggle theme"
      className="w-[38px] h-[38px] rounded-[10px] grid place-items-center transition-all cursor-pointer"
      style={{ border:"1px solid var(--line)", background:"var(--surface)", color:"var(--ink-2)" }}>
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        {dark ? (
          <><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></>
        ) : (
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        )}
      </svg>
    </button>
  );
}

export function LangToggle() {
  const locales = ["en", "fr", "ar"] as const;
  const labels = ["EN", "FR", "AR"];
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const currentIdx = locales.indexOf(locale as typeof locales[number]);

  function handleClick() {
    const nextIdx = (currentIdx + 1) % locales.length;
    startTransition(async () => {
      await setLocaleAction(locales[nextIdx]);
      router.refresh();
    });
  }

  return (
    <button onClick={handleClick} disabled={isPending} aria-label="Language"
      className="h-[38px] px-3.5 rounded-[10px] flex items-center gap-2 text-[13px] font-semibold tracking-wide cursor-pointer disabled:opacity-50"
      style={{ border:"1px solid var(--line)", background:"var(--surface)", color:"var(--ink-2)" }}>
      <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand)]" />
      {labels[currentIdx === -1 ? 0 : currentIdx]}
    </button>
  );
}

export function QrGrid() {
  const [cells, setCells] = useState<boolean[]>([]);

  useEffect(() => {
    const N = 15;
    let seed = 7;
    const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    const result: boolean[] = [];
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        const inTL = r < 4 && c < 4;
        const inTR = r < 4 && c > N - 5;
        const inBL = r > N - 5 && c < 4;
        const inCenter = r >= 6 && r <= 8 && c >= 6 && c <= 8;
        const on = !inTL && !inTR && !inBL && !inCenter && rnd() > 0.55;
        result.push(on);
      }
    }
    setCells(result);
  }, []);

  if (!cells.length) return <div className="w-[180px] h-[180px] mx-auto" />;

  return (
    <div className="qr-grid w-[180px] h-[180px] mx-auto">
      {cells.map((on, i) => <i key={i} className={on ? "" : "b"} />)}
      <span className="qr-corner qr-corner-tl" />
      <span className="qr-corner qr-corner-tr" />
      <span className="qr-corner qr-corner-bl" />
      <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white grid place-items-center rounded-[10px] z-[2] shadow-[0_0_0_4px_white]">
        <span className="brand-mark w-7 h-7 rounded-[7px]"><BlinkLogoSvg className="!w-3 !h-3.5" /></span>
      </span>
    </div>
  );
}

export function PhoneMock() {
  return (
    <div className="relative h-[660px] grid place-items-center max-lg:hidden">
      <div className="blob w-[380px] h-[380px] bg-[var(--brand)] absolute top-10 -right-10 opacity-35" />
      <div className="blob w-[320px] h-[320px] absolute bottom-8 -left-5 opacity-35" style={{ background:"var(--brand-soft)" }} />
      <div className="phone-mock relative">
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-[110px] h-7 bg-black rounded-2xl z-[3]" />
        <div className="w-full h-full rounded-[36px] overflow-hidden bg-[#F9FAFB] relative">
          {/* Status bar */}
          <div className="absolute top-0 inset-x-0 h-11 bg-[#FDE8EE] z-[2] flex items-center justify-between px-[22px] pl-6 text-[13px] font-semibold text-[#0F172A]">
            <span>9:41</span>
            <span className="flex gap-1.5 items-center">
              <span className="inline-flex gap-0.5 items-end h-2.5">
                <span className="w-[3px] h-1 bg-[#0F172A] rounded-sm" />
                <span className="w-[3px] h-[7px] bg-[#0F172A] rounded-sm" />
                <span className="w-[3px] h-2.5 bg-[#0F172A] rounded-sm" />
              </span>
              <span className="w-[18px] h-2.5 border-[1.5px] border-[#0F172A] rounded-[3px] relative">
                <span className="absolute inset-[1px] right-[5px] bg-[#0F172A] rounded-sm" />
              </span>
            </span>
          </div>
          {/* Header */}
          <div className="h-[230px] pt-14 px-[18px] pb-5 relative" style={{ background:"linear-gradient(180deg, #FF6C90 0%, #EE3160 100%)", borderRadius:"0 0 18px 18px" }}>
            <div className="flex items-center gap-2">
              <svg className="w-[22px] h-[22px] text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
              <div className="flex-1 h-[26px] bg-white rounded-md flex items-center px-2.5 gap-1.5 text-[9px] text-[#94A3B8] shadow-[0_4px_10px_-2px_rgba(0,0,0,.08)]">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                Algiers Centre, Ya khouuu
              </div>
              <BlinkLogoSvg className="w-[22px] h-[22px] text-white" />
            </div>
            <div className="text-white/95 text-center text-xl font-bold mt-5" style={{ fontFamily:"Poppins", letterSpacing:".04em" }}>Where to, today?</div>
          </div>
          {/* Services */}
          <div className="grid grid-cols-2 gap-3 px-6 -mt-14 relative z-[2]">
            {[
              { label:"Book a Ride", ar:"طلب ليفرور", icon:<><path d="M3 17h2l2-7h10l2 7h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M9 10l1-4h4l1 4"/></> },
              { label:"Marketplace", ar:"تسوق في السوق", icon:<><path d="M3 7h13l3 4v6h-3M3 7v10h3"/><circle cx="9" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></> },
            ].map((s,i) => (
              <div key={i} className="bg-white/95 rounded-xl p-4 pb-3.5 text-center border border-[#D1D5DB] shadow-[0_6px_14px_-4px_rgba(0,0,0,.12)]">
                <div className="w-[58px] h-[58px] rounded-full bg-[#FDE8EE] mx-auto mb-3 grid place-items-center text-[#0F172A]">
                  <svg className="w-[30px] h-[30px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{s.icon}</svg>
                </div>
                <div className="text-[11px] font-bold text-[#0F172A]" style={{ fontFamily:"Poppins" }}>{s.label}</div>
                <div className="text-[10px] text-[#64748B] mt-1" style={{ fontFamily:"Arimo", direction:"rtl" }}>{s.ar}</div>
              </div>
            ))}
          </div>
          {/* Offers */}
          <div className="text-[13px] font-bold text-[#262626] px-[22px] pt-5 pb-2.5" style={{ fontFamily:"Poppins" }}>Top Offers</div>
          <div className="flex gap-2 px-[22px]">
            <div className="flex-1 h-[78px] rounded-[10px] p-2.5 px-3 text-white font-bold text-[11px] flex items-end relative overflow-hidden" style={{ fontFamily:"Poppins", background:"linear-gradient(135deg, #EE335F 0%, #971B3A 100%)" }}>
              <span className="absolute top-2.5 left-3 text-sm">25%</span>OFF<br/>Students
              <span className="absolute -right-2 -top-2 w-[60px] h-[60px] rounded-full bg-white/10" />
            </div>
            <div className="flex-1 h-[78px] rounded-[10px] p-2.5 px-3 text-white font-bold text-[11px] flex items-end relative overflow-hidden" style={{ fontFamily:"Poppins", background:"linear-gradient(135deg, #0F172A 0%, #334155 100%)" }}>
              <span className="absolute top-2.5 left-3 text-sm">30%</span>OFF<br/>Delivery
              <span className="absolute -right-2 -top-2 w-[60px] h-[60px] rounded-full bg-white/10" />
            </div>
          </div>
          {/* Navbar */}
          <div className="absolute left-4 right-4 bottom-3.5 h-14 rounded-[18px] bg-white/90 backdrop-blur-[20px] border border-[rgba(15,23,42,.06)] shadow-[0_12px_24px_-6px_rgba(0,0,0,.18)] flex items-center justify-around px-3">
            {[true,false,false,false].map((active,i) => (
              <div key={i} className={`w-8 h-8 grid place-items-center relative ${active ? "text-[#EE335F]" : "text-[#6B7280]"}`}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {i===0 && <path d="M3 11l9-8 9 8v9a2 2 0 0 1-2 2h-4v-7H9v7H5a2 2 0 0 1-2-2z"/>}
                  {i===1 && <><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18"/></>}
                  {i===2 && <><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></>}
                  {i===3 && <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>}
                </svg>
                {active && <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-[5px] h-[5px] rounded-full bg-[#EE335F]" />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

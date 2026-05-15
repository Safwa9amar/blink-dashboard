import { getTranslations } from "next-intl/server";
import { BlinkLogoSvg } from "./blink-logo";
import { ThemeToggle, LangToggle, QrGrid, PhoneMock } from "./landing-client";

export default async function LandingPage() {
  const nav = await getTranslations("landing.nav");
  const hero = await getTranslations("landing.hero");
  const strip = await getTranslations("landing.strip");
  const svc = await getTranslations("landing.services");
  const steps = await getTranslations("landing.steps");
  const feat = await getTranslations("landing.features");
  const drv = await getTranslations("landing.drivers");
  const dl = await getTranslations("landing.download");
  const ft = await getTranslations("landing.footer");

  const navLinks = [
    { label: nav("rides"), href: "#rides" },
    { label: nav("marketplace"), href: "#marketplace" },
    { label: nav("how_it_works"), href: "#how" },
    { label: nav("drive_earn"), href: "#drivers" },
    { label: nav("for_business"), href: "#partners" },
  ];

  return (
    <div className="landing-page">
      {/* ── NAV ── */}
      <nav className="nav-glass sticky top-0 z-50 py-3.5">
        <div className="max-w-[1240px] mx-auto px-8 flex items-center gap-8">
          <a href="#" className="flex items-center gap-2.5 font-bold text-lg" style={{ fontFamily: "Poppins, sans-serif", letterSpacing: "-0.01em" }}>
            <span className="brand-mark"><BlinkLogoSvg /></span>
            Blink
          </a>
          <div className="hidden lg:flex gap-1 ms-2">
            {navLinks.map((l, i) => (
              <a key={i} href={l.href} className="px-3.5 py-2 rounded-[10px] text-sm font-medium transition-colors hover:bg-[var(--bg-mute)]" style={{ color: "var(--ink-2)" }}>
                {l.label}
              </a>
            ))}
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <LangToggle />
            <ThemeToggle />
            <a href="#download" className="btn-brand inline-flex items-center gap-2 h-[38px] px-3.5 rounded-xl text-[13px] font-semibold">{nav("get_the_app")}</a>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <header className="relative py-[72px] overflow-hidden">
        <div className="max-w-[1240px] mx-auto px-8 grid grid-cols-1 lg:grid-cols-[1.05fr_.95fr] gap-14 items-center">
          <div>
            <span className="inline-flex items-center gap-2.5 h-8 px-3 ps-1.5 rounded-full text-xs font-medium" style={{ background: "var(--bg-mute)", border: "1px solid var(--line)", color: "var(--ink-2)" }}>
              <span className="bg-[var(--brand)] text-white text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wide">{hero("badge")}</span>
              {hero("badge_text")}
            </span>
            <h1 className="mt-6 leading-[0.98] font-bold" style={{ fontFamily: "Poppins, sans-serif", fontSize: "clamp(44px, 7vw, 88px)" }}>
              {hero("title_1")}<br/>{hero("title_2")} <span className="accent-text">{hero("title_accent")}</span>.
            </h1>
            <p className="mt-5 text-lg max-w-[520px]" style={{ color: "var(--ink-2)" }}>{hero("subtitle")}</p>
            <div className="mt-8 flex gap-3 flex-wrap">
              <a href="#download" className="btn-brand inline-flex items-center gap-2 h-11 px-[18px] rounded-xl text-sm font-semibold">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7 7 7-7"/></svg>
                {hero("download")}
              </a>
              <a href="#rides" className="btn-outline inline-flex items-center gap-2 h-11 px-[18px] rounded-xl text-sm font-semibold">
                {hero("see_how")}
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>
              </a>
            </div>
            <div className="mt-9 flex gap-9 flex-wrap pt-7" style={{ borderTop: "1px solid var(--line)" }}>
              {[["2.4M+", hero("stat_trips")],["18,000", hero("stat_drivers")],["12 cities", hero("stat_cities")]].map(([n,l],i)=>(
                <div key={i}>
                  <div className="text-[26px] font-bold" style={{ fontFamily:"Poppins", letterSpacing:"-0.02em" }}>{n}</div>
                  <div className="text-xs mt-1" style={{ color:"var(--ink-3)", letterSpacing:".02em" }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
          <PhoneMock />
        </div>
      </header>

      {/* ── STRIP ── */}
      <div className="strip-bar py-5">
        <div className="max-w-[1240px] mx-auto px-8 flex items-center gap-9 flex-wrap justify-between text-xs font-semibold uppercase tracking-[.12em]" style={{ color: "var(--ink-3)" }}>
          <span>{strip("now_serving")}</span>
          <div className="flex gap-7 flex-wrap" style={{ color: "var(--ink-2)" }}>
            {["Algiers","Oran","Constantine","Annaba","Setif","Blida"].map((c,i) => (
              <span key={i} className="inline-flex items-center gap-2">
                <span className="w-[5px] h-[5px] rounded-full bg-[var(--brand)]" />{c}
              </span>
            ))}
            <span className="inline-flex items-center gap-2">
              <span className="w-[5px] h-[5px] rounded-full bg-[var(--brand)]" />{strip("more")}
            </span>
          </div>
        </div>
      </div>

      {/* ── SERVICES ── */}
      <section id="rides" className="py-24 max-md:py-16">
        <div className="max-w-[1240px] mx-auto px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-end mb-14">
            <div>
              <span className="eyebrow">{svc("eyebrow")}</span>
              <h2 className="mt-3.5 font-bold leading-[1.02]" style={{ fontFamily:"Poppins", fontSize:"clamp(32px, 4.2vw, 56px)" }}>{svc("title")}</h2>
            </div>
            <p className="text-[17px]">{svc("subtitle")}</p>
          </div>
          <div className="grid grid-cols-12 gap-5">
            <div className="col-span-12 svc-card svc-card-hero min-h-[280px] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs tracking-[.14em]" style={{ fontFamily:"Poppins", color:"rgba(255,255,255,.5)" }}>01 / RIDES</span>
                <div className="svc-arrow"><svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-6-6 6 6-6 6"/></svg></div>
              </div>
              <div>
                <div className="svc-icon"><svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 17h2l2-7h10l2 7h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M9 10l1-4h4l1 4"/></svg></div>
                <h3 className="mt-4 text-[42px] max-w-[560px] font-semibold leading-tight" style={{ fontFamily:"Poppins" }}>{svc("rides_title")}</h3>
                <p className="mt-2.5 text-[15px] max-w-[420px]" style={{ color:"rgba(255,255,255,.85)" }}>{svc("rides_desc")}</p>
              </div>
            </div>
            {([
              { num:"02 / MARKETPLACE", tKey:"marketplace" as const, icon:<><path d="M3 7h13l3 4v6h-3M3 7v10h3"/><circle cx="9" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></> },
              { num:"03 / COURIER", tKey:"courier" as const, icon:<><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12"/></> },
              { num:"04 / PROMOS", tKey:"promos" as const, icon:<><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><circle cx="7" cy="7" r="1.5"/></> },
              { num:"05 / SUPPORT", tKey:"support" as const, icon:<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z"/> },
            ] as const).map((s, i) => (
              <div key={i} className="col-span-12 md:col-span-6 svc-card min-h-[320px] flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs tracking-[.14em]" style={{ fontFamily:"Poppins", color:"var(--ink-3)" }}>{s.num}</span>
                  <div className="svc-arrow"><svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-6-6 6 6-6 6"/></svg></div>
                </div>
                <div>
                  <div className="svc-icon"><svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{s.icon}</svg></div>
                  <h3 className="mt-4 text-[26px] font-semibold" style={{ fontFamily:"Poppins" }}>{svc(`${s.tKey}_title`)}</h3>
                  <p className="mt-2.5 text-[15px] max-w-[420px]">{svc(`${s.tKey}_desc`)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STEPS ── */}
      <section id="how" className="steps-bg py-24 max-md:py-16">
        <div className="max-w-[1240px] mx-auto px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-end mb-14">
            <div>
              <span className="eyebrow">{steps("eyebrow")}</span>
              <h2 className="mt-3.5 font-bold leading-[1.02]" style={{ fontFamily:"Poppins", fontSize:"clamp(32px, 4.2vw, 56px)" }}>{steps("title")}</h2>
            </div>
            <p className="text-[17px]">{steps("subtitle")}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {([
              { step:"STEP 01", tKey:"step1" as const, illus:<><rect x="18" y="6" width="28" height="52" rx="6"/><path d="M28 52h8"/><path d="M24 18h16M24 24h12M24 30h8"/></> },
              { step:"STEP 02", tKey:"step2" as const, illus:<><rect x="6" y="10" width="22" height="22" rx="4"/><rect x="36" y="10" width="22" height="22" rx="4"/><rect x="6" y="38" width="22" height="22" rx="4"/><rect x="36" y="38" width="22" height="22" rx="4" fill="currentColor" fillOpacity=".2"/></> },
              { step:"STEP 03", tKey:"step3" as const, illus:<><circle cx="32" cy="32" r="24"/><path d="M22 32l8 8 14-16"/></> },
            ] as const).map((s,i) => (
              <div key={i} className="step-card">
                <div className="font-bold text-[13px] tracking-[.14em] flex items-center gap-2.5" style={{ fontFamily:"Poppins", color:"var(--brand)" }}>
                  <span className="w-6 h-px bg-[var(--brand)]" />{s.step}
                </div>
                <h3 className="mt-4 text-[22px] font-semibold" style={{ fontFamily:"Poppins" }}>{steps(`${s.tKey}_title`)}</h3>
                <p className="mt-2.5 text-[15px]">{steps(`${s.tKey}_desc`)}</p>
                <div className="step-illus mt-5">
                  <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">{s.illus}</svg>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-24 max-md:py-16">
        <div className="max-w-[1240px] mx-auto px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-end mb-14">
            <div>
              <span className="eyebrow">{feat("eyebrow")}</span>
              <h2 className="mt-3.5 font-bold leading-[1.02]" style={{ fontFamily:"Poppins", fontSize:"clamp(32px, 4.2vw, 56px)" }}>{feat("title")}</h2>
            </div>
            <p className="text-[17px]">{feat("subtitle")}</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-5">
            {/* Tracking */}
            <div className="feature-card">
              <span className="eyebrow">{feat("tracking_label")}</span>
              <h3 className="mt-3.5 text-[28px] font-semibold leading-tight" style={{ fontFamily:"Poppins" }}>{feat("tracking_title")}</h3>
              <p className="mt-3 text-[15px] max-w-[460px]">{feat("tracking_desc")}</p>
              <div className="tracking-bg h-[280px] mt-6 relative">
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 280" preserveAspectRatio="none">
                  <defs><linearGradient id="routeGrad" x1="0" y1="1" x2="1" y2="0"><stop offset="0%" stopColor="#0F172A"/><stop offset="100%" stopColor="#EE335F"/></linearGradient></defs>
                  <path d="M 40 200 C 120 200, 140 120, 200 120 C 260 120, 280 70, 360 70" fill="none" stroke="url(#routeGrad)" strokeWidth="3" strokeLinecap="round"/>
                  <path d="M 40 200 C 120 200, 140 120, 200 120 C 260 120, 280 70, 360 70" fill="none" stroke="rgba(238,51,95,0.15)" strokeWidth="10" strokeLinecap="round"/>
                </svg>
                <div className="absolute w-4 h-4 rounded-full border-[3px] border-white shadow-lg z-[2]" style={{ background:"#0F172A", left:"8%", top:"72%" }} />
                <div className="absolute w-4 h-4 rounded-full border-[3px] border-white shadow-lg z-[2]" style={{ background:"var(--brand)", right:"8%", top:"26%" }} />
                <div className="rider-chip absolute left-1/2 top-[44%] -translate-x-1/2 rounded-[14px] px-3.5 py-2.5 flex items-center gap-2.5 text-xs z-[3]">
                  <div className="w-7 h-7 rounded-full" style={{ background:"linear-gradient(135deg, #FDE8EE, var(--brand))" }} />
                  <div>
                    <strong className="font-semibold">{feat("tracking_driver")}</strong>
                    <div><span className="font-bold" style={{ color:"var(--brand)" }}>{feat("tracking_eta")}</span> · 4.92 ★</div>
                  </div>
                </div>
              </div>
            </div>
            {/* Marketplace */}
            <div className="feature-card">
              <span className="eyebrow">{feat("market_label")}</span>
              <h3 className="mt-3.5 text-[28px] font-semibold leading-tight" style={{ fontFamily:"Poppins" }}>{feat("market_title")}</h3>
              <p className="mt-3 text-[15px] max-w-[460px]">{feat("market_desc")}</p>
              <div className="flex flex-col gap-2.5 mt-5">
                {[
                  { letter:"P", name:"Pizza Della Casa", info:"15-25 min · 1.2 km", tag:"-25%", muted:false, av:"" },
                  { letter:"G", name:"Galaxy Burger", info:"20-30 min · 0.8 km", tag:"Free delivery", muted:true, av:"b1" },
                  { letter:"A", name:"Atlas Pharmacy", info:"10 min · 0.5 km", tag:"24/7", muted:true, av:"b2" },
                  { letter:"C", name:"Carrefour Market", info:"30-45 min · 2.1 km", tag:"New", muted:false, av:"b3" },
                ].map((m,i) => {
                  const avColors: Record<string, string> = { "":"linear-gradient(135deg, #FDE8EE, #FF6C90)", b1:"linear-gradient(135deg, #FEF3C7, #F59E0B)", b2:"linear-gradient(135deg, #DBEAFE, #3B82F6)", b3:"linear-gradient(135deg, #D1FAE5, #10B981)" };
                  const avText: Record<string, string> = { "":"#971B3A", b1:"#92400E", b2:"#1E3A8A", b3:"#064E3B" };
                  return (
                    <div key={i} className="merch-row flex items-center gap-3 p-3 rounded-[14px]">
                      <div className="w-[38px] h-[38px] rounded-[10px] flex-shrink-0 grid place-items-center font-bold text-sm" style={{ fontFamily:"Poppins", background:avColors[m.av], color:avText[m.av] }}>{m.letter}</div>
                      <div className="flex-1 text-[13px]">
                        <strong className="font-semibold block" style={{ color:"var(--ink)" }}>{m.name}</strong>
                        <span className="text-xs" style={{ color:"var(--ink-3)" }}>{m.info}</span>
                      </div>
                      <span className={`text-[11px] font-semibold px-2 py-1 rounded-md ${m.muted ? "border" : "text-white"}`}
                        style={m.muted ? { background:"var(--surface)", color:"var(--ink-2)", borderColor:"var(--line)" } : { background:"var(--brand)" }}>
                        {m.tag}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
            {/* Pay */}
            <div className="feature-card">
              <span className="eyebrow">{feat("pay_label")}</span>
              <h3 className="mt-3.5 text-[28px] font-semibold leading-tight" style={{ fontFamily:"Poppins" }}>{feat("pay_title")}</h3>
              <p className="mt-3 text-[15px] max-w-[460px]">{feat("pay_desc")}</p>
              <div className="paycard-bg mt-5 h-[220px] rounded-2xl text-white p-[22px] flex flex-col justify-between">
                <div>
                  <div className="text-[11px] tracking-[.14em] uppercase opacity-70">{feat("pay_balance")}</div>
                  <div className="text-4xl font-bold" style={{ fontFamily:"Poppins", letterSpacing:"-0.02em" }}>2,450 <span className="text-sm opacity-70 font-medium ms-1">DZD</span></div>
                </div>
                <div className="flex justify-between items-center text-xs opacity-85 relative z-[1]">
                  <div>•••• 4821</div>
                  <div className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold" style={{ background:"rgba(255,255,255,.14)" }}>{feat("pay_autotop")}</div>
                </div>
              </div>
            </div>
            {/* Safety */}
            <div className="feature-card">
              <span className="eyebrow">{feat("safety_label")}</span>
              <h3 className="mt-3.5 text-[28px] font-semibold leading-tight" style={{ fontFamily:"Poppins" }}>{feat("safety_title")}</h3>
              <p className="mt-3 text-[15px] max-w-[460px]">{feat("safety_desc")}</p>
              <div className="flex gap-2.5 mt-5 flex-wrap">
                {[feat("safety_verified"), feat("safety_share"), feat("safety_monitoring"), feat("safety_ratings")].map((p,i) => (
                  <span key={i} className="safety-pill inline-flex items-center gap-2 px-3 py-2 rounded-full text-[13px] font-medium" style={{ color:"var(--ink-2)" }}>
                    <svg className="w-3.5 h-3.5" style={{ color:"var(--brand)" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      {i===0 && <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>}
                      {i===1 && <><path d="M4 4h16v16H4z"/><path d="M4 4l8 8 8-8"/></>}
                      {i===2 && <><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></>}
                      {i===3 && <path d="M12 2l3 7h7l-5.5 4 2 7L12 16l-6.5 4 2-7L2 9h7z"/>}
                    </svg>
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── DRIVERS ── */}
      <section id="drivers" className="py-24 max-md:py-16">
        <div className="max-w-[1240px] mx-auto px-8">
          <div className="driver-bg grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-14 items-center p-14 max-md:p-9 rounded-[32px]">
            <div>
              <span className="eyebrow">{drv("eyebrow")}</span>
              <h2 className="mt-3.5 font-bold leading-[1.02]" style={{ fontFamily:"Poppins", fontSize:"clamp(28px, 3.6vw, 44px)" }}>{drv("title")}<br/>{drv("title2")}</h2>
              <p className="mt-4 text-[17px]">{drv("desc")}</p>
              <div className="grid grid-cols-2 gap-3 mt-7">
                <div className="driver-stat-card p-[22px] rounded-2xl">
                  <div className="text-[32px] font-bold" style={{ fontFamily:"Poppins", letterSpacing:"-0.02em", color:"var(--brand)" }}>{drv("stat1_num")}</div>
                  <div className="text-[13px] mt-1" style={{ color:"var(--ink-3)" }}>{drv("stat1_label")}</div>
                </div>
                <div className="driver-stat-card p-[22px] rounded-2xl">
                  <div className="text-[32px] font-bold" style={{ fontFamily:"Poppins", letterSpacing:"-0.02em", color:"var(--brand)" }}>{drv("stat2_num")}</div>
                  <div className="text-[13px] mt-1" style={{ color:"var(--ink-3)" }}>{drv("stat2_label")}</div>
                </div>
              </div>
              <div className="mt-7">
                <a href="#" className="btn-brand inline-flex items-center gap-2 h-11 px-[18px] rounded-xl text-sm font-semibold">
                  {drv("cta")}
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>
                </a>
              </div>
            </div>
            <div className="earnings-bg relative h-[360px] rounded-3xl p-7 overflow-hidden">
              <div className="flex justify-between items-center">
                <span className="eyebrow" style={{ color:"var(--ink-3)" }}>{drv("this_week")}</span>
                <span className="text-xs" style={{ color:"var(--ink-3)" }}>{drv("mon_sun")}</span>
              </div>
              <div className="text-[44px] font-bold mt-2" style={{ fontFamily:"Poppins", letterSpacing:"-0.02em" }}>12,840<span className="text-lg ms-1.5 font-medium" style={{ color:"var(--ink-3)" }}>DZD</span></div>
              <div className="absolute left-7 right-7 bottom-7 flex gap-2.5 items-end h-40">
                {[38,62,44,78,95,88,18].map((h,i) => (
                  <div key={i} className={`flex-1 rounded-t-md rounded-b-sm ${i===6 ? "bar-dim" : "bar-fill"}`} style={{ height:`${h}%` }} />
                ))}
              </div>
              <div className="absolute left-7 right-7 bottom-2 flex gap-2.5">
                {["M","T","W","T","F","S","S"].map((d,i) => (
                  <span key={i} className="flex-1 text-center text-[10px]" style={{ color:"var(--ink-3)" }}>{d}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── DOWNLOAD ── */}
      <section id="download" className="pb-24">
        <div className="max-w-[1240px] mx-auto px-8">
          <div className="download-bg text-white rounded-[32px] max-md:rounded-3xl p-[72px_64px] max-md:p-[48px_28px]">
            <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-10 items-center relative z-[1]">
              <div>
                <span className="eyebrow" style={{ color:"rgba(255,255,255,.7)" }}>{dl("eyebrow")}</span>
                <h2 className="mt-3.5 font-bold leading-[1.02] text-white" style={{ fontFamily:"Poppins", fontSize:"clamp(36px, 4.4vw, 56px)" }}>{dl("title")}</h2>
                <p className="mt-4 text-lg max-w-[480px]" style={{ color:"rgba(255,255,255,.85)" }}>{dl("desc")}</p>
                <div className="mt-7 flex gap-3 flex-wrap">
                  <a href="#" className="store-btn flex items-center gap-3 h-14 px-[22px] rounded-[14px] text-white">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 12.04c-.03-2.6 2.13-3.86 2.23-3.92-1.22-1.78-3.11-2.02-3.79-2.05-1.61-.16-3.14.95-3.96.95-.82 0-2.08-.93-3.42-.9-1.76.03-3.38 1.02-4.28 2.59-1.82 3.16-.47 7.84 1.31 10.41.87 1.26 1.91 2.67 3.27 2.62 1.32-.05 1.82-.85 3.41-.85 1.59 0 2.04.85 3.43.82 1.42-.03 2.32-1.28 3.18-2.55 1.01-1.46 1.42-2.88 1.44-2.95-.03-.01-2.76-1.06-2.79-4.17M14.55 4.45c.72-.87 1.21-2.09 1.08-3.29-1.04.04-2.3.69-3.05 1.56-.67.77-1.26 2.01-1.11 3.19 1.17.09 2.36-.59 3.08-1.46"/></svg>
                    <div><div className="text-[10px] opacity-70 tracking-wide uppercase leading-none">{dl("app_store_label")}</div><div className="text-[17px] font-semibold mt-0.5 leading-tight" style={{ fontFamily:"Poppins" }}>{dl("app_store")}</div></div>
                  </a>
                  <a href="#" className="store-btn flex items-center gap-3 h-14 px-[22px] rounded-[14px] text-white">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M3.609 1.814L13.792 12 3.609 22.186a.997.997 0 0 1-.609-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.196-3.198l2.732 1.583a1 1 0 0 1 0 1.716l-2.732 1.583L14.732 12l2.963-2.491zm-3.196-3.198L5.864 4.658l10.937 6.333-2.302 2.302z"/></svg>
                    <div><div className="text-[10px] opacity-70 tracking-wide uppercase leading-none">{dl("play_label")}</div><div className="text-[17px] font-semibold mt-0.5 leading-tight" style={{ fontFamily:"Poppins" }}>{dl("play_store")}</div></div>
                  </a>
                </div>
              </div>
              <div className="bg-white rounded-[22px] p-[22px] text-center shadow-[0_30px_60px_-20px_rgba(0,0,0,.4)]" style={{ color:"#0F172A" }}>
                <strong className="block text-sm font-bold mb-1" style={{ fontFamily:"Poppins" }}>{dl("scan")}</strong>
                <QrGrid />
                <p className="text-xs mt-3.5" style={{ color:"#64748B" }}>{dl("scan_hint")}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-16 pb-8 footer-border">
        <div className="max-w-[1240px] mx-auto px-8">
          <div className="grid grid-cols-2 lg:grid-cols-[1.4fr_repeat(4,1fr)] gap-8">
            <div className="col-span-2 lg:col-span-1">
              <a href="#" className="inline-flex items-center gap-2.5 font-bold text-lg" style={{ fontFamily:"Poppins", color:"var(--ink)" }}>
                <span className="brand-mark"><BlinkLogoSvg /></span>
                Blink
              </a>
              <p className="text-sm max-w-[320px] mt-3">{ft("tagline")}</p>
              <div className="flex gap-2 mt-5">
                {["Instagram","Facebook","X","TikTok"].map((s,i) => (
                  <a key={i} href="#" aria-label={s} className="social-icon w-9 h-9 rounded-full grid place-items-center">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      {i===0 && <><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/></>}
                      {i===1 && <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>}
                      {i===2 && <path d="M4 4l16 16M20 4L4 20"/>}
                      {i===3 && <path d="M9 12a3 3 0 1 0 6 0M12 3v18"/>}
                    </svg>
                  </a>
                ))}
              </div>
            </div>
            {[
              { title:ft("product"), links:[nav("rides"), nav("marketplace"), svc("courier_title").split(".")[0], ft("blink_pay")] },
              { title:ft("drivers_col"), links:[ft("drive_with"), ft("earnings_calc"), ft("driver_app"), ft("driver_hub")] },
              { title:ft("company"), links:[ft("about"), ft("careers"), nav("for_business"), ft("press")] },
              { title:ft("help"), links:[ft("support_center"), ft("safety"), ft("terms"), ft("privacy")] },
            ].map((col,i) => (
              <div key={i}>
                <h4 className="font-semibold text-[13px] mb-4" style={{ fontFamily:"Poppins", color:"var(--ink)" }}>{col.title}</h4>
                {col.links.map((l,j) => (
                  <a key={j} href="#" className="footer-link block py-1.5 text-sm">{l}</a>
                ))}
              </div>
            ))}
          </div>
          <div className="footer-border mt-12 pt-6 flex justify-between flex-wrap gap-4 text-xs" style={{ color:"var(--ink-3)" }}>
            <span>{ft("copyright")}</span>
            <span>{ft("made_with")}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

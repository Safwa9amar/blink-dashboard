// Home.jsx — Merchant Home (spec page 6)
function MerchantTopBar({ dues, onNotif, onLocation, onDues }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '4px 22px 14px', background: '#fff', flexShrink: 0,
    }}>
      <button onClick={onNotif} style={{ ...iconBtn, position: 'relative' }}>
        <Icon name="bell" size={24} color="var(--slate-700)" />
        <span style={{ position: 'absolute', top: -2, right: -2, width: 9, height: 9, borderRadius: 99, background: 'var(--blink-500)', border: '1.5px solid #fff' }} />
      </button>
      <button onClick={onDues} style={{ ...iconBtn, flexDirection: 'column', gap: 1, whiteSpace: 'nowrap' }}>
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 10.5, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--slate-500)' }}>Dues to Blink</span>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 21, color: 'var(--blink-500)', letterSpacing: '0.01em' }}>12,500 <span style={{ fontSize: 12.5 }}>DZD</span></span>
      </button>
      <button onClick={onLocation} style={iconBtn}>
        <Icon name="pin" size={24} color="var(--slate-700)" />
      </button>
    </div>
  );
}

function ActionTile({ icon, label, sub, onClick }) {
  return (
    <button onClick={onClick} style={{
      background: '#fff', border: '1px solid var(--gray-200)', borderRadius: 18,
      boxShadow: 'var(--shadow-md)', padding: '20px 18px', cursor: 'pointer',
      display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 14,
      textAlign: 'left', transition: 'transform .12s ease',
    }} onMouseDown={e => e.currentTarget.style.transform='scale(.97)'}
       onMouseUp={e => e.currentTarget.style.transform='scale(1)'}
       onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}>
      <div style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--blink-tint-200)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={26} color="var(--blink-500)" strokeWidth={2.1} />
      </div>
      <div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--slate-900)', letterSpacing: '0.01em' }}>{label}</div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 11.5, color: 'var(--slate-500)', marginTop: 3, lineHeight: 1.35 }}>{sub}</div>
      </div>
    </button>
  );
}

const NEWS = [
  { img: '../../assets/news-warehouse.png', tag: 'Network', title: 'Expanding Network: New Routes Added', body: "15 new delivery hubs across the northern region." },
  { img: '../../assets/news-fuel.png', tag: 'Offer', title: 'Fuel Surcharge Relief for Merchants', body: 'Registered stores earn diesel cashback this month.' },
  { img: '../../assets/news-policy.png', tag: 'Policy', title: 'Updated Settlement Policy', body: 'How monthly dues are calculated — explained.' },
];

function MerchantHome({ go, openSheet }) {
  return (
    <div style={{ flex: 1, overflowY: 'auto', background: 'var(--warm-bg)' }}>
      <MerchantTopBar dues="12,500" onDues={() => go('cash')} onNotif={() => go('notifications')} onLocation={() => openSheet('location')} />

      {/* Greeting hero */}
      <div style={{ margin: '6px 22px 0', borderRadius: 24, background: 'var(--grad-hero)', padding: '22px 24px', color: '#fff', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', width: 150, height: 150, borderRadius: 99, background: 'rgba(255,255,255,0.08)', right: -40, top: -50 }} />
        <div style={{ position: 'absolute', width: 70, height: 70, borderRadius: 99, background: 'rgba(255,255,255,0.07)', right: 50, bottom: -30 }} />
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, letterSpacing: '0.01em' }}>Hello, Karim</div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 13.5, opacity: 0.9, marginTop: 3 }}>Your stores are live today.</div>
        <div onClick={() => openSheet('switch')} style={{
          marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'rgba(255,255,255,0.14)', borderRadius: 14, padding: '12px 14px', cursor: 'pointer',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="store" size={20} color="#fff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14.5 }}>Karim Électro</span>
                <span style={{ fontSize: 9, fontWeight: 700, background: '#fff', color: 'var(--blink-700)', borderRadius: 99, padding: '2px 7px', letterSpacing: '0.04em' }}>PRIMARY</span>
              </div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, opacity: 0.85, marginTop: 1 }}>Bab Ezzouar, Algiers</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-body)' }}>
            Switch<Icon name="swap" size={16} color="#fff" />
          </div>
        </div>
      </div>

      {/* Action grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, padding: '20px 22px 4px' }}>
        <ActionTile icon="store" label="My Stores" sub="Products, stock & pricing" onClick={() => go('stores')} />
        <ActionTile icon="dashboard" label="Dashboard" sub="Sales & order KPIs" onClick={() => go('dashboard')} />
        <ActionTile icon="strategy" label="Strategy" sub="Insights to grow sales" onClick={() => openSheet('soon')} />
        <ActionTile icon="swap" label="Switch Store" sub="2 stores · manage" onClick={() => openSheet('switch')} />
      </div>

      {/* Blink News */}
      <div style={{ padding: '22px 0 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 22px 14px' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--slate-900)', letterSpacing: '0.02em' }}>Blink News</span>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: 'var(--blink-500)' }}>View All</span>
        </div>
        <div style={{ display: 'flex', gap: 14, overflowX: 'auto', padding: '0 22px 8px', scrollbarWidth: 'none' }}>
          {NEWS.map((n, i) => (
            <div key={i} style={{ flex: '0 0 230px', borderRadius: 16, background: '#fff', border: '1px solid var(--gray-200)', boxShadow: 'var(--shadow-md)', overflow: 'hidden' }}>
              <div style={{ height: 116, background: `url(${n.img}) center/cover`, position: 'relative' }}>
                <span style={{ position: 'absolute', top: 10, left: 10, fontSize: 10, fontWeight: 700, background: 'rgba(255,255,255,0.92)', color: 'var(--blink-500)', borderRadius: 99, padding: '3px 9px', letterSpacing: '0.04em' }}>{n.tag}</span>
              </div>
              <div style={{ padding: '12px 14px 16px' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--slate-900)', lineHeight: 1.25 }}>{n.title}</div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 11.5, color: 'var(--slate-500)', marginTop: 5, lineHeight: 1.4 }}>{n.body}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ height: 110 }} />
    </div>
  );
}

Object.assign(window, { MerchantHome, ActionTile, MerchantTopBar, NEWS });

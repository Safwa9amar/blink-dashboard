// Earnings.jsx — Merchant Earnings (spec page 8)
const { useState: useStateE } = React;

function Collapsible({ icon, iconBg, iconColor, title, open, onToggle, children }) {
  return (
    <div style={{ background: '#fff', borderRadius: 18, boxShadow: 'var(--shadow-md)', overflow: 'hidden' }}>
      <button onClick={onToggle} style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 13, padding: '16px 18px',
        background: 'none', border: 'none', cursor: 'pointer',
      }}>
        <div style={{ width: 40, height: 40, borderRadius: 11, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={icon} size={21} color={iconColor} />
        </div>
        <span style={{ flex: 1, textAlign: 'left', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16.5, color: 'var(--slate-900)', letterSpacing: '0.01em' }}>{title}</span>
        <Icon name={open ? 'chevronUp' : 'chevronDown'} size={22} color="var(--slate-400)" />
      </button>
      {open && <div style={{ padding: '0 18px 16px' }}>{children}</div>}
    </div>
  );
}

function Row({ label, value, color = 'var(--slate-900)', strong }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 0', borderTop: strong ? '1px solid var(--slate-200)' : 'none' }}>
      <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: strong ? 700 : 400, color: strong ? 'var(--slate-900)' : 'var(--slate-600)' }}>{label}</span>
      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: strong ? 16 : 14.5, color, whiteSpace: 'nowrap' }}>{value}</span>
    </div>
  );
}

const OPS = [
  { icon: 'cash', title: 'Sale · Order #4821', time: 'Today · 14:20', amt: '+2,450.00', status: 'Completed' },
  { icon: 'gift', title: 'Challenge Bonus', time: 'Yesterday · 18:05', amt: '+1,200.00', status: 'Completed' },
  { icon: 'withdrawOut', title: 'Dues Payment', time: '24 Oct · 11:45', amt: '−3,000.00', status: 'Completed', debit: true },
];

function MerchantEarnings({ go, openSheet }) {
  const [hide, setHide] = useStateE(false);
  const [g, setG] = useStateE(true);
  const [c, setC] = useStateE(false);
  return (
    <div style={{ flex: 1, overflowY: 'auto', background: 'var(--warm-bg)' }}>
      <TopBar title="Earnings" titlePink right={<button style={iconBtn}><Icon name="refresh" size={22} color="var(--slate-500)" /></button>} />

      <div style={{ padding: '18px 22px 0' }}>
        {/* Hero */}
        <div style={{ borderRadius: 24, background: 'var(--grad-hero)', padding: '20px 22px', color: '#fff', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button onClick={() => openSheet('period')} style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,0.16)', border: 'none', color: '#fff', borderRadius: 99, padding: '8px 14px', cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13.5 }}>
              <Icon name="calendar" size={16} color="#fff" />This Month<Icon name="chevronDown" size={15} color="#fff" />
            </button>
            <button onClick={() => setHide(h => !h)} style={iconBtn}><Icon name={hide ? 'eyeOff' : 'eye'} size={22} color="#fff" /></button>
          </div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, opacity: 0.9, marginTop: 18 }}>Net Income</div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 38, letterSpacing: '0.01em', lineHeight: 1.1 }}>
            {hide ? '••••••' : '186,400'} <span style={{ fontSize: 19, opacity: 0.85 }}>DZD</span>
          </div>
          <button onClick={() => openSheet('scope')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 8, background: 'rgba(0,0,0,0.14)', border: 'none', color: '#fff', borderRadius: 99, padding: '5px 12px', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>
            <Icon name="store" size={14} color="#fff" />All Stores<Icon name="chevronDown" size={13} color="#fff" />
          </button>
          <div style={{ marginTop: 18, background: 'rgba(255,255,255,0.001)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 16, display: 'flex' }}>
            <Stat icon="cash" label="SALES TXNS" value="248" />
            <div style={{ width: 1, background: 'rgba(255,255,255,0.2)', margin: '14px 0' }} />
            <Stat icon="dashboard" label="ITEMS SOLD" value="612" />
          </div>
        </div>

        {/* Gross income */}
        <div style={{ marginTop: 18 }}>
          <Collapsible icon="dashboard" iconBg="var(--credit-bg)" iconColor="var(--credit)" title="Gross Income" open={g} onToggle={() => setG(v => !v)}>
            <Row label="Income from sales" value="201,000 DZD" />
            <Row label="Income from discounts" value="+4,800 DZD" color="var(--credit)" />
            <Row label="Income from challenges" value="+1,200 DZD" color="var(--credit)" />
            <Row label="Total Gross" value="207,000 DZD" color="var(--blink-500)" strong />
          </Collapsible>
        </div>

        {/* Commissions & taxes */}
        <div style={{ marginTop: 14 }}>
          <Collapsible icon="file" iconBg="var(--blink-tint-200)" iconColor="var(--blink-500)" title="Commissions & Taxes" open={c} onToggle={() => setC(v => !v)}>
            <Row label="Blink commissions" value="−18,600 DZD" color="var(--blink-600)" />
            <Row label="Tax stamp fees" value="−2,000 DZD" color="var(--blink-600)" />
            <Row label="Total" value="−20,600 DZD" color="var(--slate-900)" strong />
          </Collapsible>
        </div>

        {/* Recent operations */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '24px 0 8px' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--slate-900)', letterSpacing: '0.02em' }}>Recent Operations</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 2, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: 'var(--blink-500)' }}>See All <Icon name="chevronRight" size={15} color="var(--blink-500)" /></span>
        </div>
        {OPS.map((o, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '13px 0', borderBottom: i < OPS.length - 1 ? '1px solid var(--slate-100)' : 'none' }}>
            <div style={{ width: 44, height: 44, borderRadius: 99, background: 'var(--blink-tint-200)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name={o.icon} size={20} color="var(--blink-500)" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14.5, color: 'var(--slate-900)' }}>{o.title}</div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--slate-500)', marginTop: 2 }}>{o.time}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15.5, color: o.debit ? 'var(--blink-600)' : 'var(--credit)' }}>{o.amt}</div>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 10, color: 'var(--credit)', background: 'var(--credit-bg)', borderRadius: 99, padding: '2px 8px', letterSpacing: '0.04em', display: 'inline-block', marginTop: 3 }}>{o.status}</span>
            </div>
          </div>
        ))}
      </div>
      <div style={{ height: 110 }} />
    </div>
  );
}

function Stat({ icon, label, value }) {
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 11, padding: '14px 16px' }}>
      <div style={{ width: 36, height: 36, borderRadius: 99, background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={17} color="#fff" />
      </div>
      <div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', opacity: 0.85 }}>{label}</div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18 }}>{value}</div>
      </div>
    </div>
  );
}

Object.assign(window, { MerchantEarnings, Collapsible });

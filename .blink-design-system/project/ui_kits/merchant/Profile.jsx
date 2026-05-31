// Profile.jsx — Merchant Profile hub (spec page 7) + My Profile form
const { useState: useStateP } = React;

function Avatar({ size = 110, pct = 100 }) {
  const r = size / 2 - 4;
  const circ = 2 * Math.PI * r;
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--slate-200)" strokeWidth="4" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--blink-500)" strokeWidth="4" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ * (1 - pct/100)} />
      </svg>
      <div style={{ position: 'absolute', inset: 8, borderRadius: 99, background: 'var(--blink-tint-100)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: size * 0.34, color: 'var(--blink-500)' }}>K</span>
      </div>
      <span style={{ position: 'absolute', bottom: -4, left: '50%', transform: 'translateX(-50%)', background: 'var(--blink-500)', color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11, borderRadius: 99, padding: '2px 10px', whiteSpace: 'nowrap' }}>{pct}%</span>
    </div>
  );
}

function KPI({ value, label, star }) {
  return (
    <div style={{ flex: 1, background: '#fff', border: '1px solid var(--gray-200)', borderRadius: 16, boxShadow: 'var(--shadow-sm)', padding: '14px 10px', textAlign: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 17, color: 'var(--blink-500)' }}>
        {star && <Icon name="star" size={15} color="var(--blink-500)" fill="var(--blink-500)" />}{value}
      </div>
      <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--slate-500)', marginTop: 4 }}>{label}</div>
    </div>
  );
}

const MENU = [
  { icon: 'user', label: 'My Profile', sub: 'Personal info & documents', to: 'myprofile' },
  { icon: 'store', label: 'My Stores', sub: '2 stores · documents', to: 'stores' },
  { icon: 'wallet', label: 'Blink Cash & Dues', sub: 'Pay what you owe Blink', to: 'cash' },
  { icon: 'gift', label: 'Challenges', sub: 'Earn rewards & bonuses', to: 'soon' },
  { icon: 'shield', label: 'Merchant Benefits', sub: 'Partner offers & discounts', to: 'soon' },
  { icon: 'help', label: 'Help & Support', sub: 'Help center & privacy', to: 'soon' },
  { icon: 'settings', label: 'Settings', sub: 'Language, account, logout', to: 'soon' },
];

function MerchantProfile({ go, openSheet }) {
  return (
    <div style={{ flex: 1, overflowY: 'auto', background: 'var(--warm-bg)' }}>
      <TopBar title="Profile" right={<button style={iconBtn} onClick={() => openSheet('soon')}><Icon name="settings" size={21} color="var(--slate-500)" /></button>} />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 22px 4px' }}>
        <Avatar />
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 23, color: 'var(--slate-900)', marginTop: 14 }}>Karim Benali</div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--slate-500)', marginTop: 2 }}>Bab Ezzouar, Algiers · +213 555 123 456</div>
      </div>
      <div style={{ display: 'flex', gap: 12, padding: '18px 22px 6px' }}>
        <KPI value="1.2M da" label="Total Sales" />
        <KPI value="4.8" label="Rating" star />
        <KPI value="3 yrs" label="With Blink" />
      </div>
      <div style={{ padding: '12px 22px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {MENU.map((m, i) => (
          <button key={i} onClick={() => go(m.to)} style={{
            display: 'flex', alignItems: 'center', gap: 14, background: '#fff', border: '1px solid var(--gray-200)',
            borderRadius: 16, padding: '14px 16px', cursor: 'pointer', boxShadow: 'var(--shadow-sm)', textAlign: 'left',
          }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--blink-tint-200)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name={m.icon} size={21} color="var(--blink-500)" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--slate-900)' }}>{m.label}</div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 11.5, color: 'var(--slate-500)', marginTop: 1 }}>{m.sub}</div>
            </div>
            <Icon name="chevronRight" size={20} color="var(--slate-300)" />
          </button>
        ))}
        <button onClick={() => openSheet('logout')} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'var(--blink-tint-50)', border: '1px solid var(--blink-tint-100)',
          borderRadius: 16, padding: '15px', cursor: 'pointer', marginTop: 2, color: 'var(--blink-600)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15,
        }}>
          <Icon name="logout" size={19} color="var(--blink-600)" />Log Out
        </button>
      </div>
      <div style={{ height: 110 }} />
    </div>
  );
}

// ---- My Profile : Overview form ----
function Field({ label, value, icon, chevron }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--slate-500)', marginBottom: 7 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fff', border: '1px solid var(--gray-300)', borderRadius: 14, padding: '14px 16px' }}>
        <span style={{ flex: 1, fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--slate-900)' }}>{value}</span>
        {icon && <Icon name={icon} size={18} color="var(--slate-400)" />}
        {chevron && <Icon name="chevronDown" size={18} color="var(--slate-400)" />}
      </div>
    </div>
  );
}

function MyProfileForm({ go }) {
  const [tab, setTab] = useStateP('overview');
  return (
    <div style={{ flex: 1, overflowY: 'auto', background: 'var(--warm-bg)', display: 'flex', flexDirection: 'column' }}>
      <TopBar title="My Profile" onBack={() => go('profile')} />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 22px 0' }}>
        <Avatar size={92} />
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 21, color: 'var(--slate-900)', marginTop: 12 }}>Karim Benali</div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--slate-500)' }}>+213 555 123 456</div>
      </div>
      {/* toggle */}
      <div style={{ display: 'flex', background: 'var(--slate-100)', borderRadius: 99, padding: 4, margin: '18px 22px' }}>
        {['overview', 'documents'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, border: 'none', borderRadius: 99, padding: '11px', cursor: 'pointer',
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, textTransform: 'capitalize',
            background: tab === t ? '#fff' : 'transparent', color: tab === t ? 'var(--blink-500)' : 'var(--slate-500)',
            boxShadow: tab === t ? 'var(--shadow-sm)' : 'none',
          }}>{t}</button>
        ))}
      </div>
      <div style={{ padding: '0 22px', flex: 1 }}>
        {tab === 'overview' ? (
          <>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--slate-500)', marginBottom: 7 }}>Merchant ID</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--blink-tint-100)', borderRadius: 99, padding: '14px 20px', marginBottom: 16 }}>
              <span style={{ flex: 1, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: 'var(--slate-900)' }}>BK-7741</span>
              <Icon name="copy" size={18} color="var(--blink-500)" />
            </div>
            <Field label="Full Name" value="Karim Benali" />
            <Field label="Email Address" value="karim.b@blink.dz" />
            <Field label="Date of Birth" value="05 / 12 / 1990" icon="calendar" />
            <Field label="Wilaya" value="Algiers (16)" chevron />
            <Field label="Bank RIB (Algérie Poste / Bank)" value="007 99999 0001234567 89" />
          </>
        ) : (
          <DocumentsForm />
        )}
      </div>
      <div style={{ padding: '12px 22px 26px', background: 'var(--warm-bg)', position: 'sticky', bottom: 0 }}>
        <button className="blink-btn blink-btn--primary" style={{ width: '100%' }}>Save Changes</button>
      </div>
    </div>
  );
}

function DocumentsForm() {
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--credit-bg)', borderRadius: 14, padding: '13px 16px', marginBottom: 18 }}>
        <Icon name="check" size={18} color="var(--credit)" />
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13.5, color: 'var(--credit)' }}>Approved · documents verified</span>
      </div>
      {['Commercial Register — Front', 'Commercial Register — Back'].map((d, i) => (
        <div key={i} style={{ marginBottom: 14 }}>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--slate-500)', marginBottom: 7 }}>{d}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#fff', border: '1.5px dashed var(--gray-300)', borderRadius: 14, padding: '18px 16px' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--blink-tint-100)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="file" size={20} color="var(--blink-500)" /></div>
            <span style={{ flex: 1, fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--slate-500)' }}>register_{i+1}.jpg uploaded</span>
            <Icon name="check" size={20} color="var(--credit)" />
          </div>
        </div>
      ))}
      <Field label="NIF" value="0998 7766 5544 332" />
      <Field label="NIS" value="0011 2233 4455 667" />
    </>
  );
}

Object.assign(window, { MerchantProfile, MyProfileForm, Avatar, KPI });

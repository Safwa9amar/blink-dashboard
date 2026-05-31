// app.jsx — Merchant UI kit shell: phone frame + router + sheets
const { useState: useApp } = React;

const NAV_PARENT = { stores: 'profile', myprofile: 'profile', dashboard: 'home', notifications: 'home' };

function Notifications({ go }) {
  const items = [
    { i: 'cash', t: 'Payout settled', d: 'Your weekly payout of 64,200 DZD was sent.', time: '2h', unread: true },
    { i: 'alert', t: 'Dues reminder', d: 'You owe 12,500 DZD to Blink this month.', time: '5h', unread: true },
    { i: 'gift', t: 'New challenge available', d: 'Sell 300 items this week for a 5,000 DZD bonus.', time: '1d' },
    { i: 'bell', t: 'Blink News', d: 'Updated settlement policy — read more.', time: '2d' },
  ];
  return (
    <div style={{ flex: 1, overflowY: 'auto', background: 'var(--warm-bg)' }}>
      <TopBar title="Notifications" onBack={() => go('home')} />
      <div style={{ padding: '14px 22px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.map((x, i) => (
          <div key={i} style={{ display: 'flex', gap: 13, background: '#fff', border: '1px solid var(--gray-200)', borderRadius: 16, padding: '14px 16px', boxShadow: 'var(--shadow-sm)', position: 'relative' }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--blink-tint-200)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name={x.i} size={20} color="var(--blink-500)" /></div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14.5, color: 'var(--slate-900)' }}>{x.t}</span>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--slate-400)' }}>{x.time}</span>
              </div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 12.5, color: 'var(--slate-500)', marginTop: 3, lineHeight: 1.4 }}>{x.d}</div>
            </div>
            {x.unread && <span style={{ position: 'absolute', top: 14, right: 14, width: 8, height: 8, borderRadius: 99, background: 'var(--blink-500)' }} />}
          </div>
        ))}
      </div>
      <div style={{ height: 110 }} />
    </div>
  );
}

function SoonContent({ label, onClose }) {
  return (
    <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
      <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--blink-tint-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}><Icon name="clock" size={26} color="var(--blink-500)" /></div>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, color: 'var(--slate-900)' }}>Not in this kit yet</div>
      <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--slate-500)', margin: '6px 0 18px' }}>This screen is specced but not built in this UI kit demo.</div>
      <button onClick={onClose} className="blink-btn blink-btn--secondary" style={{ width: '100%' }}>Got it</button>
    </div>
  );
}

function SwitchContent({ onClose }) {
  const stores = [{ n: 'Karim Électro', a: 'Bab Ezzouar', p: true }, { n: 'Karim Mobile', a: 'Rouiba' }];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {stores.map((s, i) => (
        <button key={i} onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: 13, background: s.p ? 'var(--blink-tint-50)' : '#fff', border: `1.5px solid ${s.p ? 'var(--blink-500)' : 'var(--gray-200)'}`, borderRadius: 14, padding: '14px 16px', cursor: 'pointer', textAlign: 'left' }}>
          <div style={{ width: 42, height: 42, borderRadius: 11, background: 'var(--blink-tint-200)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="store" size={20} color="var(--blink-500)" /></div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--slate-900)' }}>{s.n}</span>
              {s.p && <span style={{ fontSize: 9, fontWeight: 700, background: 'var(--blink-500)', color: '#fff', borderRadius: 99, padding: '2px 7px' }}>PRIMARY</span>}
            </div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--slate-500)', marginTop: 1 }}>{s.a}</div>
          </div>
          {s.p && <Icon name="check" size={20} color="var(--blink-500)" />}
        </button>
      ))}
    </div>
  );
}

function LocationContent({ onClose }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--slate-50)', borderRadius: 14, padding: '14px 16px', marginBottom: 12 }}>
        <Icon name="pin" size={20} color="var(--blink-500)" />
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 10.5, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--slate-500)' }}>Current location</div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14, color: 'var(--slate-900)' }}>Bab Ezzouar, Algiers</div>
        </div>
      </div>
      <button onClick={onClose} className="blink-btn blink-btn--secondary" style={{ width: '100%', marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><Icon name="navigate" size={18} color="var(--slate-900)" />Change Location</button>
      <button onClick={onClose} className="blink-btn blink-btn--primary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><Icon name="plus" size={18} color="#fff" />Add Another Address</button>
    </div>
  );
}

function LogoutContent({ onClose }) {
  return (
    <div style={{ textAlign: 'center', padding: '4px 0' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--slate-900)' }}>Log out of Blink?</div>
      <div style={{ fontFamily: 'var(--font-body)', fontSize: 13.5, color: 'var(--slate-500)', margin: '8px 0 18px' }}>You'll need your phone number to sign back in.</div>
      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={onClose} className="blink-btn blink-btn--secondary" style={{ flex: 1 }}>Cancel</button>
        <button onClick={onClose} className="blink-btn blink-btn--primary" style={{ flex: 1 }}>Log Out</button>
      </div>
    </div>
  );
}

const SIMPLE = { period: 'Select Period', scope: 'Store Scope', pay: 'Pay Dues' };

function App() {
  const [screen, setScreen] = useApp('home');
  const [sheet, setSheet] = useApp(null);
  const go = (s) => { setSheet(null); setScreen(s); };
  const openSheet = (s) => setSheet(s);
  const close = () => setSheet(null);
  const navActive = NAV_PARENT[screen] || screen;

  const screens = {
    home: <MerchantHome go={go} openSheet={openSheet} />,
    earnings: <MerchantEarnings go={go} openSheet={openSheet} />,
    profile: <MerchantProfile go={go} openSheet={openSheet} />,
    cash: <BlinkCash go={go} openSheet={openSheet} />,
    stores: <MyStores go={go} openSheet={openSheet} />,
    dashboard: <Dashboard go={go} />,
    myprofile: <MyProfileForm go={go} />,
    notifications: <Notifications go={go} />,
  };

  const sheetTitle = sheet === 'switch' ? 'Switch Store' : sheet === 'location' ? 'Store Location' : sheet === 'pay' ? 'Pay Dues' : SIMPLE[sheet] || null;

  return (
    <div className="phone">
      <StatusBar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
        {screens[screen]}
      </div>
      <BottomNav active={navActive} onNav={go} />
      <Sheet open={!!sheet} onClose={close} title={sheetTitle}>
        {sheet === 'pay' && <PaySheetContent onClose={close} />}
        {sheet === 'switch' && <SwitchContent onClose={close} />}
        {sheet === 'location' && <LocationContent onClose={close} />}
        {sheet === 'logout' && <LogoutContent onClose={close} />}
        {(sheet === 'period' || sheet === 'scope') && <ScopeContent kind={sheet} onClose={close} />}
        {sheet === 'soon' && <SoonContent onClose={close} />}
      </Sheet>
    </div>
  );
}

function ScopeContent({ kind, onClose }) {
  const opts = kind === 'period'
    ? ['Today', 'This Week', 'This Month', 'This Year']
    : ['All Stores', 'Karim Électro', 'Karim Mobile'];
  const sel = kind === 'period' ? 'This Month' : 'All Stores';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {opts.map((o, i) => (
        <button key={i} onClick={onClose} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: o === sel ? 'var(--blink-tint-50)' : '#fff', border: `1px solid ${o === sel ? 'var(--blink-300)' : 'var(--gray-200)'}`, borderRadius: 14, padding: '15px 16px', cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: o === sel ? 'var(--blink-500)' : 'var(--slate-900)' }}>
          {o}{o === sel && <Icon name="check" size={20} color="var(--blink-500)" />}
        </button>
      ))}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);

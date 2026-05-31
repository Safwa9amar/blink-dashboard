// dash.jsx — Settings view + Sidebar + App shell
const { useState } = React;

function Field({ label, hint, children }) {
  return (
    <div className="s-field">
      <div className="lbl"><b>{label}</b>{hint && <span>{hint}</span>}</div>
      {children}
    </div>
  );
}
function Toggle({ on, onClick }) { return <button className={`toggle ${on ? 'on' : ''}`} onClick={onClick}><span className="knob"></span></button>; }

function Settings({ theme, setTheme }) {
  const [tab, setTab] = useState('general');
  const [tg, setTg] = useState({ email_order: true, email_rider: true, dispute: true, push_order: false, push_promo: true, twofa: false });
  const flip = k => setTg(s => ({ ...s, [k]: !s[k] }));
  const tabs = [['general','General'],['fees','Fees & Commission'],['notifications','Notifications'],['security','Security'],['appearance','Appearance']];
  return (
    <div>
      <PageHeader title="Settings" description="Manage your platform configuration" actions={<button className="btn btn--primary">Save Changes</button>} />
      <div className="settings-tabs">{tabs.map(([id,l]) => <button key={id} className={`s-tab ${tab===id?'active':''}`} onClick={() => setTab(id)}>{l}</button>)}</div>
      <Card title={tabs.find(t=>t[0]===tab)[1]} description={{
        general:'Platform name, contact, and basic configuration', fees:'Configure delivery fees, service charges, and commission rates',
        notifications:'Configure email and push notification preferences', security:'Password, sessions, and access control',
        appearance:'Theme, language, and display preferences'}[tab]}>
        {tab === 'general' && <>
          <Field label="Platform Name"><input className="s-input" defaultValue="Blink" /></Field>
          <Field label="Support Email"><input className="s-input" defaultValue="support@blink.dz" /></Field>
          <Field label="Support Phone"><input className="s-input" defaultValue="+213 555 000 000" /></Field>
          <Field label="Currency"><input className="s-input" defaultValue="DZD (DA)" /></Field>
          <Field label="Default Language"><div className="seg"><button className="on">EN</button><button>FR</button><button>AR</button></div></Field>
        </>}
        {tab === 'fees' && <>
          <Field label="Base Delivery Fee" hint="Charged per delivery order"><input className="s-input" defaultValue="150 DA" /></Field>
          <Field label="Service Fee (%)"><input className="s-input" defaultValue="5" /></Field>
          <Field label="Rider Commission (%)"><input className="s-input" defaultValue="18" /></Field>
          <Field label="Agent Commission (%)"><input className="s-input" defaultValue="2" /></Field>
          <Field label="Minimum Order Amount"><input className="s-input" defaultValue="500 DA" /></Field>
          <Field label="Free Delivery Threshold"><input className="s-input" defaultValue="3000 DA" /></Field>
        </>}
        {tab === 'notifications' && <>
          <Field label="Email on new order"><Toggle on={tg.email_order} onClick={() => flip('email_order')} /></Field>
          <Field label="Email on new rider signup"><Toggle on={tg.email_rider} onClick={() => flip('email_rider')} /></Field>
          <Field label="Email on dispute filed"><Toggle on={tg.dispute} onClick={() => flip('dispute')} /></Field>
          <Field label="Push order status updates"><Toggle on={tg.push_order} onClick={() => flip('push_order')} /></Field>
          <Field label="Push promotional notifications"><Toggle on={tg.push_promo} onClick={() => flip('push_promo')} /></Field>
        </>}
        {tab === 'security' && <>
          <Field label="Current Password"><input className="s-input" type="password" defaultValue="password" /></Field>
          <Field label="New Password"><input className="s-input" type="password" placeholder="••••••••" /></Field>
          <Field label="Confirm Password"><input className="s-input" type="password" placeholder="••••••••" /></Field>
          <Field label="Session Timeout (minutes)"><input className="s-input" defaultValue="30" /></Field>
          <Field label="Require Two-Factor Authentication" hint="Recommended for all admins"><Toggle on={tg.twofa} onClick={() => flip('twofa')} /></Field>
        </>}
        {tab === 'appearance' && <>
          <Field label="Theme" hint="Dark is the platform default">
            <div className="seg"><button className={theme==='dark'?'on':''} onClick={() => setTheme('dark')}>Dark</button><button className={theme==='light'?'on':''} onClick={() => setTheme('light')}>Light</button></div>
          </Field>
          <Field label="Language"><div className="seg"><button className="on">EN</button><button>FR</button><button>AR</button></div></Field>
          <Field label="Date Format"><input className="s-input" defaultValue="DD / MM / YYYY" /></Field>
          <Field label="Rows Per Page"><input className="s-input" defaultValue="50" /></Field>
        </>}
      </Card>
    </div>
  );
}

const NAV_GROUPS = [
  ['Operations', [
    ['overview','Overview','grid'], ['demand','Demand','trending'], ['live_ops','Live Ops','activity'],
    ['orders','Orders','package'], ['trips','Trips','map'],
  ]],
  ['People', [
    ['users','Users','users'], ['riders','Riders','bike'], ['verification','Verification','shield'],
  ]],
  ['Commerce', [
    ['agent_shops','Agent Shops','store'], ['promotions','Promotions','gift'], ['coupons','Coupons','ticket'], ['news','Blink News','newspaper'],
  ]],
  ['Money', [
    ['transactions','Transactions','card'], ['blink_cash','Blink Cash','wallet'],
  ]],
  ['Comms & System', [
    ['support','Support','support'], ['notifications','Notifications','bell'], ['settings','Settings','settings2'],
  ]],
];

function Sidebar({ route, go, theme, setTheme }) {
  const [q, setQ] = useState('');
  const query = q.trim().toLowerCase();
  return (
    <aside className="sidebar">
      <div className="sb-head">
        <div className="sb-logo"><BMark color="#fff" /></div>
        <div><h1>Blink</h1><p>Admin Dashboard</p></div>
      </div>
      <div className="sb-search">
        <DIcon name="search" style={{ width: 16, height: 16 }} />
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search menu…" />
        {q && <button className="sb-clear" onClick={() => setQ('')}><DIcon name="x" style={{ width: 14, height: 14 }} /></button>}
      </div>
      <nav className="sb-nav">
        {NAV_GROUPS.map(([group, items]) => {
          const shown = items.filter(([id, lbl]) => !query || lbl.toLowerCase().includes(query) || group.toLowerCase().includes(query));
          if (!shown.length) return null;
          return (
            <div className="sb-group" key={group}>
              <div className="sb-group-label">{group}</div>
              {shown.map(([id, lbl, icon]) => (
                <button key={id} className={`sb-link ${route === id ? 'active' : ''}`} onClick={() => go(id)}>
                  <DIcon name={icon} style={{ width: 20, height: 20 }} />{lbl}
                </button>
              ))}
            </div>
          );
        })}
        {query && !NAV_GROUPS.some(([g, items]) => items.some(([id, lbl]) => lbl.toLowerCase().includes(query) || g.toLowerCase().includes(query))) && (
          <div className="sb-empty">No menu items match “{q}”.</div>
        )}
      </nav>
      <div className="sb-foot">
        <div className="sb-foot-row">
          <span>Theme</span>
          <div className="sb-toggles">
            <button className="icon-btn" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} title="Toggle theme">
              <DIcon name={theme === 'dark' ? 'sun' : 'moon'} style={{ width: 16, height: 16 }} />
            </button>
          </div>
        </div>
        <button className="signout"><DIcon name="logout" style={{ width: 20, height: 20 }} />Sign out</button>
      </div>
    </aside>
  );
}

function App() {
  const [route, setRoute] = useState('overview');
  const [theme, setThemeState] = useState('dark');
  const setTheme = (t) => { setThemeState(t); document.documentElement.setAttribute('data-theme', t); };
  const go = (r) => { setRoute(r); window.scrollTo(0, 0); };
  const views = {
    overview: <Overview />, demand: <Demand />, users: <Users />, riders: <Riders />, orders: <Orders />,
    trips: <Trips />, transactions: <Transactions />, agent_shops: <AgentShops />,
    finance: <BlinkCash />, blink_cash: <BlinkCash />, promotions: <Promotions />, coupons: <Coupons />, verification: <Verification />,
    news: <BlinkNews />,
    support: <Support />, live_ops: <LiveOps />,
    notifications: <Notifications />, settings: <Settings theme={theme} setTheme={setTheme} />,
  };
  return (
    <div className="layout">
      <Sidebar route={route} go={go} theme={theme} setTheme={setTheme} />
      <main className="dash-main">{views[route]}</main>
    </div>
  );
}

document.documentElement.setAttribute('data-theme', 'dark');
ReactDOM.createRoot(document.getElementById('root')).render(<App />);

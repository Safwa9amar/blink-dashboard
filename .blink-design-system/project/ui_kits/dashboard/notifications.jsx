// notifications.jsx — Notifications management: campaigns · compose (create→send) · templates · segments
const { useState: useNotif } = React;

const N_ROLES = ['All', 'Customer', 'Rider', 'Merchant', 'Agent'];
const N_ROLE_VARIANT = { Customer:'info', Rider:'success', Merchant:'primary', Agent:'warning', All:'default' };
const CHANNELS = [['push','Push','bell'],['inapp','In-app','chat'],['email','Email','mail'],['sms','SMS','support']];
const SEGMENTS = ['Everyone', 'New users (7d)', 'Inactive (30d)', 'High spenders', 'By city: Algiers', 'Pending KYC'];
const NSTATUS = { sent:'success', scheduled:'info', draft:'warning', sending:'primary' };

// Notification types — verbatim from the app: types/notifications.ts + NotificationListItem getIconConfig().
// 10 types; icon/color mirror the app's mapping (offer=amber, alert/security=rose, announcement=green, news=gray, rest=brand).
const NTYPES = {
  order:        { label: 'Order',        icon: 'package',   color: 'var(--primary)', bg: 'var(--soft-pink)' },
  courier:      { label: 'Courier',      icon: 'truck',     color: 'var(--primary)', bg: 'var(--soft-pink)' },
  promo:        { label: 'Promo',        icon: 'gift',      color: 'var(--primary)', bg: 'var(--soft-pink)' },
  offer:        { label: 'Offer',        icon: 'tag',       color: '#D97706',        bg: 'var(--warning-light)' },
  alert:        { label: 'Alert',        icon: 'warn',      color: 'var(--danger)',  bg: 'var(--danger-light)' },
  security:     { label: 'Security',     icon: 'shield',    color: '#F43F5E',        bg: 'var(--danger-light)' },
  announcement: { label: 'Announcement', icon: 'megaphone', color: '#16A34A',        bg: 'var(--success-light)' },
  news:         { label: 'News',         icon: 'newspaper', color: 'var(--subtext)', bg: 'var(--muted)' },
  benefit:      { label: 'Benefit',      icon: 'ticket',    color: 'var(--info)',    bg: 'var(--info-light)' },
  deposit:      { label: 'Deposit',      icon: 'wallet',    color: 'var(--success)', bg: 'var(--success-light)' },
};
const NTYPE_KEYS = Object.keys(NTYPES);
const NTYPE_BADGE = { order:'primary', courier:'primary', promo:'primary', offer:'warning', alert:'danger', security:'danger', announcement:'success', news:'default', benefit:'info', deposit:'success' };

function TypePill({ type }) {
  const c = NTYPES[type] || NTYPES.order;
  return (
    <span className="ntype-pill">
      <span className="ntype-ic" style={{ background: c.bg, color: c.color }}><DIcon name={c.icon} style={{ width: 14, height: 14 }} /></span>
      <Badge variant={NTYPE_BADGE[type]}>{c.label}</Badge>
    </span>
  );
}

const CAMPAIGNS = [
  { title: '30% off all rides — weekend!', type: 'promo', chans: ['push','inapp'], audience: 'Customer', status: 'sent', reach: 184200, opens: '38%', date: 'May 30' },
  { title: 'Your order #4821 is on the way', type: 'order', chans: ['push'], audience: 'Customer', status: 'sent', reach: 1, opens: '100%', date: 'May 30' },
  { title: 'Fuel cashback now live', type: 'benefit', chans: ['push','inapp'], audience: 'Rider', status: 'sent', reach: 3214, opens: '52%', date: 'May 29' },
  { title: 'New device sign-in detected', type: 'security', chans: ['push','email'], audience: 'All', status: 'sent', reach: 248000, opens: '71%', date: 'May 29' },
  { title: 'Action needed: verify your store', type: 'alert', chans: ['push','email'], audience: 'Merchant', status: 'sent', reach: 1820, opens: '61%', date: 'May 28' },
  { title: 'Deposit bonus: +10% this week', type: 'deposit', chans: ['push','inapp'], audience: 'Rider', status: 'sent', reach: 3100, opens: '47%', date: 'May 28' },
  { title: 'Free delivery on your next order', type: 'offer', chans: ['inapp'], audience: 'Customer', status: 'sent', reach: 96400, opens: '29%', date: 'May 27' },
  { title: 'Eid mega-sale starts soon', type: 'promo', chans: ['push','inapp','email'], audience: 'All', status: 'scheduled', reach: 248000, opens: '—', date: 'Jun 5 · 09:00' },
  { title: 'New agent commission rates', type: 'announcement', chans: ['inapp'], audience: 'Agent', status: 'draft', reach: 0, opens: '—', date: '—' },
];
const TEMPLATES = [
  { t: 'Order on the way', type: 'order', m: 'Your order is on the way! {rider} will arrive in ~{eta}.' },
  { t: 'Promo announcement', type: 'promo', m: '🎉 {promo} — tap to claim before it ends!' },
  { t: 'KYC reminder', type: 'alert', m: 'Action needed: finish verifying your account to keep earning.' },
  { t: 'Payout sent', type: 'deposit', m: 'Your payout of {amount} DA has been sent. Tap for details.' },
];

function NotifTabs({ tab, setTab }) {
  const tabs = [['campaigns','Campaigns','bell','5'],['compose','Compose','send',null],['templates','Templates','doc','8'],['segments','Segments','users','6']];
  return (
    <div className="sup-tabs">
      {tabs.map(([id, lb, ic, n]) => (
        <button key={id} className={`sup-tab ${tab === id ? 'on' : ''}`} onClick={() => setTab(id)}>
          <DIcon name={ic} style={{ width: 16, height: 16 }} />{lb}{n && <span className="count">{n}</span>}
        </button>
      ))}
    </div>
  );
}

function ChanIcons({ chans }) {
  return <span style={{ display: 'inline-flex', gap: 6 }}>{chans.map(c => {
    const m = CHANNELS.find(x => x[0] === c);
    return <span key={c} title={m[1]} style={{ color: 'var(--subtext)' }}><DIcon name={m[2]} style={{ width: 16, height: 16 }} /></span>;
  })}</span>;
}

function Campaigns({ onNew }) {
  const [tf, setTf] = useNotif('all');
  const cols = [
    { key: 'title', label: 'Campaign', render: r => <span className="t-strong">{r.title}</span> },
    { key: 'type', label: 'Type', render: r => <TypePill type={r.type} /> },
    { key: 'chans', label: 'Channels', render: r => <ChanIcons chans={r.chans} /> },
    { key: 'audience', label: 'Audience', render: r => <Badge variant={N_ROLE_VARIANT[r.audience]}>{r.audience}</Badge> },
    { key: 'reach', label: 'Reach', render: r => <span className="mono">{r.reach ? r.reach.toLocaleString() : '—'}</span> },
    { key: 'opens', label: 'Open rate', render: r => <span className="t-sub">{r.opens}</span> },
    { key: 'status', label: 'Status', render: r => <Badge variant={NSTATUS[r.status]}>{r.status}</Badge> },
    { key: 'date', label: 'When', tdClass: 't-sub' },
  ];
  const rows = tf === 'all' ? CAMPAIGNS : CAMPAIGNS.filter(c => c.type === tf);
  return (
    <>
      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        <StatCard label="Sent (30d)" value={128} variant="primary" icon="bell" change="4.1M deliveries" />
        <StatCard label="Scheduled" value={6} variant="info" icon="calendar2" change="next: Eid sale" />
        <StatCard label="Avg Open Rate" value="44%" variant="success" icon="trending" change="▲ 3pts vs last month" />
        <StatCard label="Opt-out Rate" value="1.2%" variant="warning" icon="activity" change="within healthy range" />
      </div>
      <div className="toolbar">
        <div className="search"><DIcon name="search" style={{ width: 16, height: 16 }} /><input placeholder="Search campaigns" /></div>
        <button className="btn btn--primary" onClick={onNew} style={{ marginInlineStart: 'auto' }}><DIcon name="send" style={{ width: 16, height: 16 }} />New notification</button>
      </div>
      <div className="promo-filter">
        <button onClick={() => setTf('all')} style={{ border: 'none', borderRadius: 999, padding: '7px 14px', cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12.5, background: tf === 'all' ? 'var(--primary)' : 'var(--muted)', color: tf === 'all' ? '#fff' : 'var(--subtext)' }}>All</button>
        {NTYPE_KEYS.map(k => (
          <button key={k} onClick={() => setTf(k)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, border: 'none', borderRadius: 999, padding: '7px 14px', cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12.5, background: tf === k ? 'var(--primary)' : 'var(--muted)', color: tf === k ? '#fff' : 'var(--subtext)' }}>
            <DIcon name={NTYPES[k].icon} style={{ width: 13, height: 13 }} />{NTYPES[k].label}
          </button>
        ))}
      </div>
      <DataTable columns={cols} data={rows} empty="No campaigns of this type." />
    </>
  );
}

function Compose({ onCancel }) {
  const [chans, setChans] = useNotif(['push']);
  const [ntype, setNtype] = useNotif('promo');
  const [lang, setLang] = useNotif('en');
  const [title, setTitle] = useNotif(emptyLang());
  const [msg, setMsg] = useNotif(emptyLang());
  const setT = v => setTitle(o => ({ ...o, [lang]: v }));
  const setM = v => setMsg(o => ({ ...o, [lang]: v }));
  const [roles, setRoles] = useNotif(['All']);
  const [seg, setSeg] = useNotif('Everyone');
  const [link, setLink] = useNotif('blink://promos');
  const [when, setWhen] = useNotif('now');
  const toggleChan = (c) => setChans(cs => cs.includes(c) ? (cs.filter(x => x !== c).length ? cs.filter(x => x !== c) : cs) : [...cs, c]);
  const toggleRole = (r) => setRoles(rs => r === 'All' ? ['All'] : (rs.includes(r) ? (rs.filter(x => x !== r).length ? rs.filter(x => x !== r) : ['All']) : [...rs.filter(x => x !== 'All'), r]));
  // reach estimate by audience + segment
  const base = { All: 248000, Customer: 184000, Rider: 3214, Merchant: 1820, Agent: 47 };
  let reach = roles.includes('All') ? base.All : roles.reduce((s, r) => s + (base[r] || 0), 0);
  if (seg === 'New users (7d)') reach = Math.round(reach * 0.08);
  else if (seg === 'Inactive (30d)') reach = Math.round(reach * 0.22);
  else if (seg === 'High spenders') reach = Math.round(reach * 0.12);
  else if (seg === 'By city: Algiers') reach = Math.round(reach * 0.45);
  else if (seg === 'Pending KYC') reach = Math.round(reach * 0.05);

  return (
    <div className="editor-grid">
      <div className="card">
        <div className="card-head"><h3>New notification</h3><p>Compose, target, and send across channels</p></div>
        <div className="form-row">
          <label>Channels<span className="hint">Where this is delivered.</span></label>
          <div className="chan-grid">
            {CHANNELS.map(([id, lb, ic]) => (
              <button key={id} className={`chan ${chans.includes(id) ? 'on' : ''}`} onClick={() => toggleChan(id)}>
                <DIcon name={ic} style={{ width: 20, height: 20 }} /><span className="cl">{lb}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="form-row">
          <label>Notification type<span className="hint">Sets the icon, colour &amp; in-app routing. 10 types — from the app.</span></label>
          <div className="ntype-grid">
            {NTYPE_KEYS.map(k => (
              <button key={k} className={`ntype-opt ${ntype === k ? 'on' : ''}`} onClick={() => setNtype(k)}>
                <span className="ntype-ic" style={{ background: NTYPES[k].bg, color: NTYPES[k].color }}><DIcon name={NTYPES[k].icon} style={{ width: 16, height: 16 }} /></span>
                <span className="nl">{NTYPES[k].label}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="form-row">
          <label>Content language<span className="hint">Send in Arabic, French &amp; English — each user gets their language.</span></label><LangTabs active={lang} onChange={setLang} filled={{ en: !!title.en, fr: !!title.fr, ar: !!title.ar }} /></div>
        <div className="form-row"><label>Title</label><input className="f-input" dir={dirFor(lang)} value={title[lang]} onChange={e => setT(e.target.value)} placeholder="e.g. 30% off all rides this weekend!" /></div>
        <div className="form-row"><label>Message</label><textarea className="f-input" dir={dirFor(lang)} value={msg[lang]} onChange={e => setM(e.target.value)} placeholder="Write the notification body… Use {name}, {promo}, {amount} placeholders." style={{ minHeight: 110 }} /></div>
        <div className="form-row">
          <label>Audience — roles<span className="hint">Pick one or more roles.</span></label>
          <div className="chips">{N_ROLES.map(r => <button key={r} className={`rchip ${roles.includes(r) ? 'on' : ''}`} onClick={() => toggleRole(r)}>{roles.includes(r) && <span className="x"></span>}{r}</button>)}</div>
        </div>
        <div style={{ display: 'flex', gap: 14 }}>
          <div className="form-row" style={{ flex: 1 }}>
            <label>Segment</label>
            <select className="f-input" value={seg} onChange={e => setSeg(e.target.value)}>{SEGMENTS.map(s => <option key={s}>{s}</option>)}</select>
          </div>
          <div className="form-row" style={{ flex: 1 }}>
            <label>Deep link / action</label>
            <input className="f-input" value={link} onChange={e => setLink(e.target.value)} placeholder="blink://… or https://" />
          </div>
        </div>
      </div>

      <div className="editor-side">
        <div className="card">
          <div className="card-head" style={{ marginBottom: 12 }}><h3>Delivery</h3></div>
          <div className="form-row" style={{ marginBottom: 0 }}>
            <label>When to send</label>
            <div className="seg">
              {[['now','Send now'],['schedule','Schedule']].map(([v, l]) => <button key={v} className={when === v ? 'on' : ''} onClick={() => setWhen(v)}>{l}</button>)}
            </div>
            {when === 'schedule' && <input className="f-input" defaultValue="2026-06-05 09:00" style={{ marginTop: 10 }} />}
          </div>
          <div className="reach-box">
            <div className="ico" style={{ width: 38, height: 38, borderRadius: 11, background: 'var(--soft-pink)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><DIcon name="users" style={{ width: 19, height: 19, color: 'var(--primary)' }} /></div>
            <div><div className="rn">{reach.toLocaleString()}</div><div className="rl">estimated recipients · {chans.length} channel{chans.length > 1 ? 's' : ''}</div></div>
          </div>
          <div className="editor-actions" style={{ marginTop: 16 }}>
            <button className="btn" onClick={onCancel} style={{ flex: 1, justifyContent: 'center' }}>Save draft</button>
            <button className="btn btn--primary" onClick={onCancel} style={{ flex: 1, justifyContent: 'center' }}><DIcon name="send" style={{ width: 15, height: 15 }} />{when === 'schedule' ? 'Schedule' : 'Send'}</button>
          </div>
        </div>
        <div className="card">
          <div className="card-head" style={{ marginBottom: 12 }}><h3>Preview</h3></div>
          <div className="notif-preview">
            <div className="clock">9:41</div>
            <div className="notif-card">
              <div className="ico" style={{ background: NTYPES[ntype].bg }}><DIcon name={NTYPES[ntype].icon} style={{ width: 18, height: 18, color: NTYPES[ntype].color }} /></div>
              <div className="nc-bd">
                <div className="nc-top"><span>BLINK · {NTYPES[ntype].label.toUpperCase()}</span><span>now</span></div>
                <div className="nc-title" dir={dirFor(lang)}>{title[lang] || 'Notification title'}</div>
                <div className="nc-msg" dir={dirFor(lang)}>{msg[lang] || 'Your message preview appears here as you type.'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Templates() {
  return (
    <>
      <div className="toolbar"><div className="search"><DIcon name="search" style={{ width: 16, height: 16 }} /><input placeholder="Search templates" /></div>
        <button className="btn btn--primary" style={{ marginInlineStart: 'auto' }}><DIcon name="plus" style={{ width: 16, height: 16 }} />New template</button></div>
      <div className="card">
        {TEMPLATES.map((t, i) => (
          <div className="macro" key={i}><div className="mbody"><div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 3 }}><TypePill type={t.type} /></div><b>{t.t}</b><p>{t.m}</p></div><button className="btn" style={{ padding: '7px 14px' }}>Use</button></div>
        ))}
      </div>
    </>
  );
}

function Segments() {
  const segs = [
    { n: 'Everyone', c: 248000, d: 'All registered users' },
    { n: 'New users (7d)', c: 19840, d: 'Signed up in the last week' },
    { n: 'Inactive (30d)', c: 54560, d: 'No order/trip in 30 days' },
    { n: 'High spenders', c: 29760, d: 'Top 12% by lifetime value' },
    { n: 'By city: Algiers', c: 111600, d: 'Located in Algiers wilaya' },
    { n: 'Pending KYC', c: 1240, d: 'Verification incomplete' },
  ];
  return (
    <>
      <div className="toolbar"><div className="search"><DIcon name="search" style={{ width: 16, height: 16 }} /><input placeholder="Search segments" /></div>
        <button className="btn btn--primary" style={{ marginInlineStart: 'auto' }}><DIcon name="plus" style={{ width: 16, height: 16 }} />New segment</button></div>
      <div className="card">
        {segs.map((s, i) => (
          <div className="news-row" key={s.n} style={{ borderTopColor: i ? 'var(--border)' : 'transparent' }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: 'var(--soft-pink)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><DIcon name="users" style={{ width: 18, height: 18, color: 'var(--primary)' }} /></div>
            <div className="nbody"><div className="ntitle">{s.n}</div><div className="nsum">{s.d}</div></div>
            <div className="nmeta"><div className="col"><div className="v">{s.c.toLocaleString()}</div><div className="l">Users</div></div></div>
          </div>
        ))}
      </div>
    </>
  );
}

function Notifications() {
  const [tab, setTab] = useNotif('campaigns');
  return (
    <div>
      <PageHeader title="Notifications" description="Create, target & send across push, in-app, email & SMS"
        actions={tab === 'campaigns' ? <button className="btn btn--primary" onClick={() => setTab('compose')}><DIcon name="send" style={{ width: 16, height: 16 }} />New notification</button> : null} />
      <NotifTabs tab={tab} setTab={setTab} />
      {tab === 'campaigns' && <Campaigns onNew={() => setTab('compose')} />}
      {tab === 'compose' && <Compose onCancel={() => setTab('campaigns')} />}
      {tab === 'templates' && <Templates />}
      {tab === 'segments' && <Segments />}
    </div>
  );
}

Object.assign(window, { Notifications });

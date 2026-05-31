// promotions.jsx — Promotions: public marketing campaigns (grid · create · analytics)
// Grounded in app promo-store.ts: { category, title, subtitle, imageUrl, code?, type:'activate'|'copy' }
const { useState: usePromo } = React;

const P_CATS = ['All', 'Rides', 'Food', 'Market', 'Parcels', 'Fashion', 'Beauty'];
const P_ROLES = ['All', 'Customer', 'Rider', 'Merchant', 'Agent'];
const P_ROLE_VARIANT = { Customer:'info', Rider:'success', Merchant:'primary', Agent:'warning', All:'default' };
const P_COVERS = ['../../assets/news-warehouse.png', '../../assets/news-fuel.png', '../../assets/news-policy.png'];
const P_STATUS = { active:'success', scheduled:'info', paused:'warning', ended:'default' };

const PROMOS = [
  { title: '30% off all rides', sub: 'Weekend drop · Algiers', cat: 'Rides', type: 'activate', cover: 1, status: 'active', reach: 184000, redeemed: 6922, ctr: '8.4%' },
  { title: '50% OFF at Burger King', sub: 'Code: BK50 · min 2000 DA', cat: 'Food', type: 'copy', code: 'BK50', cover: 0, status: 'active', reach: 142000, redeemed: 842, ctr: '5.1%' },
  { title: 'Fresh grocery — BOGO', sub: 'Code: FRESH1 · select stores', cat: 'Market', type: 'copy', code: 'FRESH1', cover: 2, status: 'active', reach: 96000, redeemed: 318, ctr: '3.6%' },
  { title: 'Free parcel delivery', sub: 'First courier order', cat: 'Parcels', type: 'activate', cover: 0, status: 'scheduled', reach: 0, redeemed: 0, ctr: '—' },
  { title: 'Summer fashion −40%', sub: 'Code: SUMMER40', cat: 'Fashion', type: 'copy', code: 'SUMMER40', cover: 1, status: 'paused', reach: 54000, redeemed: 1204, ctr: '6.0%' },
  { title: 'Student rides −25%', sub: 'Verified students', cat: 'Rides', type: 'activate', cover: 2, status: 'active', reach: 38000, redeemed: 1290, ctr: '11.2%' },
];

function PromoTabs({ tab, setTab }) {
  const tabs = [['grid','Campaigns','gift','24'],['create','Create','plus',null],['analytics','Analytics','trending',null]];
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

function PromoCard({ p }) {
  return (
    <div className="promo-card">
      <div className="img" style={{ backgroundImage: `url(${P_COVERS[p.cover]})` }}>
        <span className="cat">{p.cat}</span>
        <span className="typ">{p.type === 'copy' ? 'Copy code' : 'Activate'}</span>
        <div className="ov"><h4>{p.title}</h4></div>
      </div>
      <div className="pf">
        <span className="sub">{p.sub}</span>
        {p.code && <span className="code2">{p.code}</span>}
      </div>
      <div className="pstat">
        <div className="ps"><div className="v">{p.reach ? (p.reach/1000).toFixed(0)+'k' : '—'}</div><div className="l">Reach</div></div>
        <div className="ps"><div className="v">{p.redeemed ? p.redeemed.toLocaleString() : '—'}</div><div className="l">Used</div></div>
        <div className="ps"><div className="v">{p.ctr}</div><div className="l">CTR</div></div>
        <div className="ps"><Badge variant={P_STATUS[p.status]}>{p.status}</Badge></div>
      </div>
    </div>
  );
}

function PromoGrid({ onNew }) {
  const [cat, setCat] = usePromo('All');
  const shown = cat === 'All' ? PROMOS : PROMOS.filter(p => p.cat === cat);
  return (
    <>
      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        <StatCard label="Active Campaigns" value={18} variant="primary" icon="gift" change="3 ending today" />
        <StatCard label="Redemptions Today" value="6,922" variant="success" icon="trending" change="▲ 21% vs yesterday" />
        <StatCard label="Promo Spend" value="142K DA" variant="warning" icon="dollar" change="68% of monthly budget" />
        <StatCard label="Avg CTR" value="7.0%" variant="info" icon="activity" change="tap-through on cards" />
      </div>
      <div className="toolbar">
        <div className="search"><DIcon name="search" style={{ width: 16, height: 16 }} /><input placeholder="Search campaigns" /></div>
        <button className="btn btn--primary" onClick={onNew} style={{ marginInlineStart: 'auto' }}><DIcon name="plus" style={{ width: 16, height: 16 }} />New campaign</button>
      </div>
      <div className="promo-filter">
        {P_CATS.map(c => <button key={c} className={`chip ${cat === c ? 'chip--on' : 'chip--off'}`} onClick={() => setCat(c)} style={{ border: 'none', borderRadius: 999, padding: '8px 16px', cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, background: cat === c ? 'var(--primary)' : 'var(--muted)', color: cat === c ? '#fff' : 'var(--subtext)' }}>{c}</button>)}
      </div>
      <div className="promo-grid">{shown.map((p, i) => <PromoCard key={i} p={p} />)}</div>
    </>
  );
}

function PromoCreate({ onCancel }) {
  const [title, setTitle] = usePromo('');
  const [sub, setSub] = usePromo('');
  const [cat, setCat] = usePromo('Rides');
  const [cover, setCover] = usePromo(1);
  const [type, setType] = usePromo('activate');
  const [code, setCode] = usePromo('SUMMER40');
  const [roles, setRoles] = usePromo(['Customer']);
  const [budget, setBudget] = usePromo('50000');
  const [when, setWhen] = usePromo('now');
  const [shareable, setShareable] = usePromo(true);
  const toggleRole = (r) => setRoles(rs => r === 'All' ? ['All'] : (rs.includes(r) ? (rs.filter(x => x !== r).length ? rs.filter(x => x !== r) : ['All']) : [...rs.filter(x => x !== 'All'), r]));
  const preview = { title, sub, cat, type, code: type === 'copy' ? code : null, cover, status: when === 'schedule' ? 'scheduled' : 'active', reach: 0, redeemed: 0, ctr: '—' };
  return (
    <div className="editor-grid">
      <div className="card">
        <div className="card-head"><h3>Create campaign</h3><p>A public promo card shown in the Promos feed</p></div>
        <div className="form-row">
          <label>Cover image</label>
          <div className="cover-pick">{P_COVERS.map((c, i) => <div key={i} className={`cover-opt ${cover === i ? 'on' : ''}`} style={{ backgroundImage: `url(${c})` }} onClick={() => setCover(i)}></div>)}</div>
        </div>
        <div className="form-row"><label>Title</label><input className="f-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. 30% off all rides" /></div>
        <div className="form-row"><label>Subtitle</label><input className="f-input" value={sub} onChange={e => setSub(e.target.value)} placeholder="Short supporting line" /></div>
        <div style={{ display: 'flex', gap: 14 }}>
          <div className="form-row" style={{ flex: 1 }}><label>Category</label><select className="f-input" value={cat} onChange={e => setCat(e.target.value)}>{P_CATS.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}</select></div>
          <div className="form-row" style={{ flex: 1 }}><label>Monthly budget (DA)</label><input className="f-input" value={budget} onChange={e => setBudget(e.target.value)} /></div>
        </div>
        <div className="form-row">
          <label>Action type<span className="hint">How users redeem this promo.</span></label>
          <div className="seg">
            {[['activate','Activate (auto-apply)'],['copy','Copy code']].map(([v, l]) => <button key={v} className={type === v ? 'on' : ''} onClick={() => setType(v)}>{l}</button>)}
          </div>
          {type === 'copy' && <input className="f-input" value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="PROMO CODE" style={{ marginTop: 10, maxWidth: 220 }} />}
        </div>
        <div className="form-row" style={{ marginBottom: 0 }}>
          <label>Audience<span className="hint">Who sees this in the Promos feed.</span></label>
          <div className="chips">{P_ROLES.map(r => <button key={r} className={`rchip ${roles.includes(r) ? 'on' : ''}`} onClick={() => toggleRole(r)}>{roles.includes(r) && <span className="x"></span>}{r}</button>)}</div>
        </div>
      </div>

      <div className="editor-side">
        <div className="card">
          <div className="card-head" style={{ marginBottom: 12 }}><h3>Publish</h3></div>
          <div className="form-row" style={{ marginBottom: 0 }}>
            <label>Schedule</label>
            <div className="seg">{[['now','Publish now'],['schedule','Schedule']].map(([v, l]) => <button key={v} className={when === v ? 'on' : ''} onClick={() => setWhen(v)}>{l}</button>)}</div>
            {when === 'schedule' && <input className="f-input" defaultValue="2026-06-03 09:00" style={{ marginTop: 10 }} />}
          </div>
          <div className="push-row" style={{ marginTop: 14, marginBottom: 0 }}>
            <div className="lt"><b><DIcon name="send" style={{ width: 15, height: 15 }} />Shareable</b><span>Let users share this promo</span></div>
            <button className={`toggle ${shareable ? 'on' : ''}`} onClick={() => setShareable(p => !p)}><span className="knob"></span></button>
          </div>
          <div className="editor-actions" style={{ marginTop: 16 }}>
            <button className="btn" onClick={onCancel} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
            <button className="btn btn--primary" onClick={onCancel} style={{ flex: 1, justifyContent: 'center' }}>{when === 'schedule' ? 'Schedule' : 'Publish'}</button>
          </div>
        </div>
        <div className="card">
          <div className="card-head" style={{ marginBottom: 12 }}><h3>Live preview</h3></div>
          <PromoCard p={preview} />
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 12, flexWrap: 'wrap' }}>
            {roles.map(r => <Badge key={r} variant={P_ROLE_VARIANT[r]}>{r}</Badge>)}
            {shareable && <Badge variant="primary">shareable</Badge>}
          </div>
        </div>
      </div>
    </div>
  );
}

function PromoAnalytics() {
  const days = [['Mon',38],['Tue',52],['Wed',44],['Thu',61],['Fri',88],['Sat',96],['Sun',72]];
  const max = 100;
  const byCat = [
    { name: 'Rides', pct: 34, color: '#10B981' },
    { name: 'Food', pct: 41, color: '#EE335F' },
    { name: 'Market', pct: 16, color: '#3B82F6' },
    { name: 'Parcels', pct: 9, color: '#FAAD14' },
  ];
  let acc = 0; const stops = byCat.map(s => { const st = acc; acc += s.pct; return `${s.color} ${st}% ${acc}%`; }).join(', ');
  return (
    <>
      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        <StatCard label="Redemptions (7d)" value="42,180" variant="primary" icon="trending" change="▲ 12% WoW" />
        <StatCard label="Promo Revenue Lift" value="+18%" variant="success" icon="dollar" change="vs non-promo orders" />
        <StatCard label="Spend / Redemption" value="34 DA" variant="warning" icon="tag" change="blended" />
        <StatCard label="Best Performer" value="Student −25%" variant="info" icon="gift" change="11.2% CTR" />
      </div>
      <div className="dem-grid">
        <div className="card">
          <div className="chart-head"><div className="lt"><h3>Redemptions this week</h3><p>Across all active campaigns</p></div></div>
          <div className="hours" style={{ height: 150 }}>
            {days.map(([d, v]) => (
              <div className="col" key={d}><div className="stack"><div className="dem" style={{ height: `${(v/max)*100}%` }}></div></div><span className="hr">{d}</span></div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="chart-head"><div className="lt"><h3>By service</h3><p>Share of redemptions</p></div></div>
          <div className="donut-wrap">
            <div className="donut" style={{ background: `conic-gradient(${stops})` }}><div className="ctr"><b>42k</b><span>used</span></div></div>
            <div className="dleg">{byCat.map(s => <div className="row" key={s.name}><span className="sw" style={{ background: s.color }}></span><span className="nm">{s.name}</span><span className="pc">{s.pct}%</span></div>)}</div>
          </div>
        </div>
      </div>
    </>
  );
}

function Promotions() {
  const [tab, setTab] = usePromo('grid');
  return (
    <div>
      <PageHeader title="Promotions" description="Public deals & campaigns in the Promos feed"
        actions={tab === 'grid' ? <button className="btn btn--primary" onClick={() => setTab('create')}><DIcon name="plus" style={{ width: 16, height: 16 }} />New campaign</button> : null} />
      <PromoTabs tab={tab} setTab={setTab} />
      {tab === 'grid' && <PromoGrid onNew={() => setTab('create')} />}
      {tab === 'create' && <PromoCreate onCancel={() => setTab('grid')} />}
      {tab === 'analytics' && <PromoAnalytics />}
    </div>
  );
}

Object.assign(window, { Promotions });

// news.jsx — Blink News: in-app news/announcements CMS (list · compose · categories)
const { useState: useNews } = React;

const N_CATS = [
  { name: 'Network', color: '#3B82F6', count: 14 },
  { name: 'Offer', color: '#EE335F', count: 22 },
  { name: 'Policy', color: '#FAAD14', count: 9 },
  { name: 'Update', color: '#10B981', count: 17 },
  { name: 'Announcement', color: '#8B5CF6', count: 6 },
];
const N_CAT_NAMES = N_CATS.map(c => c.name);
const N_ROLES = ['All', 'Customer', 'Rider', 'Merchant', 'Agent'];
const N_ROLE_VARIANT = { Customer:'info', Rider:'success', Merchant:'primary', Agent:'warning', All:'default' };
const COVERS = ['../../assets/news-warehouse.png', '../../assets/news-fuel.png', '../../assets/news-policy.png'];
const N_STATUS = { published:'success', scheduled:'info', draft:'warning' };

const POSTS = [
  { title: 'Expanding Network: 15 new delivery hubs', sum: 'New hubs across the northern region cut delivery times.', cat: 'Network', cover: 0, roles: ['All'], status: 'published', pin: true, views: 48200, ctr: '6.4%', date: 'May 30' },
  { title: 'Fuel cashback for riders this month', sum: 'Registered riders earn diesel cashback on every 50 trips.', cat: 'Offer', cover: 1, roles: ['Rider'], status: 'published', pin: false, views: 12400, ctr: '11.2%', date: 'May 28' },
  { title: 'Updated settlement & dues policy', sum: 'How monthly dues are calculated — now clearer for merchants.', cat: 'Policy', cover: 2, roles: ['Merchant','Agent'], status: 'published', pin: false, views: 8900, ctr: '4.1%', date: 'May 25' },
  { title: '30% off all rides — weekend drop', sum: 'A limited weekend promo for all customers in Algiers.', cat: 'Offer', cover: 0, roles: ['Customer'], status: 'scheduled', pin: false, views: 0, ctr: '—', date: 'Jun 1' },
  { title: 'New in-app wallet top-up methods', sum: 'CIB and Edahabia cards now supported for Blink Cash.', cat: 'Update', cover: 1, roles: ['All'], status: 'draft', pin: false, views: 0, ctr: '—', date: '2h ago' },
];

function NewsTabs({ tab, setTab }) {
  const tabs = [['list','All News','newspaper','68'],['compose','Compose','plus',null],['categories','Categories','tag',null]];
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

function NewsList({ onNew }) {
  return (
    <>
      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        <StatCard label="Published" value={61} variant="success" icon="newspaper" change="2 pinned" />
        <StatCard label="Scheduled" value={5} variant="info" icon="calendar2" change="next: Jun 1" />
        <StatCard label="Total Reads" value="1.2M" variant="primary" icon="trending" change="▲ 9% this month" />
        <StatCard label="Avg CTR" value="7.1%" variant="warning" icon="activity" change="tap-through on CTAs" />
      </div>
      <div className="toolbar">
        <div className="search"><DIcon name="search" style={{ width: 16, height: 16 }} /><input placeholder="Search posts" /></div>
        <button className="btn"><DIcon name="filter" style={{ width: 16, height: 16 }} />Category</button>
        <button className="btn btn--primary" onClick={onNew} style={{ marginInlineStart: 'auto' }}><DIcon name="plus" style={{ width: 16, height: 16 }} />New post</button>
      </div>
      <div className="card">
        {POSTS.map((p, i) => (
          <div className="news-row" key={i}>
            <div className="news-thumb" style={{ backgroundImage: `url(${COVERS[p.cover]})` }}>
              {p.pin && <span className="pin"><DIcon name="pin" style={{ width: 12, height: 12 }} /></span>}
            </div>
            <div className="nbody">
              <div className="ntitle">{p.title}</div>
              <div className="nsum">{p.sum}</div>
              <div style={{ display: 'flex', gap: 6, marginTop: 7 }}>
                <Badge variant="default">{p.cat}</Badge>
                {p.roles.map(r => <Badge key={r} variant={N_ROLE_VARIANT[r]}>{r}</Badge>)}
              </div>
            </div>
            <div className="nmeta">
              <div className="col"><div className="v">{p.views ? (p.views/1000).toFixed(1)+'k' : '—'}</div><div className="l">Reads</div></div>
              <div className="col"><div className="v">{p.ctr}</div><div className="l">CTR</div></div>
              <div className="col"><Badge variant={N_STATUS[p.status]}>{p.status}</Badge><div className="l" style={{ marginTop: 4 }}>{p.date}</div></div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function Compose({ onCancel }) {
  const [lang, setLang] = useNews('en');
  const [title, setTitle] = useNews(emptyLang());
  const [sum, setSum] = useNews(emptyLang());
  const [body, setBody] = useNews(emptyLang());
  const setT = v => setTitle(o => ({ ...o, [lang]: v }));
  const setS = v => setSum(o => ({ ...o, [lang]: v }));
  const setB = v => setBody(o => ({ ...o, [lang]: v }));
  const [cat, setCat] = useNews('Network');
  const [cover, setCover] = useNews(0);
  const [roles, setRoles] = useNews(['All']);
  const [when, setWhen] = useNews('now');
  const [pin, setPin] = useNews(false);
  const [push, setPush] = useNews(true);
  const [cta, setCta] = useNews('Learn more');
  const toggleRole = (r) => setRoles(rs => r === 'All' ? ['All'] : (rs.includes(r) ? (rs.filter(x => x !== r).length ? rs.filter(x => x !== r) : ['All']) : [...rs.filter(x => x !== 'All'), r]));
  const catColor = N_CATS.find(c => c.name === cat)?.color;
  return (
    <div className="editor-grid">
      <div className="card">
        <div className="card-head"><h3>Compose news post</h3><p>Publish an in-app Blink News card to a target audience</p></div>
        <div className="form-row">
          <label>Cover image</label>
          <div className="cover-pick">
            {COVERS.map((c, i) => <div key={i} className={`cover-opt ${cover === i ? 'on' : ''}`} style={{ backgroundImage: `url(${c})` }} onClick={() => setCover(i)}></div>)}
          </div>
        </div>
        <div className="form-row"><label>Content language<span className="hint">Provide the post in Arabic, French &amp; English.</span></label><LangTabs active={lang} onChange={setLang} filled={{ en: !!title.en, fr: !!title.fr, ar: !!title.ar }} /></div>
        <div className="form-row"><label>Title</label><input className="f-input" dir={dirFor(lang)} value={title[lang]} onChange={e => setT(e.target.value)} placeholder="e.g. Expanding Network: 15 new hubs" /></div>
        <div className="form-row"><label>Summary</label><input className="f-input" dir={dirFor(lang)} value={sum[lang]} onChange={e => setS(e.target.value)} placeholder="One-line teaser shown on the card" /></div>
        <div className="form-row">
          <label>Category</label>
          <select className="f-input" value={cat} onChange={e => setCat(e.target.value)}>{N_CAT_NAMES.map(c => <option key={c}>{c}</option>)}</select>
        </div>
        <div className="form-row">
          <label>Audience<span className="hint">Who sees this post in their feed.</span></label>
          <div className="chips">{N_ROLES.map(r => <button key={r} className={`rchip ${roles.includes(r) ? 'on' : ''}`} onClick={() => toggleRole(r)}>{roles.includes(r) && <span className="x"></span>}{r}</button>)}</div>
        </div>
        <div className="form-row"><label>Body</label><textarea className="f-input" dir={dirFor(lang)} value={body[lang]} onChange={e => setB(e.target.value)} placeholder="Full article shown when the card is tapped…" /></div>
        <div className="form-row"><label>CTA button label</label><input className="f-input" value={cta} onChange={e => setCta(e.target.value)} placeholder="Learn more" /></div>
      </div>

      <div className="editor-side">
        <div className="card">
          <div className="card-head" style={{ marginBottom: 12 }}><h3>Publish</h3></div>
          <div className="form-row" style={{ marginBottom: 14 }}>
            <label>Schedule</label>
            <div className="seg">
              {[['now','Publish now'],['schedule','Schedule']].map(([v, l]) => <button key={v} className={when === v ? 'on' : ''} onClick={() => setWhen(v)}>{l}</button>)}
            </div>
            {when === 'schedule' && <input className="f-input" type="text" defaultValue="2026-06-01 09:00" style={{ marginTop: 10 }} />}
          </div>
          <div className="push-row">
            <div className="lt"><b><DIcon name="pin" style={{ width: 15, height: 15 }} />Pin to top</b><span>Keep at the top of the feed</span></div>
            <button className={`toggle ${pin ? 'on' : ''}`} onClick={() => setPin(p => !p)}><span className="knob"></span></button>
          </div>
          <div className="push-row" style={{ marginBottom: 0 }}>
            <div className="lt"><b><DIcon name="bell" style={{ width: 15, height: 15 }} />Send push</b><span>Notify the audience on publish</span></div>
            <button className={`toggle ${push ? 'on' : ''}`} onClick={() => setPush(p => !p)}><span className="knob"></span></button>
          </div>
          <div className="editor-actions" style={{ marginTop: 16 }}>
            <button className="btn" onClick={onCancel} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
            <button className="btn btn--primary" onClick={onCancel} style={{ flex: 1, justifyContent: 'center' }}>{when === 'schedule' ? 'Schedule' : 'Publish'}</button>
          </div>
        </div>
        <div className="card">
          <div className="card-head" style={{ marginBottom: 12 }}><h3>Live preview</h3></div>
          <div className="news-phone">
            <div className="cover" style={{ backgroundImage: `url(${COVERS[cover]})` }}><span className="cat" style={{ color: catColor }}>{cat}</span></div>
            <div className="pbody" dir={dirFor(lang)}>
              <h4>{title[lang] || 'Your headline appears here'}</h4>
              <p>{sum[lang] || 'The summary teaser shows on the news card in the app feed.'}</p>
              <span className="cta">{cta || 'Learn more'}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 12, flexWrap: 'wrap' }}>
            {roles.map(r => <Badge key={r} variant={N_ROLE_VARIANT[r]}>{r}</Badge>)}
            {push && <Badge variant="primary">push on</Badge>}
            {pin && <Badge variant="warning">pinned</Badge>}
          </div>
        </div>
      </div>
    </div>
  );
}

function NewsCategories() {
  return (
    <>
      <div className="toolbar"><div className="search"><DIcon name="search" style={{ width: 16, height: 16 }} /><input placeholder="Search categories" /></div>
        <button className="btn btn--primary" style={{ marginInlineStart: 'auto' }}><DIcon name="plus" style={{ width: 16, height: 16 }} />New category</button></div>
      <div className="card">
        {N_CATS.map((c, i) => (
          <div className="news-row" key={c.name} style={{ borderTopColor: i ? 'var(--border)' : 'transparent' }}>
            <div style={{ width: 14, height: 14, borderRadius: 5, background: c.color, flexShrink: 0 }}></div>
            <div className="nbody"><div className="ntitle">{c.name}</div><div className="nsum">{c.count} posts</div></div>
            <Badge variant="default">{c.count}</Badge>
          </div>
        ))}
      </div>
    </>
  );
}

function BlinkNews() {
  const [tab, setTab] = useNews('list');
  return (
    <div>
      <PageHeader title="Blink News" description="In-app news, offers & announcements"
        actions={tab === 'list' ? <button className="btn btn--primary" onClick={() => setTab('compose')}><DIcon name="plus" style={{ width: 16, height: 16 }} />New post</button> : null} />
      <NewsTabs tab={tab} setTab={setTab} />
      {tab === 'list' && <NewsList onNew={() => setTab('compose')} />}
      {tab === 'compose' && <Compose onCancel={() => setTab('list')} />}
      {tab === 'categories' && <NewsCategories />}
    </div>
  );
}

Object.assign(window, { BlinkNews });

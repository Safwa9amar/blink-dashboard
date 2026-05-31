// support.jsx — full Support back-office: Tickets · Knowledge Base · Create Article · Macros
const { useState: useSup } = React;

const PRIO = { urgent:'#EF4444', high:'#FAAD14', normal:'#3B82F6', low:'#9BA1A6' };
const TICKETS = [
  { id: 'TK-3391', subj: 'Order delivered to wrong address', who: 'Lina Cherif', role: 'customer', cat: 'Delivery', prio: 'urgent', status: 'open', age: '4m' },
  { id: 'TK-3390', subj: 'Rider asking for cash on prepaid order', who: 'Omar Ziani', role: 'customer', cat: 'Payment', prio: 'high', status: 'open', age: '22m' },
  { id: 'TK-3388', subj: 'Payout not received this week', who: 'Yacine Haddad', role: 'rider', cat: 'Earnings', prio: 'high', status: 'in_progress', age: '1h' },
  { id: 'TK-3385', subj: 'Item missing from grocery order', who: 'Nadia Boudiaf', role: 'customer', cat: 'Order', prio: 'normal', status: 'in_progress', age: '2h' },
  { id: 'TK-3382', subj: 'Agent QR code not scanning', who: 'Superette El Baraka', role: 'agent', cat: 'Agent', prio: 'normal', status: 'open', age: '3h' },
  { id: 'TK-3379', subj: 'App crashes on checkout', who: 'Sofiane Brahimi', role: 'rider', cat: 'Technical', prio: 'low', status: 'resolved', age: '5h' },
  { id: 'TK-3377', subj: 'Refund request for canceled trip', who: 'Karim Benali', role: 'merchant', cat: 'Refund', prio: 'normal', status: 'resolved', age: '6h' },
];
const TK_STATUS = { open:'danger', in_progress:'warning', resolved:'success' };
const supLbl = s => s.replace(/_/g,' ');

const ROLES = ['All', 'Customer', 'Rider', 'Merchant', 'Agent'];
const ROLE_VARIANT = { Customer:'info', Rider:'success', Merchant:'primary', Agent:'warning', All:'default' };
const CATEGORIES = ['Getting Started', 'Orders & Delivery', 'Payments & Blink Cash', 'Rides & Courier', 'Account & Security', 'Earnings & Payouts', 'Safety'];

const ARTICLES = [
  { title: 'How to track your live order', cat: 'Orders & Delivery', roles: ['Customer'], status: 'published', views: 12480, updated: '2d ago' },
  { title: 'Setting up your Blink Cash PIN', cat: 'Payments & Blink Cash', roles: ['Rider','Agent','Merchant'], status: 'published', views: 8210, updated: '5d ago' },
  { title: 'How rider payouts & commission work', cat: 'Earnings & Payouts', roles: ['Rider'], status: 'published', views: 6055, updated: '1w ago' },
  { title: 'Uploading your store documents (RC, NIF, NIS)', cat: 'Account & Security', roles: ['Merchant'], status: 'published', views: 4302, updated: '1w ago' },
  { title: 'Accepting a rider deposit at your shop', cat: 'Payments & Blink Cash', roles: ['Agent'], status: 'draft', views: 0, updated: '3h ago' },
  { title: 'Cancelling or refunding an order', cat: 'Orders & Delivery', roles: ['Customer','Merchant'], status: 'published', views: 9120, updated: '2w ago' },
  { title: 'Staying safe on a ride', cat: 'Safety', roles: ['Customer','Rider'], status: 'review', views: 0, updated: '1h ago' },
];
const ART_STATUS = { published:'success', draft:'warning', review:'info', archived:'default' };

const MACROS = [
  { t: 'Order delayed — apology + ETA', b: 'Hi {name}, sorry your order is taking longer than expected. Your rider is {eta} away — thanks for your patience!', used: 1204 },
  { t: 'Refund approved', b: 'Good news {name} — your refund of {amount} DA has been approved and will reach your Blink wallet within 24h.', used: 842 },
  { t: 'Document rejected — re-upload', b: 'Hi {name}, your {document} was rejected because {reason}. Please re-upload a clear photo from your profile.', used: 530 },
  { t: 'Rider payout explained', b: 'Payouts settle weekly every Sunday. Your earnings minus the 18% commission are sent to your selected method.', used: 318 },
];

function SupTabs({ tab, setTab }) {
  const tabs = [['tickets','Tickets','support','42'],['kb','Knowledge Base','doc','86'],['create','Create Article','plus',null],['macros','Macros','activity','12']];
  return (
    <div className="sup-tabs">
      {tabs.map(([id, lb, ic, n]) => (
        <button key={id} className={`sup-tab ${tab === id ? 'on' : ''}`} onClick={() => setTab(id)}>
          <DIcon name={ic === 'doc' ? 'package' : ic} style={{ width: 16, height: 16 }} />{lb}{n && <span className="count">{n}</span>}
        </button>
      ))}
    </div>
  );
}

function TicketsTab() {
  const cols = [
    { key: 'id', label: 'Ticket', render: r => <span className="mono t-primary">{r.id}</span> },
    { key: 'subj', label: 'Subject', render: r => <span className="t-strong">{r.subj}</span> },
    { key: 'who', label: 'Reporter', render: r => <span className="name-cell"><Avatar name={r.who} /><span>{r.who}</span></span> },
    { key: 'cat', label: 'Category', tdClass: 't-sub' },
    { key: 'prio', label: 'Priority', render: r => <span className="prio" style={{ color: PRIO[r.prio] }}><span className="d" style={{ background: PRIO[r.prio] }}></span><span className="cap">{r.prio}</span></span> },
    { key: 'status', label: 'Status', render: r => <Badge variant={TK_STATUS[r.status]}>{supLbl(r.status)}</Badge> },
    { key: 'age', label: 'Age', render: r => <span className="t-sub">{r.age}</span> },
  ];
  return (
    <>
      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        <StatCard label="Open Tickets" value={42} variant="danger" icon="support" change="9 unassigned" />
        <StatCard label="In Progress" value={18} variant="warning" icon="clock" change="Avg 2.4h to first reply" />
        <StatCard label="Resolved Today" value={67} variant="success" icon="trending" change="▲ 12% vs yesterday" />
        <StatCard label="CSAT" value="4.6" variant="primary" icon="star" change="Last 7 days" />
      </div>
      <Toolbar placeholder="Search tickets" />
      <DataTable columns={cols} data={TICKETS} empty="No tickets found." />
    </>
  );
}

function KbTab({ onNew }) {
  const cols = [
    { key: 'title', label: 'Article', render: r => <span className="t-strong">{r.title}</span> },
    { key: 'cat', label: 'Category', render: r => <span className="kb-cat">{r.cat}</span> },
    { key: 'roles', label: 'Audience', render: r => <span className="role-badges">{r.roles.map(x => <Badge key={x} variant={ROLE_VARIANT[x]}>{x}</Badge>)}</span> },
    { key: 'status', label: 'Status', render: r => <Badge variant={ART_STATUS[r.status]}>{r.status}</Badge> },
    { key: 'views', label: 'Views', render: r => <span className="mono t-sub">{r.views ? r.views.toLocaleString() : '—'}</span> },
    { key: 'updated', label: 'Updated', tdClass: 't-sub' },
  ];
  return (
    <>
      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        <StatCard label="Published" value={72} variant="success" icon="doc" change="across 7 categories" />
        <StatCard label="Drafts" value={11} variant="warning" icon="package" change="3 in review" />
        <StatCard label="Monthly Reads" value="148K" variant="info" icon="trending" change="▲ 6% vs last month" />
        <StatCard label="Helpful Rate" value="91%" variant="primary" icon="star" change="thumbs-up / total" />
      </div>
      <div className="toolbar">
        <div className="search"><DIcon name="search" style={{ width: 16, height: 16 }} /><input placeholder="Search articles" /></div>
        <button className="btn"><DIcon name="filter" style={{ width: 16, height: 16 }} />Category</button>
        <button className="btn btn--primary" onClick={onNew} style={{ marginInlineStart: 'auto' }}><DIcon name="plus" style={{ width: 16, height: 16 }} />New article</button>
      </div>
      <DataTable columns={cols} data={ARTICLES} empty="No articles yet." />
    </>
  );
}

function CreateArticleTab({ onCancel }) {
  const [lang, setLang] = useSup('en');
  const [title, setTitle] = useSup(emptyLang());
  const [cat, setCat] = useSup(CATEGORIES[0]);
  const [roles, setRoles] = useSup(['Customer']);
  const [visibility, setVisibility] = useSup('public');
  const [status, setStatus] = useSup('draft');
  const [body, setBody] = useSup(emptyLang());
  const setT = v => setTitle(o => ({ ...o, [lang]: v }));
  const setB = v => setBody(o => ({ ...o, [lang]: v }));
  const toggleRole = (r) => setRoles(rs => {
    if (r === 'All') return ['All'];
    const next = rs.includes(r) ? rs.filter(x => x !== r) : [...rs.filter(x => x !== 'All'), r];
    return next.length ? next : ['All'];
  });
  return (
    <div className="editor-grid">
      <div className="card">
        <div className="card-head"><h3>New article</h3><p>Write a help-center article and target who sees it</p></div>
        <div className="form-row">
          <label>Content language<span className="hint">Write the article in all three — Arabic, French &amp; English.</span></label>
          <LangTabs active={lang} onChange={setLang} filled={{ en: !!title.en, fr: !!title.fr, ar: !!title.ar }} />
        </div>
        <div className="form-row">
          <label>Title</label>
          <input className="f-input" dir={dirFor(lang)} value={title[lang]} onChange={e => setT(e.target.value)} placeholder="e.g. How to track your live order" />
        </div>
        <div className="form-row">
          <label>Category</label>
          <select className="f-input" value={cat} onChange={e => setCat(e.target.value)}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="form-row">
          <label>Audience — who can see this<span className="hint">Pick one or more roles, or “All”.</span></label>
          <div className="chips">
            {ROLES.map(r => (
              <button key={r} className={`rchip ${roles.includes(r) ? 'on' : ''}`} onClick={() => toggleRole(r)}>
                {roles.includes(r) && <span className="x"></span>}{r}
              </button>
            ))}
          </div>
        </div>
        <div className="form-row">
          <label>Visibility</label>
          <div className="seg">
            {[['public','Public help center'],['inapp','In-app only'],['internal','Internal (agents)']].map(([v, l]) => (
              <button key={v} className={visibility === v ? 'on' : ''} onClick={() => setVisibility(v)}>{l}</button>
            ))}
          </div>
        </div>
        <div className="form-row">
          <label>Body</label>
          <textarea className="f-input" dir={dirFor(lang)} value={body[lang]} onChange={e => setB(e.target.value)} placeholder="Write the article… Use {placeholders} for dynamic values like {name} or {amount}." />
          <div className="hint">Supports Markdown. Use {'{name}'}, {'{amount}'}, {'{eta}'} placeholders.</div>
        </div>
      </div>

      <div className="editor-side">
        <div className="card">
          <div className="card-head" style={{ marginBottom: 12 }}><h3>Status &amp; publish</h3></div>
          <div className="form-row" style={{ marginBottom: 14 }}>
            <label>Status</label>
            <div className="seg">
              {[['draft','Draft'],['review','In review'],['published','Published']].map(([v, l]) => (
                <button key={v} className={status === v ? 'on' : ''} onClick={() => setStatus(v)}>{l}</button>
              ))}
            </div>
          </div>
          <div className="editor-actions">
            <button className="btn" onClick={onCancel} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
            <button className="btn btn--primary" onClick={onCancel} style={{ flex: 1, justifyContent: 'center' }}>{status === 'published' ? 'Publish' : 'Save'}</button>
          </div>
        </div>
        <div className="card">
          <div className="card-head" style={{ marginBottom: 12 }}><h3>Live preview</h3></div>
          <div className="preview-art" dir={dirFor(lang)}>
            <div className="pmeta">
              <Badge variant="default">{cat}</Badge>
              {roles.map(r => <Badge key={r} variant={ROLE_VARIANT[r]}>{r}</Badge>)}
            </div>
            <h4>{title[lang] || 'Article title'}</h4>
            <p>{body[lang] || 'Your article body will preview here as you type. This is how it appears in the help center for the selected audience.'}</p>
          </div>
          <div className="lang-hint">Previewing <b style={{ margin: '0 4px' }}>{LANGS.find(l => l[0] === lang)[1]}</b></div>
        </div>
      </div>
    </div>
  );
}

function MacrosTab() {
  return (
    <>
      <div className="toolbar">
        <div className="search"><DIcon name="search" style={{ width: 16, height: 16 }} /><input placeholder="Search macros" /></div>
        <button className="btn btn--primary" style={{ marginInlineStart: 'auto' }}><DIcon name="plus" style={{ width: 16, height: 16 }} />New macro</button>
      </div>
      <div className="card">
        <div className="card-head"><h3>Canned responses</h3><p>Reusable replies agents can drop into a ticket</p></div>
        {MACROS.map((m, i) => (
          <div className="macro" key={i}>
            <div className="mbody"><b>{m.t}</b><p>{m.b}</p></div>
            <span className="used">used {m.used.toLocaleString()}×</span>
          </div>
        ))}
      </div>
    </>
  );
}

function Support() {
  const [tab, setTab] = useSup('tickets');
  return (
    <div>
      <PageHeader title="Support" description="Tickets, help center & canned replies"
        actions={tab === 'tickets'
          ? <button className="btn btn--primary"><DIcon name="plus" style={{ width: 16, height: 16 }} />New ticket</button>
          : tab === 'macros'
          ? null
          : <button className="btn btn--primary" onClick={() => setTab('create')}><DIcon name="plus" style={{ width: 16, height: 16 }} />New article</button>} />
      <SupTabs tab={tab} setTab={setTab} />
      {tab === 'tickets' && <TicketsTab />}
      {tab === 'kb' && <KbTab onNew={() => setTab('create')} />}
      {tab === 'create' && <CreateArticleTab onCancel={() => setTab('kb')} />}
      {tab === 'macros' && <MacrosTab />}
    </div>
  );
}

Object.assign(window, { Support });

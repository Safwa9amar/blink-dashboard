// blinkcash.jsx — Blink Cash: network wallet & ledger across all roles
// Integrates the app's blink-cash features: rider wallets (deposit/withdraw via agents),
// agent + merchant DUES, trip-tax, PIN security, transaction ledger.
const { useState: useBC } = React;

const TX_TYPE_LABEL = { deposit_agent:'Deposit · agent', deposit_online:'Deposit · card', withdrawal:'Withdrawal', trip_tax:'Trip tax', dues_payment:'Dues payment', commission:'Commission' };
const TX_ICON = { deposit_agent:'wallet', deposit_online:'card', withdrawal:'bank', trip_tax:'truck', dues_payment:'dollar', commission:'trending' };
const ROLE_VARIANT = { rider:'success', merchant:'primary', agent:'warning', customer:'info' };
const BC_TX_STATUS = { completed:'success', pending:'warning', failed:'danger' };

const LEDGER = [
  { id: 'BC-99412', who: 'Yacine Haddad', role: 'rider', type: 'deposit_agent', method: 'Agent · QR', amount: 5000, fees: 0, status: 'completed', date: '2m ago', credit: true },
  { id: 'BC-99411', who: 'Lina Cherif', role: 'customer', type: 'deposit_online', method: 'CIB card', amount: 8000, fees: 80, status: 'completed', date: '8m ago', credit: true },
  { id: 'BC-99410', who: 'Mohamed Saïdi', role: 'rider', type: 'withdrawal', method: 'Agent · Cash', amount: 3000, fees: 100, status: 'completed', date: '14m ago', credit: false },
  { id: 'BC-99409', who: 'Karim Électro', role: 'merchant', type: 'dues_payment', method: 'Blink Wallet', amount: 9200, fees: 0, status: 'completed', date: '22m ago', credit: false },
  { id: 'BC-99408', who: 'Yacine Haddad', role: 'rider', type: 'trip_tax', method: 'Auto', amount: 240, fees: 0, status: 'completed', date: '31m ago', credit: false },
  { id: 'BC-99407', who: 'Superette El Baraka', role: 'agent', type: 'dues_payment', method: 'Bank · RIB', amount: 12500, fees: 0, status: 'pending', date: '40m ago', credit: false },
  { id: 'BC-99406', who: 'Nadia Boudiaf', role: 'customer', type: 'withdrawal', method: 'BaridiMob', amount: 1500, fees: 50, status: 'failed', date: '52m ago', credit: false },
  { id: 'BC-99405', who: 'Riad Mansouri', role: 'rider', type: 'deposit_agent', method: 'Agent · QR', amount: 2450, fees: 0, status: 'completed', date: '1h ago', credit: true },
];

const DUES = [
  { who: 'Karim Électro', role: 'merchant', dues: 9200, fees: 320, due: 'in 3 days', status: 'open' },
  { who: 'Pizza Roma', role: 'merchant', dues: 6400, fees: 210, due: 'in 5 days', status: 'open' },
  { who: 'Superette El Baraka', role: 'agent', dues: 12500, fees: 0, due: 'today', status: 'overdue' },
  { who: 'Kiosque Nour', role: 'agent', dues: 4300, fees: 0, due: 'in 2 days', status: 'open' },
  { who: 'Karim Mobile', role: 'merchant', dues: 3300, fees: 180, due: 'in 6 days', status: 'open' },
];
const DUE_STATUS = { open:'info', overdue:'danger', paid:'success' };

function BCTabs({ tab, setTab }) {
  const tabs = [['overview','Overview','wallet',null],['ledger','Ledger','card','24'],['dues','Dues','dollar','48'],['agents','Agent Float','store',null]];
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

function BCStats() {
  return (
    <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(5,1fr)' }}>
      <StatCard label="Cash in Circulation" value="8.4M DA" variant="primary" icon="wallet" change="across 41k wallets" />
      <StatCard label="Deposits (today)" value="1.9M DA" variant="success" icon="trending" change="▲ 12% · 3,210 txns" />
      <StatCard label="Withdrawals (today)" value="1.2M DA" variant="info" icon="bank" change="2,040 txns" />
      <StatCard label="Dues Outstanding" value="212K DA" variant="warning" icon="dollar" change="48 agents + merchants" />
      <StatCard label="Agent Float" value="640K DA" variant="danger" icon="store" change="held at 47 agents" />
    </div>
  );
}

function Overview() {
  // deposits vs withdrawals by day
  const days = [['Mon',62,40],['Tue',70,52],['Wed',58,48],['Thu',82,60],['Fri',96,72],['Sat',88,80],['Sun',74,55]];
  const max = 100;
  return (
    <>
      <BCStats />
      <div className="dem-grid">
        <div className="card">
          <div className="chart-head">
            <div className="lt"><h3>Deposits vs withdrawals</h3><p>Network cash flow · this week (000 DA)</p></div>
            <div className="legend">
              <span className="lg"><span className="sw" style={{ background: 'var(--success)' }}></span>Deposits</span>
              <span className="lg"><span className="sw" style={{ background: 'color-mix(in srgb,var(--info) 60%,transparent)' }}></span>Withdrawals</span>
            </div>
          </div>
          <div className="hours" style={{ height: 150 }}>
            {days.map(([d, dep, wd]) => (
              <div className="col" key={d}>
                <div style={{ width: '100%', display: 'flex', gap: 3, alignItems: 'flex-end', height: '100%' }}>
                  <div className="dem" style={{ height: `${(dep/max)*100}%`, background: 'var(--success)', flex: 1 }}></div>
                  <div className="dem" style={{ height: `${(wd/max)*100}%`, background: 'color-mix(in srgb,var(--info) 60%,transparent)', flex: 1 }}></div>
                </div>
                <span className="hr">{d}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="chart-head"><div className="lt"><h3>Wallet & fees</h3><p>Blink Cash configuration</p></div></div>
          <div className="sel-row" style={{ borderTop: 'none' }}><span className="k">Deposit fee · agent</span><span className="v">Free</span></div>
          <div className="sel-row"><span className="k">Deposit fee · card</span><span className="v">1%</span></div>
          <div className="sel-row"><span className="k">Withdrawal fee</span><span className="v">50 DA</span></div>
          <div className="sel-row"><span className="k">Agent commission</span><span className="v">2%</span></div>
          <div className="sel-row"><span className="k">Trip tax (rider)</span><span className="v">5%</span></div>
          <div className="sel-row"><span className="k">PIN required</span><span className="v" style={{ color: 'var(--success)' }}>Enforced</span></div>
        </div>
      </div>
      <div className="card" style={{ marginTop: 20 }}>
        <div className="chart-head"><div className="lt"><h3>Latest activity</h3><p>Across rider, agent, merchant & customer wallets</p></div></div>
        <LedgerTable rows={LEDGER.slice(0, 5)} />
      </div>
    </>
  );
}

function LedgerTable({ rows }) {
  const cols = [
    { key: 'id', label: 'Txn', render: r => <span className="mono t-primary">{r.id}</span> },
    { key: 'who', label: 'Account', render: r => <span className="name-cell"><Avatar name={r.who} /><span className="t-strong">{r.who}</span></span> },
    { key: 'role', label: 'Role', render: r => <Badge variant={ROLE_VARIANT[r.role]}>{r.role}</Badge> },
    { key: 'type', label: 'Type', render: r => <span className="name-cell" style={{ gap: 8 }}><DIcon name={TX_ICON[r.type]} style={{ width: 16, height: 16, color: 'var(--subtext)' }} /><span>{TX_TYPE_LABEL[r.type]}</span></span> },
    { key: 'method', label: 'Method', tdClass: 't-sub' },
    { key: 'amount', label: 'Amount', render: r => <span className="mono t-strong" style={{ color: r.credit ? 'var(--success)' : 'var(--text)' }}>{r.credit ? '+' : '−'}{r.amount.toLocaleString()} DA</span> },
    { key: 'fees', label: 'Fees', render: r => <span className="mono t-sub">{r.fees ? r.fees + ' DA' : '—'}</span> },
    { key: 'status', label: 'Status', render: r => <Badge variant={BC_TX_STATUS[r.status]}>{r.status}</Badge> },
    { key: 'date', label: 'When', tdClass: 't-sub' },
  ];
  return <DataTable columns={cols} data={rows} empty="No transactions." />;
}

function Ledger() {
  const [f, setF] = useBC('all');
  const filters = [['all','All'],['deposit_agent','Deposits'],['withdrawal','Withdrawals'],['dues_payment','Dues'],['trip_tax','Trip tax']];
  const rows = f === 'all' ? LEDGER : LEDGER.filter(r => r.type === f || (f === 'deposit_agent' && r.type === 'deposit_online'));
  return (
    <>
      <BCStats />
      <div className="toolbar">
        <div className="search"><DIcon name="search" style={{ width: 16, height: 16 }} /><input placeholder="Search transactions, accounts…" /></div>
        <button className="btn"><DIcon name="download" style={{ width: 16, height: 16 }} />Export</button>
      </div>
      <div className="promo-filter">
        {filters.map(([id, l]) => <button key={id} onClick={() => setF(id)} style={{ border: 'none', borderRadius: 999, padding: '8px 16px', cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, background: f === id ? 'var(--primary)' : 'var(--muted)', color: f === id ? '#fff' : 'var(--subtext)' }}>{l}</button>)}
      </div>
      <LedgerTable rows={rows} />
    </>
  );
}

function Dues() {
  const totalDues = DUES.reduce((s, d) => s + d.dues, 0);
  const cols = [
    { key: 'who', label: 'Account', render: r => <span className="name-cell"><Avatar name={r.who} /><span className="t-strong">{r.who}</span></span> },
    { key: 'role', label: 'Role', render: r => <Badge variant={ROLE_VARIANT[r.role]}>{r.role}</Badge> },
    { key: 'dues', label: 'Dues', render: r => <span className="mono t-strong" style={{ color: 'var(--primary)' }}>{r.dues.toLocaleString()} DA</span> },
    { key: 'fees', label: 'Fees', render: r => <span className="mono t-sub">{r.fees ? r.fees + ' DA' : '—'}</span> },
    { key: 'due', label: 'Due', render: r => <span className={r.status === 'overdue' ? '' : 't-sub'} style={{ color: r.status === 'overdue' ? 'var(--danger)' : '' }}>{r.due}</span> },
    { key: 'status', label: 'Status', render: r => <Badge variant={DUE_STATUS[r.status]}>{r.status}</Badge> },
    { key: 'act', label: '', render: r => <button className="btn btn--primary" style={{ padding: '7px 14px' }}>Remind</button> },
  ];
  return (
    <>
      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        <StatCard label="Total Dues" value={`${(totalDues/1000).toFixed(1)}K DA`} variant="warning" icon="dollar" change="48 accounts owe Blink" />
        <StatCard label="Overdue" value="1" variant="danger" icon="fire" change="12,500 DA · agent" />
        <StatCard label="Collected Today" value="48K DA" variant="success" icon="trending" change="9 payments" />
        <StatCard label="On-time Rate" value="93%" variant="primary" icon="shield" change="last 30 days" />
      </div>
      <div className="toolbar"><div className="search"><DIcon name="search" style={{ width: 16, height: 16 }} /><input placeholder="Search accounts" /></div>
        <button className="btn"><DIcon name="filter" style={{ width: 16, height: 16 }} />Role</button></div>
      <DataTable columns={cols} data={DUES} empty="No outstanding dues." />
    </>
  );
}

function AgentFloat() {
  const agents = [
    { who: 'Superette El Baraka', area: 'Bab Ezzouar', float: 142000, cap: 200000, txns: 318 },
    { who: 'Kiosque Nour', area: 'El Harrach', float: 88000, cap: 150000, txns: 204 },
    { who: 'Tabac Presse Centrale', area: 'Rouiba', float: 36000, cap: 120000, txns: 96 },
    { who: 'Alimentation Sofiane', area: 'Cheraga', float: 174000, cap: 180000, txns: 412 },
  ];
  return (
    <>
      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        <StatCard label="Total Float Held" value="640K DA" variant="primary" icon="store" change="47 active agents" />
        <StatCard label="Deposits via Agents" value="1.4M DA" variant="success" icon="wallet" change="today" />
        <StatCard label="Withdrawals via Agents" value="980K DA" variant="info" icon="bank" change="today" />
        <StatCard label="Near Capacity" value="2" variant="warning" icon="fire" change="agents >90% float" />
      </div>
      <div className="toolbar"><div className="search"><DIcon name="search" style={{ width: 16, height: 16 }} /><input placeholder="Search agents" /></div>
        <button className="btn"><DIcon name="download" style={{ width: 16, height: 16 }} />Export</button></div>
      <div className="card">
        {agents.map((a, i) => {
          const pct = Math.round(a.float / a.cap * 100);
          return (
            <div className="news-row" key={a.who} style={{ borderTopColor: i ? 'var(--border)' : 'transparent' }}>
              <div style={{ width: 40, height: 40, borderRadius: 11, background: 'var(--soft-pink)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><DIcon name="store" style={{ width: 19, height: 19, color: 'var(--primary)' }} /></div>
              <div className="nbody" style={{ maxWidth: 200 }}><div className="ntitle">{a.who}</div><div className="nsum">{a.area} · {a.txns} txns</div></div>
              <div style={{ flex: 1, maxWidth: 260 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, marginBottom: 5 }}><span className="t-sub">Float</span><span className="mono t-strong">{(a.float/1000).toFixed(0)}k / {(a.cap/1000).toFixed(0)}k DA</span></div>
                <div className="ops-bar"><i style={{ width: `${pct}%`, background: pct > 90 ? 'var(--warning)' : 'var(--success)' }}></i></div>
              </div>
              <Badge variant={pct > 90 ? 'warning' : 'success'}>{pct}%</Badge>
            </div>
          );
        })}
      </div>
    </>
  );
}

function BlinkCash() {
  const [tab, setTab] = useBC('overview');
  return (
    <div>
      <PageHeader title="Blink Cash" description="Network wallet, deposits, withdrawals & dues across all roles"
        actions={<button className="btn"><DIcon name="download" style={{ width: 16, height: 16 }} />Export report</button>} />
      <BCTabs tab={tab} setTab={setTab} />
      {tab === 'overview' && <Overview />}
      {tab === 'ledger' && <Ledger />}
      {tab === 'dues' && <Dues />}
      {tab === 'agents' && <AgentFloat />}
    </div>
  );
}

Object.assign(window, { BlinkCash });

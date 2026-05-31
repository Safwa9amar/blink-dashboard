// extras2.jsx — Verification (KYC) dashboard view
// Grounded in the app: profile/required-actions.tsx

/* ---------------- Verification (KYC) ---------------- */
const KYC = [
  { who: 'Riad Mansouri', role: 'rider', doc: 'Driving licence + ID', sub: '12m ago', status: 'pending' },
  { who: 'ModaDZ', role: 'merchant', doc: 'RC (Front) · NIF · NIS', sub: '38m ago', status: 'pending' },
  { who: 'Sofiane Brahimi', role: 'rider', doc: 'Vehicle registration', sub: '1h ago', status: 'in_progress' },
  { who: 'Kiosque Nour', role: 'agent', doc: 'RC (Back)', sub: '2h ago', status: 'rejected', reason: 'Image too blurry' },
  { who: 'Beauty Box', role: 'merchant', doc: 'RIB · bank details', sub: '3h ago', status: 'missing_info', reason: 'Missing RIB' },
  { who: 'Amine Belkacem', role: 'rider', doc: 'Identity verification', sub: '5h ago', status: 'approved' },
];
const KYC_STATUS = { pending: 'warning', in_progress: 'info', rejected: 'danger', missing_info: 'danger', approved: 'success' };
const kycLbl = s => s.replace(/_/g, ' ');

function Verification() {
  const cols = [
    { key: 'who', label: 'Applicant', render: r => <span className="name-cell"><Avatar name={r.who} /><span className="t-strong">{r.who}</span></span> },
    { key: 'role', label: 'Role', render: r => <Badge variant={r.role === 'merchant' ? 'primary' : r.role === 'rider' ? 'success' : 'warning'}>{r.role}</Badge> },
    { key: 'doc', label: 'Documents', tdClass: 't-sub' },
    { key: 'status', label: 'Status', render: r => <div><Badge variant={KYC_STATUS[r.status]}>{kycLbl(r.status)}</Badge>{r.reason && <div className="t-sub" style={{ fontSize: 11, marginTop: 4 }}>{r.reason}</div>}</div> },
    { key: 'sub', label: 'Submitted', tdClass: 't-sub' },
    { key: 'act', label: '', render: r => (r.status === 'pending' || r.status === 'in_progress')
        ? <div style={{ display: 'flex', gap: 8 }}><button className="btn btn--primary" style={{ padding: '7px 14px' }}>Review</button></div>
        : <span className="t-sub" style={{ fontSize: 12 }}>—</span> },
  ];
  return (
    <div>
      <PageHeader title="Verification" description="KYC & document review queue" actions={<span className="live-pill"><span className="dot"></span>9 awaiting review</span>} />
      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        <StatCard label="Pending Review" value={31} variant="warning" icon="shield" change="9 over 24h SLA" />
        <StatCard label="Approved Today" value={54} variant="success" icon="trending" change="▲ 8% vs yesterday" />
        <StatCard label="Rejected" value={7} variant="danger" icon="fire" change="Mostly blurry docs" />
        <StatCard label="Avg Review Time" value="3.2h" variant="info" icon="clock" change="Target < 4h" />
      </div>
      <Toolbar placeholder="Search applicants" />
      <DataTable columns={cols} data={KYC} empty="Queue is clear." />
    </div>
  );
}

Object.assign(window, { Verification });

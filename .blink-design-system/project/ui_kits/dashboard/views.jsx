// views.jsx — dashboard pages, columns + statuses faithful to the repo

const ORDER_STATUS = { delivered:'success', canceled:'danger', merchant_rejected:'danger', on_the_way:'info', searching:'warning', processing:'warning', preparation:'warning', pickup:'primary', heading_to_store:'info' };
const TRIP_STATUS = { completed:'success', canceled:'danger', upcoming:'info', under_review:'warning' };
const TXN_STATUS = { completed:'success', pending:'warning', failed:'danger' };
const label = s => s.replace(/_/g, ' ');

function Overview() {
  return (
    <div>
      <PageHeader title="Overview" description="Your Blink platform at a glance" />
      <div className="stat-grid">
        <StatCard label="Total Users" value={DATA.stats.users} variant="primary" icon="users" change="▲ 6.2% this month" />
        <StatCard label="Active Riders" value={DATA.stats.riders} variant="success" icon="bike" change="▲ 3.1% this month" />
        <StatCard label="Orders" value={DATA.stats.orders} variant="info" icon="package" change="▲ 12% this week" />
        <StatCard label="Trips" value={DATA.stats.trips} variant="warning" icon="map" change="▲ 4.8% this week" />
        <StatCard label="Transactions" value={DATA.stats.transactions} variant="danger" icon="card" change="DZD 4.2M volume" />
      </div>
      <div className="two-col">
        <Card title="Recent Orders" description="Latest order activity">
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {DATA.orders.slice(0, 5).map((o, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0', borderTop: i ? '1px solid var(--border)' : 'none' }}>
                <span className="t-strong" style={{ flex: 1 }}>{o.store}</span>
                <Badge variant={ORDER_STATUS[o.status]}>{label(o.status)}</Badge>
                <span className="mono" style={{ minWidth: 92, textAlign: 'end' }}>{o.total.toFixed(2)} DA</span>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Recent Trips" description="Latest trip activity">
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {DATA.trips.slice(0, 5).map((t, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0', borderTop: i ? '1px solid var(--border)' : 'none' }}>
                <span className="mono t-primary" style={{ minWidth: 84 }}>{t.id}</span>
                <span className="t-sub" style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.pickup} → {t.dropoff}</span>
                <Badge variant={TRIP_STATUS[t.status]}>{label(t.status)}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function Orders() {
  const cols = [
    { key: 'store', label: 'Store', render: r => <span className="t-strong">{r.store}</span> },
    { key: 'type', label: 'Type', render: r => <span className="cap">{r.type}</span> },
    { key: 'status', label: 'Status', render: r => <Badge variant={ORDER_STATUS[r.status]}>{label(r.status)}</Badge> },
    { key: 'total', label: 'Total', render: r => <span className="mono t-strong">{r.total.toFixed(2)} DA</span> },
    { key: 'items', label: 'Items' },
    { key: 'date', label: 'Created', render: r => <span className="t-sub">{r.date}</span> },
  ];
  return (
    <div>
      <PageHeader title="Orders" description="Track and manage all orders" />
      <Toolbar placeholder="Search orders" />
      <DataTable columns={cols} data={DATA.orders} empty="No orders found." />
    </div>
  );
}

function Riders() {
  const cols = [
    { key: 'rider_id', label: 'Rider ID', render: r => <span className="mono t-primary">{r.rider_id}</span> },
    { key: 'name', label: 'Name', render: r => <span className="name-cell"><Avatar name={r.name} /><span className="t-strong">{r.name}</span></span> },
    { key: 'phone', label: 'Phone', render: r => <span className="t-sub">{r.phone}</span> },
    { key: 'wilaya', label: 'Wilaya' },
    { key: 'vehicle', label: 'Vehicle', render: r => <span className="cap">{r.vehicle}</span> },
  ];
  return (
    <div>
      <PageHeader title="Riders" description="Manage rider profiles and vehicles" />
      <Toolbar placeholder="Search riders" />
      <DataTable columns={cols} data={DATA.riders} empty="No riders found." />
    </div>
  );
}

function Trips() {
  const cols = [
    { key: 'id', label: 'ID', render: r => <span className="mono t-primary">{r.id}</span> },
    { key: 'pickup', label: 'Pickup', tdClass: 't-sub' },
    { key: 'dropoff', label: 'Dropoff', tdClass: 't-sub' },
    { key: 'status', label: 'Status', render: r => <Badge variant={TRIP_STATUS[r.status]}>{label(r.status)}</Badge> },
    { key: 'distance', label: 'Distance', render: r => `${r.distance} km` },
    { key: 'payout', label: 'Payout', render: r => <span className="mono t-strong">{r.payout.toFixed(2)} DA</span> },
  ];
  return (
    <div>
      <PageHeader title="Trips" description="Monitor all rider trips" />
      <Toolbar placeholder="Search trips" />
      <DataTable columns={cols} data={DATA.trips} empty="No trips found." />
    </div>
  );
}

function Transactions() {
  const cols = [
    { key: 'type', label: 'Type', render: r => <Badge variant={r.type === 'deposit' ? 'success' : 'primary'}>{r.type}</Badge> },
    { key: 'method', label: 'Method', tdClass: 't-sub' },
    { key: 'amount', label: 'Amount', render: r => <span className="mono">{r.amount.toFixed(2)} DA</span> },
    { key: 'fees', label: 'Fees', render: r => <span className="mono t-sub">{r.fees.toFixed(2)} DA</span> },
    { key: 'total', label: 'Total', render: r => <span className="mono t-strong">{r.total.toFixed(2)} DA</span> },
    { key: 'status', label: 'Status', render: r => <Badge variant={TXN_STATUS[r.status]}>{r.status}</Badge> },
  ];
  return (
    <div>
      <PageHeader title="Transactions" description="Track deposits and withdrawals" />
      <Toolbar placeholder="Search transactions" />
      <DataTable columns={cols} data={DATA.transactions} empty="No transactions found." />
    </div>
  );
}

function AgentShops() {
  const cols = [
    { key: 'shop', label: 'Shop Name', render: r => <span className="t-strong">{r.shop}</span> },
    { key: 'phone', label: 'Phone', tdClass: 't-sub' },
    { key: 'status', label: 'Status', render: r => <Badge variant={r.status === 'open' ? 'success' : 'default'}>{r.status}</Badge> },
    { key: 'hours', label: 'Hours', tdClass: 't-sub' },
    { key: 'rating', label: 'Rating', render: r => <span>★ {r.rating}</span> },
    { key: 'address', label: 'Address', tdClass: 't-sub' },
  ];
  return (
    <div>
      <PageHeader title="Agent Shops" description="Manage agent deposit locations" actions={<button className="btn btn--primary"><DIcon name="plus" style={{ width: 16, height: 16 }} />Add Shop</button>} />
      <Toolbar placeholder="Search agent shops" />
      <DataTable columns={cols} data={DATA.agents} empty="No agent shops found." />
    </div>
  );
}

function Users() {
  const roleVariant = { customer: 'info', merchant: 'primary', rider: 'success', agent: 'warning' };
  const cols = [
    { key: 'name', label: 'Name', render: r => <span className="name-cell"><Avatar name={r.name} /><span className="t-strong">{r.name}</span></span> },
    { key: 'phone', label: 'Phone', tdClass: 't-sub' },
    { key: 'role', label: 'Role', render: r => <Badge variant={roleVariant[r.role] || 'default'}>{r.role}</Badge> },
    { key: 'gender', label: 'Gender', render: r => <span className="cap t-sub">{r.gender}</span> },
    { key: 'status', label: 'Status', render: r => <Badge variant={r.status === 'active' ? 'success' : 'default'}>{r.status}</Badge> },
  ];
  return (
    <div>
      <PageHeader title="Users" description="Manage all platform users" actions={<button className="btn btn--primary"><DIcon name="plus" style={{ width: 16, height: 16 }} />Add User</button>} />
      <Toolbar placeholder="Search users" />
      <DataTable columns={cols} data={DATA.users} empty="No users found." />
    </div>
  );
}

Object.assign(window, { Overview, Orders, Riders, Trips, Transactions, AgentShops, Users });

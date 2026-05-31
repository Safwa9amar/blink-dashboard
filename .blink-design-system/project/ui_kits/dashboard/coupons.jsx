// coupons.jsx — Coupons: personal voucher management (list of ticket cards · create)
// Distinct from Promotions: coupons are owned vouchers with min-order/max-discount/expiry/code, optionally points-locked.
const { useState: useCoup } = React;

const COUPONS = [
  { disc: '10%', unit: 'OFF', title: 'Welcome discount', min: 1000, max: 500, code: 'WELCOME10', days: 8, locked: false, audience: 'Customer' },
  { disc: '500', unit: 'DZD', title: 'Free delivery credit', min: 1500, max: null, code: 'FREEDEL', days: 3, locked: false, audience: 'Customer' },
  { disc: '25%', unit: 'OFF', title: 'Student rides', min: 0, max: 300, code: 'STUDENT25', days: 30, locked: false, audience: 'Customer' },
  { disc: '15%', unit: 'OFF', title: 'Loyalty reward', min: 2000, max: 800, code: 'LOYAL15', days: 14, locked: true, points: 500, audience: 'Customer' },
  { disc: '1000', unit: 'DZD', title: 'Big spender bonus', min: 5000, max: null, code: 'BIG1000', days: 20, locked: true, points: 1200, audience: 'Customer' },
  { disc: '20%', unit: 'OFF', title: 'Comeback offer', min: 800, max: 600, code: 'MISSYOU20', days: 5, locked: false, audience: 'Customer' },
];

function CouponCard({ c }) {
  return (
    <div className={`coupon ${c.locked ? 'locked' : ''}`}>
      <span className="punch t"></span><span className="punch b"></span>
      <div className="stub"><span className="big">{c.disc}</span><span className="un">{c.unit}</span></div>
      <div className="body">
        {c.locked && <span className="lockchip"><DIcon name="lock" style={{ width: 11, height: 11 }} />{c.points} pts</span>}
        <div className="ct">{c.title}</div>
        <div className="meta">
          {c.min ? `Min order ${c.min.toLocaleString()} DA` : 'No minimum'}{c.max ? ` · Max ${c.max} DA` : ''}
        </div>
        <div className="foot">
          <span className="code">{c.code}</span>
          <span className="days">{c.days}d left</span>
        </div>
      </div>
    </div>
  );
}

function CouponsList({ onNew }) {
  return (
    <>
      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        <StatCard label="Active Coupons" value={34} variant="primary" icon="ticket" change="6 expiring this week" />
        <StatCard label="Redeemed Today" value="1,208" variant="success" icon="trending" change="▲ 14% vs yesterday" />
        <StatCard label="Points-Locked" value={9} variant="warning" icon="lock" change="reward vouchers" />
        <StatCard label="Redemption Rate" value="42%" variant="info" icon="activity" change="activated → used" />
      </div>
      <div className="toolbar">
        <div className="search"><DIcon name="search" style={{ width: 16, height: 16 }} /><input placeholder="Search coupons" /></div>
        <button className="btn"><DIcon name="filter" style={{ width: 16, height: 16 }} />Status</button>
        <button className="btn btn--primary" onClick={onNew} style={{ marginInlineStart: 'auto' }}><DIcon name="plus" style={{ width: 16, height: 16 }} />New coupon</button>
      </div>
      <div className="coupon-grid">{COUPONS.map((c, i) => <CouponCard key={i} c={c} />)}</div>
    </>
  );
}

function CreateCoupon({ onCancel }) {
  const [title, setTitle] = useCoup('');
  const [dtype, setDtype] = useCoup('pct');
  const [val, setVal] = useCoup('10');
  const [min, setMin] = useCoup('1000');
  const [max, setMax] = useCoup('500');
  const [code, setCode] = useCoup('WELCOME10');
  const [days, setDays] = useCoup('14');
  const [locked, setLocked] = useCoup(false);
  const [points, setPoints] = useCoup('500');
  const preview = { disc: dtype === 'pct' ? (val || '0') + '%' : (val || '0'), unit: dtype === 'pct' ? 'OFF' : 'DZD', title: title || 'Coupon title', min: Number(min) || 0, max: dtype === 'pct' ? Number(max) || null : null, code: code || 'CODE', days: Number(days) || 0, locked, points: Number(points) || 0 };
  return (
    <div className="editor-grid">
      <div className="card">
        <div className="card-head"><h3>Create coupon</h3><p>A personal voucher users redeem at checkout</p></div>
        <div className="form-row"><label>Title</label><input className="f-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Welcome discount" /></div>
        <div className="form-row">
          <label>Discount type</label>
          <div className="seg">
            {[['pct','Percentage'],['fixed','Fixed amount']].map(([v, l]) => <button key={v} className={dtype === v ? 'on' : ''} onClick={() => setDtype(v)}>{l}</button>)}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 14 }}>
          <div className="form-row" style={{ flex: 1 }}><label>{dtype === 'pct' ? 'Percent off' : 'Amount (DZD)'}</label><input className="f-input" value={val} onChange={e => setVal(e.target.value)} /></div>
          <div className="form-row" style={{ flex: 1 }}><label>Coupon code</label><input className="f-input" value={code} onChange={e => setCode(e.target.value.toUpperCase())} /></div>
        </div>
        <div style={{ display: 'flex', gap: 14 }}>
          <div className="form-row" style={{ flex: 1 }}><label>Min order (DZD)</label><input className="f-input" value={min} onChange={e => setMin(e.target.value)} /></div>
          <div className="form-row" style={{ flex: 1 }}><label>Max discount (DZD)<span className="hint">% coupons only</span></label><input className="f-input" value={max} onChange={e => setMax(e.target.value)} disabled={dtype !== 'pct'} style={{ opacity: dtype === 'pct' ? 1 : 0.5 }} /></div>
        </div>
        <div className="form-row" style={{ marginBottom: 0 }}><label>Valid for (days)</label><input className="f-input" value={days} onChange={e => setDays(e.target.value)} style={{ maxWidth: 160 }} /></div>
      </div>

      <div className="editor-side">
        <div className="card">
          <div className="card-head" style={{ marginBottom: 12 }}><h3>Unlock &amp; publish</h3></div>
          <div className="push-row">
            <div className="lt"><b><DIcon name="lock" style={{ width: 15, height: 15 }} />Points-locked</b><span>Users spend points to unlock</span></div>
            <button className={`toggle ${locked ? 'on' : ''}`} onClick={() => setLocked(p => !p)}><span className="knob"></span></button>
          </div>
          {locked && <div className="form-row" style={{ marginBottom: 0 }}><label>Points to unlock</label><input className="f-input" value={points} onChange={e => setPoints(e.target.value)} style={{ maxWidth: 160 }} /></div>}
          <div className="editor-actions" style={{ marginTop: 16 }}>
            <button className="btn" onClick={onCancel} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
            <button className="btn btn--primary" onClick={onCancel} style={{ flex: 1, justifyContent: 'center' }}>Create</button>
          </div>
        </div>
        <div className="card">
          <div className="card-head" style={{ marginBottom: 12 }}><h3>Live preview</h3></div>
          <CouponCard c={preview} />
        </div>
      </div>
    </div>
  );
}

function Coupons() {
  const [tab, setTab] = useCoup('list');
  return (
    <div>
      <PageHeader title="Coupons" description="Personal vouchers redeemed at checkout"
        actions={tab === 'list' ? <button className="btn btn--primary" onClick={() => setTab('create')}><DIcon name="plus" style={{ width: 16, height: 16 }} />New coupon</button> : null} />
      <div className="sup-tabs">
        <button className={`sup-tab ${tab === 'list' ? 'on' : ''}`} onClick={() => setTab('list')}><DIcon name="ticket" style={{ width: 16, height: 16 }} />All Coupons<span className="count">34</span></button>
        <button className={`sup-tab ${tab === 'create' ? 'on' : ''}`} onClick={() => setTab('create')}><DIcon name="plus" style={{ width: 16, height: 16 }} />Create Coupon</button>
      </div>
      {tab === 'list' ? <CouponsList onNew={() => setTab('create')} /> : <CreateCoupon onCancel={() => setTab('list')} />}
    </div>
  );
}

Object.assign(window, { Coupons });

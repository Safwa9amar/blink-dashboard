// Stores.jsx — My Stores (spec page 7) + Dashboard (spec page 6)
const { useState: useStoreState } = React;

function StoreKPI({ value, label, star }) {
  return (
    <div style={{ flex: 1, background: '#fff', border: '1px solid var(--gray-200)', borderRadius: 16, boxShadow: 'var(--shadow-sm)', padding: '14px 8px', textAlign: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: 'var(--blink-500)' }}>
        {star && <Icon name="star" size={14} color="var(--blink-500)" fill="var(--blink-500)" />}{value}
      </div>
      <div style={{ fontFamily: 'var(--font-body)', fontSize: 9.5, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--slate-500)', marginTop: 4 }}>{label}</div>
    </div>
  );
}

const SEED_PRODUCTS = [
  { id: 1, name: 'Wireless Earbuds Pro', cat: 'Audio', icon: 'cash', tint: '#FDE8EE', price: 4200, stock: 24 },
  { id: 2, name: 'USB-C Fast Charger 30W', cat: 'Chargers', icon: 'wallet', tint: '#E0F2F1', price: 1600, stock: 4 },
  { id: 3, name: 'Clear Phone Case', cat: 'Cases', icon: 'shield', tint: '#EEF2FF', price: 900, stock: 0 },
  { id: 4, name: 'Bluetooth Speaker Mini', cat: 'Audio', icon: 'cash', tint: '#FDE8EE', price: 5800, stock: 12 },
  { id: 5, name: 'Braided USB-C Cable 2m', cat: 'Chargers', icon: 'wallet', tint: '#E0F2F1', price: 700, stock: 38 },
];
const CATS = ['All', 'Audio', 'Chargers', 'Cases'];

function stockState(s) {
  if (s === 0) return { label: 'Out of stock', color: 'var(--danger)', bg: '#FEECEC' };
  if (s <= 5) return { label: `Low · ${s} left`, color: 'var(--warning)', bg: '#FEF3E2' };
  return { label: `${s} in stock`, color: 'var(--credit)', bg: 'var(--credit-bg)' };
}

function Stepper({ value, onChange, step = 1, prefix }) {
  const btn = { width: 34, height: 34, borderRadius: 10, border: '1px solid var(--gray-300)', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <button style={btn} onClick={() => onChange(Math.max(0, value - step))}><Icon name="minus" size={15} color="var(--slate-500)" /></button>
      <span style={{ minWidth: 64, textAlign: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: 'var(--slate-900)' }}>{prefix}{value.toLocaleString()}</span>
      <button style={btn} onClick={() => onChange(value + step)}><Icon name="plus" size={15} color="var(--blink-500)" /></button>
    </div>
  );
}

function ProductRow({ p, open, onToggle, onUpdate }) {
  const st = stockState(p.stock);
  return (
    <div style={{ background: '#fff', border: `1px solid ${open ? 'var(--blink-300)' : 'var(--gray-200)'}`, borderRadius: 16, boxShadow: 'var(--shadow-sm)', overflow: 'hidden', transition: 'border-color .15s' }}>
      <button onClick={onToggle} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 13, padding: '12px 14px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: p.tint, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon name={p.icon} size={22} color="var(--slate-700)" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14.5, color: 'var(--slate-900)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13.5, color: 'var(--slate-900)' }}>{p.price.toLocaleString()} <span style={{ fontSize: 10, color: 'var(--slate-400)' }}>DZD</span></span>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 10, color: st.color, background: st.bg, borderRadius: 99, padding: '2px 8px' }}>{st.label}</span>
          </div>
        </div>
        <Icon name={open ? 'chevronUp' : 'chevronDown'} size={20} color="var(--slate-400)" />
      </button>
      {open && (
        <div style={{ padding: '4px 16px 16px', borderTop: '1px solid var(--slate-100)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0 10px' }}>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 12.5, fontWeight: 600, color: 'var(--slate-500)' }}>Price (DZD)</span>
            <Stepper value={p.price} step={100} onChange={v => onUpdate({ price: v })} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0 14px' }}>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 12.5, fontWeight: 600, color: 'var(--slate-500)' }}>Stock</span>
            <Stepper value={p.stock} onChange={v => onUpdate({ stock: v })} />
          </div>
          <button onClick={onToggle} className="blink-btn blink-btn--primary" style={{ width: '100%', padding: '12px' }}>Save changes</button>
        </div>
      )}
    </div>
  );
}

function ProductsTab() {
  const [products, setProducts] = useStoreState(SEED_PRODUCTS);
  const [cat, setCat] = useStoreState('All');
  const [open, setOpen] = useStoreState(null);
  const shown = cat === 'All' ? products : products.filter(p => p.cat === cat);
  const update = (id, patch) => setProducts(ps => ps.map(p => p.id === id ? { ...p, ...patch } : p));
  const lowCount = products.filter(p => p.stock <= 5).length;
  return (
    <div style={{ padding: '4px 22px 0' }}>
      {/* search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fff', border: '1px solid var(--gray-300)', borderRadius: 99, padding: '11px 16px', marginBottom: 14 }}>
        <Icon name="help" size={18} color="var(--slate-400)" style={{ opacity: 0 }} />
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--slate-400)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: -28 }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input placeholder="Search products" style={{ flex: 1, border: 'none', outline: 'none', fontFamily: 'var(--font-body)', fontSize: 13.5, color: 'var(--slate-900)', background: 'transparent' }} />
      </div>
      {/* low-stock notice */}
      {lowCount > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, background: '#FEF3E2', borderRadius: 12, padding: '11px 14px', marginBottom: 14 }}>
          <Icon name="alert" size={17} color="var(--warning)" />
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 12.5, color: '#9A6700' }}>{lowCount} product{lowCount > 1 ? 's' : ''} need restocking</span>
        </div>
      )}
      {/* category chips */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 16, scrollbarWidth: 'none' }}>
        {CATS.map(c => (
          <button key={c} onClick={() => setCat(c)} style={{
            flexShrink: 0, border: 'none', borderRadius: 99, padding: '8px 16px', cursor: 'pointer',
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13,
            background: cat === c ? 'var(--blink-500)' : 'var(--slate-100)',
            color: cat === c ? '#fff' : 'var(--slate-600)',
          }}>{c}</button>
        ))}
      </div>
      {/* list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
        {shown.map(p => (
          <ProductRow key={p.id} p={p} open={open === p.id} onToggle={() => setOpen(open === p.id ? null : p.id)} onUpdate={patch => update(p.id, patch)} />
        ))}
      </div>
      <button className="blink-btn blink-btn--secondary" style={{ width: '100%', marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <Icon name="plus" size={18} color="var(--slate-900)" />Add Product
      </button>
    </div>
  );
}

function StoreDetailsTab() {
  return (
    <div style={{ padding: '4px 22px 0' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <InfoRow icon="phone" label="Store phone" value="+213 661 22 33 44" />
        <InfoRow icon="pin" label="Store address" value="12 Rue des Frères, Bab Ezzouar" />
      </div>
      <div style={{ display: 'flex', gap: 10, paddingTop: 12 }}>
        <StoreKPI value="1.04M da" label="Total Sales" />
        <StoreKPI value="4.7" label="Rating" star />
        <StoreKPI value="3 yrs" label="With Blink" />
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--slate-900)', letterSpacing: '0.02em', margin: '22px 0 12px' }}>Store Documents</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, background: 'var(--credit-bg)', borderRadius: 14, padding: '13px 16px', marginBottom: 14 }}>
        <Icon name="check" size={18} color="var(--credit)" />
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13.5, color: 'var(--credit)' }}>Approved</span>
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--credit)' }}>Verified 02 Sep</span>
      </div>
      {['Commercial Register — Front', 'Commercial Register — Back'].map((d, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#fff', border: '1px solid var(--gray-200)', borderRadius: 14, padding: '14px 16px', marginBottom: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--blink-tint-100)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="file" size={20} color="var(--blink-500)" /></div>
          <span style={{ flex: 1, fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13.5, color: 'var(--slate-900)' }}>{d}</span>
          <Icon name="check" size={20} color="var(--credit)" />
        </div>
      ))}
      <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
        <MiniField label="NIF" value="0998 7766 5544" />
        <MiniField label="NIS" value="0011 2233 4455" />
      </div>
    </div>
  );
}

function MyStores({ go, openSheet }) {
  const [tab, setTab] = useStoreState('products');
  return (
    <div style={{ flex: 1, overflowY: 'auto', background: 'var(--warm-bg)' }}>
      <TopBar title="My Stores" onBack={() => go('profile')} right={
        <button onClick={() => openSheet('switch')} style={{ ...iconBtn }}><Icon name="swap" size={21} color="var(--blink-500)" /></button>
      } />
      {/* Store cover */}
      <div style={{ margin: '16px 22px 0', borderRadius: 20, overflow: 'hidden', position: 'relative', minHeight: 112, background: 'var(--grad-hero)', display: 'flex', alignItems: 'flex-end', padding: 16 }}>
        <div style={{ position: 'absolute', width: 140, height: 140, borderRadius: 99, background: 'rgba(255,255,255,0.08)', right: -30, top: -50 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 52, height: 52, borderRadius: 15, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="store" size={26} color="var(--blink-500)" /></div>
          <div style={{ color: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18 }}>Karim Électro</span>
              <span style={{ fontSize: 9, fontWeight: 700, background: '#fff', color: 'var(--blink-700)', borderRadius: 99, padding: '2px 7px' }}>PRIMARY</span>
            </div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, opacity: 0.9, marginTop: 2 }}>5 products · Bab Ezzouar, Algiers</div>
          </div>
        </div>
      </div>
      {/* Tabs */}
      <div style={{ display: 'flex', background: 'var(--slate-100)', borderRadius: 99, padding: 4, margin: '16px 22px' }}>
        {[['products', 'Products'], ['details', 'Store Details']].map(([id, lbl]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            flex: 1, border: 'none', borderRadius: 99, padding: '11px', cursor: 'pointer',
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14,
            background: tab === id ? '#fff' : 'transparent', color: tab === id ? 'var(--blink-500)' : 'var(--slate-500)',
            boxShadow: tab === id ? 'var(--shadow-sm)' : 'none',
          }}>{lbl}</button>
        ))}
      </div>
      {tab === 'products' ? <ProductsTab /> : <StoreDetailsTab />}
      <div style={{ height: 120 }} />
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 13, background: '#fff', border: '1px solid var(--gray-200)', borderRadius: 14, padding: '13px 16px' }}>
      <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--blink-tint-200)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name={icon} size={18} color="var(--blink-500)" /></div>
      <div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 10.5, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--slate-500)' }}>{label}</div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14, color: 'var(--slate-900)', marginTop: 1 }}>{value}</div>
      </div>
    </div>
  );
}

function MiniField({ label, value }) {
  return (
    <div style={{ flex: 1 }}>
      <div style={{ fontFamily: 'var(--font-body)', fontSize: 10.5, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--slate-500)', marginBottom: 6 }}>{label}</div>
      <div style={{ background: '#fff', border: '1px solid var(--gray-300)', borderRadius: 12, padding: '12px 14px', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--slate-900)' }}>{value}</div>
    </div>
  );
}

// ---- Dashboard ----
function Dashboard({ go }) {
  const bars = [42, 60, 38, 75, 88, 54, 96];
  const days = ['M','T','W','T','F','S','S'];
  const max = Math.max(...bars);
  return (
    <div style={{ flex: 1, overflowY: 'auto', background: 'var(--warm-bg)' }}>
      <TopBar title="Dashboard" onBack={() => go('home')} right={<button onClick={() => go('home')} style={iconBtn}><Icon name="store" size={20} color="var(--slate-500)" /></button>} />
      <div style={{ padding: '18px 22px 0' }}>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 12.5, color: 'var(--slate-500)' }}>Karim Électro · This week</div>
        {/* headline metrics */}
        <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
          <BigMetric value="207K" unit="DZD" label="Revenue" trend="+12%" up />
          <BigMetric value="248" label="Orders" trend="+8%" up />
        </div>
        {/* chart */}
        <div style={{ background: '#fff', border: '1px solid var(--gray-200)', borderRadius: 18, boxShadow: 'var(--shadow-md)', padding: '18px', marginTop: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--slate-900)' }}>Sales this week</span>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: 'var(--credit)' }}>+12%</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8, height: 130, marginTop: 18 }}>
            {bars.map((b, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', gap: 8, height: '100%' }}>
                <div style={{ width: '100%', height: `${(b/max)*104}px`, borderRadius: 7, background: i === 6 ? 'var(--blink-500)' : 'var(--blink-tint-300)' }} />
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--slate-400)', fontWeight: 600 }}>{days[i]}</span>
              </div>
            ))}
          </div>
        </div>
        {/* top products */}
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--slate-900)', letterSpacing: '0.02em', margin: '22px 0 12px' }}>Top Products</div>
        {[
          { n: 'Wireless Earbuds Pro', u: '38 sold', a: '34,200 DZD' },
          { n: 'USB-C Fast Charger', u: '52 sold', a: '20,800 DZD' },
          { n: 'Phone Case — Clear', u: '74 sold', a: '14,800 DZD' },
        ].map((p, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '12px 0', borderBottom: i < 2 ? '1px solid var(--slate-100)' : 'none' }}>
            <div style={{ width: 30, height: 30, borderRadius: 9, background: 'var(--blink-tint-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, color: 'var(--blink-500)' }}>{i+1}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--slate-900)' }}>{p.n}</div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--slate-500)' }}>{p.u}</div>
            </div>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--slate-900)' }}>{p.a}</span>
          </div>
        ))}
      </div>
      <div style={{ height: 40 }} />
    </div>
  );
}

function BigMetric({ value, unit, label, trend, up }) {
  return (
    <div style={{ flex: 1, background: '#fff', border: '1px solid var(--gray-200)', borderRadius: 18, boxShadow: 'var(--shadow-md)', padding: '16px' }}>
      <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--slate-500)', fontWeight: 600 }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 26, color: 'var(--slate-900)', marginTop: 4, whiteSpace: 'nowrap' }}>{value}{unit && <span style={{ fontSize: 13, color: 'var(--slate-400)', marginLeft: 4 }}>{unit}</span>}</div>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 3, marginTop: 6, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12, color: 'var(--credit)' }}>
        <Icon name="strategy" size={13} color="var(--credit)" />{trend}
      </div>
    </div>
  );
}

Object.assign(window, { MyStores, Dashboard });

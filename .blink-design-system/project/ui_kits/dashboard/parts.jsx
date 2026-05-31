// parts.jsx — shared dashboard UI primitives (faithful to repo) + demo data
function PageHeader({ title, description, actions }) {
  return (
    <div className="page-head">
      <div><h2>{title}</h2><p>{description}</p></div>
      {actions && <div className="head-actions">{actions}</div>}
    </div>
  );
}
function StatCard({ label, value, variant = 'primary', icon, change }) {
  return (
    <div className={`stat ${variant}`}>
      <div className="top">
        <span className="lbl">{label}</span>
        {icon && <span className="ic"><DIcon name={icon} style={{ width: 20, height: 20 }} /></span>}
      </div>
      <div className="val">{typeof value === 'number' ? value.toLocaleString() : value}</div>
      {change && <div className="chg">{change}</div>}
    </div>
  );
}
function Card({ title, description, children, pad = true }) {
  return (
    <div className="card">
      {(title || description) && <div className="card-head"><h3>{title}</h3>{description && <p>{description}</p>}</div>}
      {children}
    </div>
  );
}
function Badge({ variant = 'default', children }) {
  return <span className={`badge ${variant}`}>{children}</span>;
}
function Toolbar({ placeholder, onAdd, addLabel }) {
  return (
    <div className="toolbar">
      <div className="search"><DIcon name="search" style={{ width: 16, height: 16 }} /><input placeholder={placeholder || 'Search'} /></div>
      <button className="btn"><DIcon name="filter" style={{ width: 16, height: 16 }} />Filter</button>
      <button className="btn"><DIcon name="download" style={{ width: 16, height: 16 }} />Export</button>
      {onAdd && <button className="btn btn--primary" onClick={onAdd} style={{ marginInlineStart: 'auto' }}><DIcon name="plus" style={{ width: 16, height: 16 }} />{addLabel}</button>}
    </div>
  );
}
function DataTable({ columns, data, empty }) {
  return (
    <div className="table-wrap">
      <table>
        <thead><tr>{columns.map(c => <th key={c.key} style={c.thStyle}>{c.label}</th>)}</tr></thead>
        <tbody>
          {!data.length ? (
            <tr><td colSpan={columns.length} className="empty">{empty || 'No data found.'}</td></tr>
          ) : data.map((row, i) => (
            <tr key={i}>{columns.map(c => <td key={c.key} className={c.tdClass}>{c.render ? c.render(row) : (row[c.key] ?? '—')}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function Avatar({ name }) {
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('');
  return <span className="av">{initials}</span>;
}

// ---- trilingual content helper (Arabic / French / English) ----
const LANGS = [['en', 'English'], ['fr', 'Français'], ['ar', 'العربية']];
const emptyLang = () => ({ en: '', fr: '', ar: '' });
function LangTabs({ active, onChange, filled }) {
  return (
    <div className="lang-tabs">
      {LANGS.map(([id, lbl]) => (
        <button key={id} className={`lang-tab ${active === id ? 'on' : ''}`} onClick={() => onChange(id)}>
          {id.toUpperCase()}<span className="ll">{lbl}</span>
          {filled && filled[id] && <span className="dot-f"></span>}
        </button>
      ))}
    </div>
  );
}
const dirFor = (lang) => (lang === 'ar' ? 'rtl' : 'ltr');

// ---------- demo data ----------
const DATA = {
  stats: { users: 18420, riders: 3214, orders: 9876, trips: 5432, transactions: 12050 },
  orders: [
    { store: 'Le Gourmet', type: 'food', status: 'delivered', total: 2450, items: 3, date: 'May 31' },
    { store: 'Pharmacie Centrale', type: 'marketplace', status: 'on_the_way', total: 1280, items: 2, date: 'May 31' },
    { store: 'Karim Électro', type: 'marketplace', status: 'preparation', total: 5800, items: 1, date: 'May 31' },
    { store: 'Pizza Roma', type: 'food', status: 'searching', total: 1900, items: 4, date: 'May 30' },
    { store: 'Express Parcel', type: 'courier', status: 'pickup', total: 450, items: 1, date: 'May 30' },
    { store: 'Superette Nour', type: 'marketplace', status: 'canceled', total: 3200, items: 7, date: 'May 30' },
    { store: 'Tacos Bla Bla', type: 'food', status: 'merchant_rejected', total: 1600, items: 2, date: 'May 29' },
    { store: 'Le Gourmet', type: 'food', status: 'heading_to_store', total: 2750, items: 3, date: 'May 29' },
  ],
  riders: [
    { rider_id: 'RDR-2041', name: 'Yacine Haddad', phone: '+213 661 22 33 44', wilaya: 'Algiers', vehicle: 'motorcycle' },
    { rider_id: 'RDR-2042', name: 'Mohamed Saïdi', phone: '+213 770 11 88 99', wilaya: 'Oran', vehicle: 'car' },
    { rider_id: 'RDR-2043', name: 'Amine Belkacem', phone: '+213 555 44 22 11', wilaya: 'Constantine', vehicle: 'motorcycle' },
    { rider_id: 'RDR-2044', name: 'Sofiane Brahimi', phone: '+213 662 99 00 11', wilaya: 'Annaba', vehicle: 'bicycle' },
    { rider_id: 'RDR-2045', name: 'Riad Mansouri', phone: '+213 771 33 44 55', wilaya: 'Blida', vehicle: 'motorcycle' },
    { rider_id: 'RDR-2046', name: 'Karim Benali', phone: '+213 550 12 34 56', wilaya: 'Sétif', vehicle: 'car' },
  ],
  trips: [
    { id: 'TRP-8821', pickup: 'Bab Ezzouar, Algiers', dropoff: 'Rouiba Centre', status: 'completed', distance: 12.4, payout: 480 },
    { id: 'TRP-8822', pickup: 'El Harrach Station', dropoff: 'Place des Martyrs', status: 'upcoming', distance: 8.1, payout: 320 },
    { id: 'TRP-8823', pickup: 'Hydra', dropoff: 'Cheraga', status: 'under_review', distance: 6.7, payout: 290 },
    { id: 'TRP-8824', pickup: 'Kouba', dropoff: 'Bir Mourad Raïs', status: 'completed', distance: 4.2, payout: 210 },
    { id: 'TRP-8825', pickup: 'Dely Ibrahim', dropoff: 'Ben Aknoun', status: 'canceled', distance: 3.0, payout: 0 },
    { id: 'TRP-8826', pickup: 'Bab El Oued', dropoff: 'Bologhine', status: 'completed', distance: 5.5, payout: 250 },
  ],
  transactions: [
    { type: 'deposit', method: 'Agent · QR', amount: 5000, fees: 0, total: 5000, status: 'completed' },
    { type: 'withdrawal', method: 'Agent · Cash', amount: 3000, fees: 100, total: 2900, status: 'completed' },
    { type: 'deposit', method: 'CIB Card', amount: 8000, fees: 80, total: 7920, status: 'completed' },
    { type: 'withdrawal', method: 'BaridiMob', amount: 1500, fees: 50, total: 1450, status: 'pending' },
    { type: 'deposit', method: 'Agent · QR', amount: 2450, fees: 0, total: 2450, status: 'completed' },
    { type: 'withdrawal', method: 'Agent · Cash', amount: 6000, fees: 150, total: 5850, status: 'failed' },
  ],
  agents: [
    { shop: 'Superette El Baraka', phone: '+213 661 00 11 22', status: 'open', hours: '08:00 – 22:00', rating: 4.8, address: 'Bab Ezzouar, Algiers' },
    { shop: 'Kiosque Nour', phone: '+213 770 33 44 55', status: 'open', hours: '07:00 – 23:00', rating: 4.6, address: 'El Harrach, Algiers' },
    { shop: 'Tabac Presse Centrale', phone: '+213 555 66 77 88', status: 'closed', hours: '09:00 – 18:00', rating: 4.2, address: 'Rouiba, Algiers' },
    { shop: 'Alimentation Générale Sofiane', phone: '+213 662 12 34 56', status: 'open', hours: '08:30 – 21:30', rating: 4.9, address: 'Cheraga, Algiers' },
  ],
  users: [
    { name: 'Lina Cherif', phone: '+213 661 11 22 33', role: 'customer', gender: 'female', status: 'active' },
    { name: 'Karim Benali', phone: '+213 550 12 34 56', role: 'merchant', gender: 'male', status: 'active' },
    { name: 'Yacine Haddad', phone: '+213 661 22 33 44', role: 'rider', gender: 'male', status: 'active' },
    { name: 'Superette El Baraka', phone: '+213 661 00 11 22', role: 'agent', gender: '—', status: 'active' },
    { name: 'Nadia Boudiaf', phone: '+213 770 99 88 77', role: 'customer', gender: 'female', status: 'inactive' },
    { name: 'Omar Ziani', phone: '+213 555 77 66 55', role: 'customer', gender: 'male', status: 'active' },
  ],
  notifications: [
    { type: 'order', title: 'New order received', desc: 'Order #4821 placed at Le Gourmet', read: true },
    { type: 'rider', title: 'New rider signup', desc: 'Yacine Haddad completed verification', read: true },
    { type: 'dispute', title: 'Dispute filed', desc: 'Order #4790 — item missing', read: false },
    { type: 'promo', title: 'Promotion launched', desc: '30% off all rides — weekend drop', read: true },
  ],
};

Object.assign(window, { PageHeader, StatCard, Card, Badge, Toolbar, DataTable, Avatar, DATA, LangTabs, LANGS, emptyLang, dirFor });

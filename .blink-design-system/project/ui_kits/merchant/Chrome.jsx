// Chrome.jsx — shared shell: StatusBar, TopBar, BottomNav, Sheet
const { useState } = React;

function StatusBar({ dark = false }) {
  const col = dark ? '#fff' : 'var(--slate-900)';
  return (
    <div style={{
      height: 50, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 26px 0 30px', flexShrink: 0,
    }}>
      <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 16, color: col }}>9:41</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <svg width="18" height="12" viewBox="0 0 18 12" fill={col}><rect x="0" y="7" width="3" height="5" rx="1"/><rect x="5" y="4" width="3" height="8" rx="1"/><rect x="10" y="1.5" width="3" height="10.5" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1" opacity="0.4"/></svg>
        <svg width="17" height="12" viewBox="0 0 17 12" fill={col}><path d="M8.5 2.5c2.3 0 4.4.9 6 2.4l1.2-1.3A10.4 10.4 0 0 0 8.5 .8 10.4 10.4 0 0 0 1.3 3.6L2.5 4.9a8.5 8.5 0 0 1 6-2.4z" opacity="0.9"/><path d="M8.5 6c1.2 0 2.3.5 3.1 1.3l1.2-1.3A6.3 6.3 0 0 0 8.5 4.3 6.3 6.3 0 0 0 4.2 6l1.2 1.3A4.4 4.4 0 0 1 8.5 6z"/><circle cx="8.5" cy="10" r="1.6"/></svg>
        <svg width="26" height="13" viewBox="0 0 26 13" fill="none"><rect x="0.5" y="0.5" width="22" height="12" rx="3.5" stroke={col} opacity="0.4"/><rect x="2" y="2" width="18" height="9" rx="2" fill={col}/><rect x="24" y="4" width="2" height="5" rx="1" fill={col} opacity="0.5"/></svg>
      </div>
    </div>
  );
}

// Centered-title top bar (Earnings / Profile sub-pages)
function TopBar({ title, onBack, right, titlePink = false }) {
  return (
    <div style={{
      height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 20px', background: '#fff', borderBottom: '1px solid var(--slate-100)', flexShrink: 0,
    }}>
      <button onClick={onBack} style={iconBtn}>
        {onBack ? <Icon name="arrowLeft" size={24} color="var(--slate-900)" /> : <span style={{width:24}} />}
      </button>
      <span style={{
        fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18,
        letterSpacing: '0.02em', color: titlePink ? 'var(--blink-500)' : 'var(--slate-900)',
      }}>{title}</span>
      <div style={{ width: 24, display: 'flex', justifyContent: 'flex-end' }}>{right || <span style={{width:24}} />}</div>
    </div>
  );
}

const iconBtn = {
  background: 'none', border: 'none', padding: 0, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};

const NAV = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'cash', label: 'Blink Cash', icon: 'cash' },
  { id: 'profile', label: 'Profile', icon: 'user' },
  { id: 'earnings', label: 'Earnings', icon: 'dollar' },
];

function BottomNav({ active, onNav }) {
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 0,
      background: '#fff', borderTop: '1px solid var(--slate-100)',
      padding: '10px 14px 26px', display: 'flex', alignItems: 'center',
      justifyContent: 'space-around', zIndex: 20,
      boxShadow: '0 -4px 20px rgba(0,0,0,0.04)',
    }}>
      {NAV.map(n => {
        const on = active === n.id;
        return (
          <button key={n.id} onClick={() => onNav(n.id)} style={{
            ...iconBtn, flexDirection: 'column', gap: 4, padding: '6px 14px',
            borderRadius: 999, background: on ? 'var(--blink-tint-50)' : 'transparent',
          }}>
            <Icon name={n.icon} size={23} color={on ? 'var(--blink-500)' : 'var(--slate-400)'} strokeWidth={on ? 2.4 : 2} />
            <span style={{
              fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: on ? 700 : 500,
              color: on ? 'var(--blink-500)' : 'var(--slate-400)',
            }}>{n.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// Bottom sheet overlay
function Sheet({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{
      position: 'absolute', inset: 0, zIndex: 60, background: 'rgba(15,23,42,0.5)',
      display: 'flex', alignItems: 'flex-end', borderRadius: 'inherit', overflow: 'hidden',
      animation: 'fadeIn .2s ease',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', background: '#fff', borderRadius: '24px 24px 0 0',
        padding: '14px 22px 30px', animation: 'slideUp .26s cubic-bezier(.2,.8,.2,1)',
      }}>
        <div style={{ width: 40, height: 4, borderRadius: 99, background: 'var(--slate-200)', margin: '0 auto 16px' }} />
        {title && <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--slate-900)', margin: '0 0 16px', letterSpacing: '0.02em' }}>{title}</h3>}
        {children}
      </div>
    </div>
  );
}

Object.assign(window, { StatusBar, TopBar, BottomNav, Sheet, iconBtn, NAV });
